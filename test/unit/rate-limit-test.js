import test from 'blue-tape'
import rateLimit from '../../lib/rate-limit'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

function setup () {
  const client = axios.create({ retryOnError: true })
  rateLimit(client)
  return { client }
}

function setupWithoutErrorRetry () {
  const client = axios.create({ retryOnError: false })
  rateLimit(client)
  return { client }
}
function setupWithOneRetry () {
  const client = axios.create({ retryOnError: true })
  rateLimit(client, 2)
  return { client }
}
function teardown () {
  mock.reset()
}
test('Retry on 429 after a duration >= rateLimit header', (t) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', {'x-contentful-ratelimit-reset': 4})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  const startTime = Date.now()
  t.plan(3)
  return client.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    t.ok(Date.now() - startTime >= 4000)
    teardown()
  })
})
test('Retry on 5** - multiple errors', (t) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', {'x-contentful-request-id': 1})
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', {'x-contentful-request-id': 1})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works #1')
  mock.onGet('/rate-limit-me').replyOnce(503, 'Another Server Error', {'x-contentful-request-id': 2})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works #2')
  t.plan(5)
  return client.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works #1')
    const startTime = Date.now()
    return client.get('/rate-limit-me').then((response) => {
      t.ok(Date.now() - startTime <= 3000, 'First error should not influence second errors retry delay')
      t.ok(response.data)
      t.equals(response.data, 'works #2')
      teardown()
    })
  })
})
// Disabled till new version of axios-mock-adapter is out
// https://github.com/ctimmerm/axios-mock-adapter/issues/52
test.skip('Retry on network error', (t) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').networkError()
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  t.plan(2)
  return client.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    teardown()
  })
})
test('no retry when automatic handling flag is disabled', (t) => {
  const { client } = setupWithoutErrorRetry()
  const responseError = new Error('Mocked 500 Error')
  mock.onGet('/rate-limit-me').replyOnce(500, responseError, {'x-contentful-request-id': 3})
  t.plan(2)
  return client.get('/rate-limit-me').then((response) => {
    t.fail('Promise should reject not resolve')
    teardown()
  })
  .catch((error) => {
    t.equals(error.response.status, 500)
    t.equals(error.response.data, responseError)
    teardown()
  })
})
test('Should Fail if it hits maxRetries', (t) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt #1', {'x-contentful-request-id': 4})
  mock.onGet('/error').replyOnce(500, 'error attempt #2', {'x-contentful-request-id': 4})
  t.plan(2)
  return client.get('/error').then((response) => {
    t.fail('the request should return error')
    teardown()
  }).catch((error) => {
    t.ok(error)
    t.equals(error.response.data, 'error attempt #2')
    teardown()
  })
})
test('Rejects error straight away when X-Contentful-Request-Id header is missing', (t) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')
  t.plan(2)
  return client.get('/error').then((response) => {
    t.fail('the request should return error')
    teardown()
  }).catch((error) => {
    t.ok(error)
    t.equals(error.response.data, 'error attempt')
    teardown()
  })
})
test('Rejects errors with strange status codes', (t) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(765, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')
  t.plan(2)
  return client.get('/error').then((response) => {
    t.fail('the request should return error')
    teardown()
  }).catch((error) => {
    t.ok(error)
    t.equals(error.response.data, 'error attempt')
    teardown()
  })
})
