import test from 'blue-tape'
import rateLimit from '../../lib/rate-limit'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

let mock

function setup () {
  axios.defaults.retryOnError = true
  mock = new MockAdapter(axios)
  rateLimit(axios)
}

function setupWithoutErrorRetry () {
  axios.defaults.retryOnError = false
  mock = new MockAdapter(axios)
  rateLimit(axios)
}
function setupWithOneRetry () {
  axios.defaults.retryOnError = true
  mock = new MockAdapter(axios)
  rateLimit(axios, 1)
}
function teardown () {
  mock.reset()
}
test('Retry on 429 after a duration >= rateLimit header', (t) => {
  setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', {'x-contentful-ratelimit-reset': 4})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  const startTime = Date.now()
  t.plan(3)
  return axios.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    t.ok(Date.now() - startTime >= 2000)
    teardown()
  })
})
test('Retry on 500', (t) => {
  setup()
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  t.plan(2)
  return axios.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    teardown()
  })
})
test('No-Retry when automatic handling flag is disabled', (t) => {
  setupWithoutErrorRetry()
  const responseError = new Error('Mocked 500 Error')
  mock.onGet('/rate-limit-me').replyOnce(500, responseError)
  t.plan(2)
  return axios.get('/rate-limit-me').then((response) => {
    t.fail('Promise should reject not resolve')
    teardown()
  })
  .catch((err) => {
    t.equals(err.response.status, 500)
    t.equals(err.response.data, responseError)
    teardown()
  })
})
test('Should Fail if it hits maxRetries', (t) => {
  setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt #1')
  mock.onGet('/error').replyOnce(500, 'error attempt #2')
  t.plan(1)
  return axios.get('/error').then((response) => {
    t.fail('the request should return error')
  }).catch((error) => {
    t.ok(error)
    teardown()
  })
})
