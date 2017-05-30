export default function rateLimit (instance, maxRetry = 10) {
  let attempt = 0
  let lastErrorAt

  instance.interceptors.response.use(function (response) {
    // we don't need to do anything here
    return response
  }, function (error) {
    const {config} = error
    if (!config || !instance.defaults.retryOnError) {
      return Promise.reject(error)
    }
    // in axios reponse will be available only if there a response from server
    // in this case will assume it is a 500 error
    error.response = error.response || {status: 500}
    if (error.response.status === 500) {
      attempt++
      lastErrorAt = lastErrorAt || Date.now()
      lastErrorAt = Date.now()
      // we reject if there are too much errors in a short period of time
      if (attempt >= maxRetry) {
        return Promise.reject(error)
      }
    }

    // retry if we receive 429 or 500
    if (error.response.status === 429 || error.response.status === 500) {
      let rateLimitHeaderValue = 0
      // all headers are lowercased by axios https://github.com/mzabriskie/axios/issues/413
      if (error.response.headers && error.response.headers['x-contentful-ratelimit-reset']) {
        rateLimitHeaderValue = error.response.headers['x-contentful-ratelimit-reset']
      }
      let wait = rateLimitHeaderValue > 0 ? rateLimitHeaderValue : Math.pow(Math.SQRT2, attempt)
      // convert to ms and add jitter
      wait = Math.floor(wait * 1000 + (Math.random() * 200) + 500)
      console.log(`${error.response.status === 429 ? 'Rate limit' : 'Server'} error occured. Waiting for ${wait} ms before retrying....`)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(instance(config))
        }, wait)
      })
    }
    return Promise.reject(error)
  })
}
