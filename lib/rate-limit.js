import { Promise } from 'es6-promise'

/**
 * Promise-based rate limiting for a given set of methods of one object.
 * Assumes that the limited functions will return a Promise.
 * Calls made to any wrapped function will be stored in a single queue.
 * If more calls are added at once than the allowed level of concurrency, it
 * waits until a certain amount of time has passed before continuing to clear
 * calls from the queue.
 * @private
 * @param {object} client - client object whose methods should be limited
 * @param {array} methodsToLimit - Array of methods which should be limited
 * @param {number} concurrency - Number of allowed concurrent requests
 * @param {number} delay - Delay in milliseconds for waiting after hitting the
 */
export default function rateLimit (client, methodsToLimit, concurrency, delay) {
  // Wrapper function to limit given methods.
  const enqueue = (method) => {
    return () => {
      return new Promise((resolve) => {
        queue.push({
          args: Array.prototype.slice.call(arguments),
          method: method,
          cb: resolve
        })
        dequeue()
      })
    }
  }

  // Start dequeuing after timeout finished
  const dequeueViaTimeout = () => {
    timeoutActive = false
    dequeue()
  }

  // Process the next item in the queue
  const dequeue = () => {
    if (timeoutActive) {
      return
    }
    const now = Date.now()

    // Identify a new period and reset the counter
    if (now >= lastQueueExecution + delay) {
      lastCallCount = 0
      lastQueueExecution = now
    }

    // Call one item when limit is not reached
    if (queue.length && lastCallCount < concurrency) {
      const toCall = queue.shift()
      const result = toCall.method.apply(client, toCall.args)
      toCall.cb(result)
      lastCallCount++
    }

    // Clear everything when the queue is empty now.
    if (queue.length === 0) {
      clearTimeout(timeout)
      timeoutActive = false
      return
    }

    if (lastCallCount < concurrency) {
      // Process another item since limit is not reached.
      dequeue()
    } else if (!timeoutActive) {
      // Wait for the given period and process the next item after.
      timeout = setTimeout(dequeueViaTimeout, delay)
      timeoutActive = true
    }
  }

  let queue = []
  let lastQueueExecution = 0
  let lastCallCount = 0
  let timeout = null
  let timeoutActive = false

  methodsToLimit.forEach((methodName) => {
    client[methodName] = enqueue(client[methodName])
  })

  return client
}
