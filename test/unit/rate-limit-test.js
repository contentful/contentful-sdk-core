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
test('Retry on 500', (t) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
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
  mock.onGet('/rate-limit-me').replyOnce(500, responseError)
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
  mock.onGet('/error').replyOnce(500, 'error attempt #1')
  mock.onGet('/error').replyOnce(500, 'error attempt #2')
  t.plan(2)
  return client.get('/error').then((response) => {
    t.fail('the request should return error')
  }).catch((error) => {
    t.ok(error)
    t.equals(error.response.data, 'error attempt #2')
    teardown()
  })
})
