import test from 'blue-tape'
import { spy } from 'sinon'

import rateLimit from '../../lib/rate-limit'
import promisedWait from '../../lib/promised-wait'

test('Rate limiting simple test', (t) => {
  const client = {
    currentCount: 0,
    increment: function () {
      this.currentCount = this.currentCount + 1
      return this.currentCount
    }
  }
  const incrementSpy = spy(client, 'increment')
  const limitedClient = rateLimit(client, ['increment'], 2, 100)
  const results = []

  // Queue up 10 calls
  for (let i = 0; i < 10; i++) {
    limitedClient.increment().then(results.push.bind(results))
  }

  return promisedWait(50).then(() => {
    t.equals(incrementSpy.callCount, 2, 'requests made after first queuing')
    t.equals(client.currentCount, 2, 'execution context is not changed since internal counter is working as expected')
    t.looseEqual(results, [1, 2], 'returned expected results within first period')
  })
  .then(() => promisedWait(100))
  .then(() => {
    t.equals(incrementSpy.callCount, 4, 'requests made within second period')
    t.looseEqual(results, [1, 2, 3, 4], 'returned expected results within second period')
  })
  .then(() => promisedWait(200))
  .then(() => {
    t.equals(incrementSpy.callCount, 8, 'requests made within fourth period')
    t.looseEqual(results, [1, 2, 3, 4, 5, 6, 7, 8], 'returned expected results within fourth period')
  })
  .then(() => promisedWait(500))
  .then(() => {
    t.equals(incrementSpy.callCount, 10, 'all requests made after enough time')
    t.looseEqual(results, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'returned expected results after enough time')
  })
})

test('Rate limiting complex test', (t) => {
  const client = {
    get: () => {},
    post: () => {}
  }
  const getSpy = spy(client, 'get')
  const postSpy = spy(client, 'post')

  const limitedClient = rateLimit(client, ['get', 'post'], 2, 100)

  limitedClient.get()
  limitedClient.post()

  t.equals(getSpy.callCount, 1, 'immediately called get method')
  t.equals(postSpy.callCount, 1, 'immediately called post method')

  limitedClient.get()

  t.equals(getSpy.callCount, 1, 'did not call get method immediately since limit is reached')
  t.equals(postSpy.callCount, 1, 'did not call post method again since it was not called')

  return promisedWait(100)
  .then(() => {
    t.equals(getSpy.callCount, 2, 'did call get method the second time since one more period is over')
    limitedClient.post()
    limitedClient.post()
    limitedClient.post()
    t.equals(postSpy.callCount, 2, 'did call post method once since there is only 1 slot left this period')
  })
  .then(() => promisedWait(100))
  .then(() => {
    t.equals(postSpy.callCount, 4, 'did finish the queue of post calls in the next period')
  })
})

test('Rate limiting error catching test', (t) => {
  const testError = new Error('test error')
  const rejectionError = new Error('test rejection')
  const client = {
    throwsError: () => { throw testError },
    returnsRejection: () => Promise.reject(rejectionError)
  }
  const limitedClient = rateLimit(client, ['throwsError', 'returnsRejection'], 2, 100)

  t.shouldFail(limitedClient.throwsError(), testError)
  t.shouldFail(limitedClient.returnsRejection(), rejectionError)

  t.end()
})
