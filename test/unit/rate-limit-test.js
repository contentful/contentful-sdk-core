import test from 'blue-tape'
import rateLimit from '../../lib/rate-limit'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
let mock
let maxRetry = 2
function setup () {
  mock = new MockAdapter(axios)
  rateLimit(axios, 2)
}
function teardown () {
  mock.reset()
}
test('Retry on 429', (t) => {
  setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', {'x-contentful-rateLimit-reset': 2})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  t.plan(2)
  return axios.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    teardown()
  })
})
test('Retry after a duration >= rateLimit header', (t) => {
  setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', {'x-contentful-rateLimit-reset': 2})
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
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  t.plan(2)
  return axios.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    teardown()
  })
})
test('Should Fail if it hits maxRetries', (t) => {
  setup()
  for (let i = 0; i < maxRetry + 1; i++) {
    if (i === maxRetry) {
      mock.onGet('/error').replyOnce(200, 'should fail before caprturing this')
    }
    mock.onGet('/error').replyOnce(500, `error attempt ${i + 1}`)
  }
  t.plan(1)
  return axios.get('/error').then((response) => {
    t.fail('the request should return error')
  }).catch((error) => {
    t.ok(error)
    teardown()
  })
})

