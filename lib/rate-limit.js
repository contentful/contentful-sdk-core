const attempts = {}
const defaultsByInstance = new Map()
let networkErrorAttempts = 0

export default function rateLimit (instance, defaults, maxRetry = 5) {
  defaultsByInstance.set(instance, defaults)
  const instanceDefaults = defaultsByInstance.get(instance)
  const { responseLogger = () => undefined, requestLogger = () => undefined } = instanceDefaults

  instance.interceptors.request.use(function (config) {
    requestLogger(config)
    return config
  }, function (error) {
    return Promise.reject(error)
  })

  instance.interceptors.response.use(function (response) {
    // we don't need to do anything here
    responseLogger(response)
    return response
  }, function (error) {
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

    if (response.status >= 500 && response.status < 600) {
      // 5** errors are server related
      retryErrorType = `Server ${response.status}`
      const headers = response.headers || {}
      const requestId = headers['x-contentful-request-id'] || null
      attempts[requestId] = attempts[requestId] || 0
      attempts[requestId]++

      // we reject if there are too much errors of with the same request id
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

    const delay = ms => new Promise((resolve) => {
      setTimeout(resolve, ms)
    })

    if (retryErrorType) {
      // convert to ms and add jitter
      wait = Math.floor(wait * 1000 + (Math.random() * 200) + 500)
      instanceDefaults.logHandler('warning', `${retryErrorType} error occurred. Waiting for ${wait} ms before retrying...`)
      return delay(wait).then(() => instance(config))
    }
    return Promise.reject(error)
  })
}
