import type { AxiosInstance } from './types'

const attempts: Record<string, number> = {}
let networkErrorAttempts = 0

function noop(): undefined {
  return undefined
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export default function rateLimit(instance: AxiosInstance, maxRetry = 5): void {
  const { responseLogger = noop, requestLogger = noop } = instance.defaults

  instance.interceptors.request.use(
    function (config) {
      requestLogger(config)
      return config
    },
    function (error) {
      requestLogger(error)
      return Promise.reject(error)
    }
  )

  instance.interceptors.response.use(
    function (response) {
      // we don't need to do anything here
      responseLogger(response)
      return response
    },
    function (error) {
      let { response } = error
      const { config } = error
      responseLogger(error)
      // Do not retry if it is disabled or no request config exists (not an axios error)
      if (!config || !instance.defaults.retryOnError) {
        return Promise.reject(error)
      }

      let retryErrorType = null
      let wait = 0

      // Errors without response did not receive anything from the server
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

      if (response.status >= 500 && response.status < 600) {
        // 5** errors are server related
        retryErrorType = `Server ${response.status}`
        const headers = response.headers || {}
        const requestId = headers['x-contentful-request-id'] || null
        attempts[requestId] = attempts[requestId] || 0
        attempts[requestId]++

        // we reject if there are too many errors with the same request id or request id is not defined
        if (attempts[requestId] > maxRetry || !requestId) {
          error.attempts = attempts[requestId]
          return Promise.reject(error)
        }
        wait = Math.pow(Math.SQRT2, attempts[requestId])
      } else if (response.status === 429) {
        // 429 errors are exceeded rate limit exceptions
        retryErrorType = 'Rate limit'
        // all headers are lowercased by axios https://github.com/mzabriskie/axios/issues/413
        if (response.headers && error.response.headers['x-contentful-ratelimit-reset']) {
          wait = response.headers['x-contentful-ratelimit-reset']
        }
      }

      if (retryErrorType) {
        // convert to ms and add jitter
        wait = Math.floor(wait * 1000 + Math.random() * 200 + 500)
        instance.defaults.logHandler(
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
