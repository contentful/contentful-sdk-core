let attempt = 0
let lastErrorAt
export default function rateLimit (instance, maxRetry = 10) {
  instance.interceptors.response.use(function (response) {
    // we don't need to do anything here
    return response
  }, function (error) {
    const {config} = error
    if (!config) {
      return Promise.reject(error)
    }
    // in axios reponse will be available only if there a response from server
    // in this case will assume it is a 500 error
    error.response = error.response || {status: 500}

    if (error.response.status >= 500) {
      attempt++
      lastErrorAt = lastErrorAt || Date.now()
      if (Date.now() - lastErrorAt >= 30000) {
        // we reset the attempt here if there is a gap of 10 sec
        attempt = 0
      }
      lastErrorAt = Date.now()
      // we reject if there are too much errors in a short period of time
      if (attempt >= maxRetry) {
        return Promise.reject(error)
      }
    }

    // retry if we receive 429 or 500
    if (error.response.status === 429 || error.response.status >= 500) {
      var rateLimitHeaderValue = 0
      // all headers are lowercased by axios https://github.com/mzabriskie/axios/issues/413
      if (error.response.headers && error.response.headers['x-contentful-rateLimit-reset']) {
        rateLimitHeaderValue = error.response.headers['x-contentful-rateLimit-reset']
      }

      var wait = rateLimitHeaderValue || Math.pow(2, attempt)
      // convert to ms and add jitter
      wait *= Math.floor(1000 + ((Math.random() * 200) + 500))
      console.log(`---------------------------------------------------------`)
      console.log(`${error.response.status} error occured. Waiting for ${wait} ms before retrying....`)
      console.log(`---------------------------------------------------------`)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(instance(config))
        }, wait)
      })
    }
    return Promise.reject(error)
  })
}
