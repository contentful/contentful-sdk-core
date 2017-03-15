export default function rateLimit (instance, maxRetry = 10) {
  instance.interceptors.response.use(function (response) {
    // we don't need to do anything here
    return response
  }, function (error) {
    const {config} = error
    if (!config) {
      return Promise.reject(error)
    }
    config.attempt = config.attempt || 0
    if (error.response.status >= 500) {
      config.attempt++
      config.lastErrorAt = config.lastErrorAt || Date.now()
      if (Date.now() - config.lastErrorAt >= 10000) {
        // we reset the attempt here if there is a gap of 10 sec
        config.attempt = 0
      }
      config.lastErrorAt = Date.now()
      // we reject if there are too much errors in a short period of time
      if (config.attempt >= maxRetry) {
        return Promise.reject(error)
      }
    }

    // retry if we receive 429 or 500
    if (error.response.status === 429 || error.response.status >= 500) {
      var rateLimitHeaderValue = 0
      if (error.response.headers && error.response.headers['X-Contentful-RateLimit-Reset']) {
        rateLimitHeaderValue = error.response.headers['X-Contentful-RateLimit-Reset']
      }

      var wait = rateLimitHeaderValue || Math.pow(2, config.attempt)
      // convert to ms and add jitter
      wait *= Math.floor(1000 + ((Math.random() * 200) + 500))

      console.log(`Error occured. Waiting for ${wait}ms before retrying....`)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(instance(config))
        }, wait)
      })
    }
    return Promise.reject(error)
  })
}
