import test from 'blue-tape'
import createBackoff from '../../lib/create-backoff'

function setup (requestedWaits) {
  createBackoff.__Rewire__('promisedWait', (delay) => {
    requestedWaits.push(delay)
    return Promise.resolve()
  })
}

function teardown () {
  createBackoff.__ResetDependency__('promisedWait')
}

test('backoff on first 2 attempts', (t) => {
  const requestedWaits = []
  setup(requestedWaits)

  const backoff = createBackoff(3)
  const error = new Error('thrown after 3 tries')
  const attempt = function () {
    if (requestedWaits.length < 2) {
      return backoff(error, attempt)
    } else {
      return 'response'
    }
  }

  return attempt().then(function (response) {
    requestedWaits.filter((item) => {
      return item >= 1
    })
    t.equals(requestedWaits.length, 2)
    t.equals(response, 'response', 'returns expected response')
    teardown()
  })
})

test('backoff with ratelimit headers', (t) => {
  const requestedWaits = []
  setup(requestedWaits)
  const backoff = createBackoff(3)
  const error = {headers: {'X-Contentful-RateLimit-Reset': 2}}
  const attempt = function () {
    if (requestedWaits.length < 2) {
      return backoff(error, attempt)
    } else {
      return 'response'
    }
  }
  return attempt().then(function (response) {
    requestedWaits.filter((item) => {
      item < 2
    })
    t.equals(requestedWaits.length, 2)
    t.equals(response, 'response', 'returns expected response')
    teardown()
  })
})

test('backoff until request totally fails', (t) => {
  const requestedWaits = []
  setup(requestedWaits)

  const backoff = createBackoff(3)
  const error = new Error('thrown after 3 tries')
  const attempt = function () {
    return backoff(error, attempt)
  }

  return attempt().then(function () {
    throw new Error('should not succeed')
  }).catch(function (error) {
    requestedWaits.filter((item) => {
      return item >= 1
    })
    t.equals(requestedWaits.length, 3, 'wait periods for 3 attempts')
    t.equals(error.message, 'thrown after 3 tries', 'throws expected error')
    teardown()
  })
})
