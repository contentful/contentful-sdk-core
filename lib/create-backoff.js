import { Promise } from 'es6-promise'

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
      let waitTime = (error.headers && error.headers['X-Contentful-RateLimit-Reset']) || Math.pow(2, attempt)
      attempt++
      // add a randomized buffer before recalling the api
      // The random buffer ensure that not all the backed-off requests are resent at the same time
      waitTime *= 1000 * ((Math.random() * 1.2) + 1)
      return promisedWait(waitTime).then(retry)
    } else {
      return Promise.reject(error)
    }
  }
}
