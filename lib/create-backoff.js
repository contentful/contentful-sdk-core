import promisedWait from './promised-wait'

/**
 * Returns a wrapper method which waits a given amount of time before calling
 * wrapped method.
 * If the call to the wrapped method fails, retries `maxRetries` times, and if
 * all those fail, it returns a rejected promise.
 * @private
 * @param {number} maxRetries - max number of retries before aborting
 */
export default function createBackoff (maxRetries) {
  let attempt = 0
  return function maybeRetry (error, retry) {
    if (attempt < maxRetries) {
      let waitTime = error.headers['X-Contentful-RateLimit-Reset'] || Math.pow(2, attempt)
      attempt++
      waitTime *= 1000
      return promisedWait(waitTime).then(retry)
    } else {
      return Promise.reject(error)
    }
  }
}
