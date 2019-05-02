const defaultsByInstance = new Map()
let networkErrorAttempts = 0
let retryAttemps = 0

export default function rateLimit (instance, defaults, maxRetry = 5) {
  defaultsByInstance.set(instance, defaults)
  const instanceDefaults = defaultsByInstance.get(instance)
  const {
    responseLogger = () => undefined,
    requestLogger = () => undefined
  } = instanceDefaults

  instance.interceptors.request.use(
    function (config) {
      requestLogger(config)
      return config
    },
    function (error) {
      return Promise.reject(error)
    }
  )

  instance.interceptors.response.use(
    function (response) {
      // we don't need to do anything here
      retryAttemps = 0 // reset when a response is a success
      responseLogger(response)
      return response
    },
    function (error) {
      let { response, config } = error
      // Do not retry if it is disabled or no request config exists (not an axios error)
      if (!config || !instanceDefaults.retryOnError) {
        return Promise.reject(error)
      }

      let retryErrorType = null
      let wait = 0

      // Errors without response did not recieve anything from the server
      if (!response) {
        retryErrorType = 'Connection'
        networkErrorAttempts++

        if (networkErrorAttempts > maxRetry) {
          error.attempts = networkErrorAttempts
          return Promise.reject(error)
        }

        wait = Math.pow(Math.SQRT2, networkErrorAttempts)
        response = {}
      } else {
        networkErrorAttempts = 0
      }

      // we reject if there are too much errors of with the same request id

      if (response.status >= 500 && response.status < 600) {
        // 5** errors are server related
        retryErrorType = `Server ${response.status}`
        retryAttemps++

        wait = Math.pow(Math.SQRT2, retryAttemps)
      } else if (response.status === 429) {
        // 429 errors are exceeded rate limit exceptions
        retryErrorType = 'Rate limit'
        retryAttemps++
        // all headers are lowercased by axios https://github.com/mzabriskie/axios/issues/413
        if (
          response.headers &&
          error.response.headers['x-contentful-ratelimit-reset']
        ) {
          wait = response.headers['x-contentful-ratelimit-reset']
        }
      }

      if (retryAttemps > maxRetry) {
        error.attempts = retryAttemps
        return Promise.reject(error)
      }

      const delay = ms =>
        new Promise(resolve => {
          setTimeout(resolve, ms)
        })

      if (retryErrorType) {
        // convert to ms and add jitter
        wait = Math.floor(wait * 1000 + Math.random() * 200 + 500)
        instanceDefaults.logHandler(
          'warning',
          `${retryErrorType} error occurred. Waiting for ${wait} ms before retrying...`
        )

        /* Somehow between the interceptor and retrying the request the httpAgent/httpsAgent gets transformed from an Agent-like object
         to a regular object, causing failures on retries after rate limits. Removing these properties here fixes the error, but retry
         requests still use the original http/httpsAgent property */
        delete config.httpAgent
        delete config.httpsAgent

        return delay(wait).then(() => instance(config))
      }
      return Promise.reject(error)
    }
  )
}
