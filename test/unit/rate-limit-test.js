import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import test from 'blue-tape'
import sinon from 'sinon'

import rateLimit from '../../lib/rate-limit'

const logHandlerStub = sinon.stub()

const mock = new MockAdapter(axios)

function setup () {
  const client = axios.create({
    logHandler: logHandlerStub,
    retryOnError: true
  })
  rateLimit(client)
  return { client }
}

function setupWithoutErrorRetry () {
  const client = axios.create({
    logHandler: logHandlerStub,
    retryOnError: false
  })
  rateLimit(client)
  return { client }
}
function setupWithOneRetry () {
  const client = axios.create({
    logHandler: logHandlerStub,
    retryOnError: true
  })
  rateLimit(client, 1)
  return { client }
}
function teardown () {
  logHandlerStub.reset()
  mock.reset()
}
test('Retry on 429 after a duration >= rateLimit header', (t) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', {'x-contentful-ratelimit-reset': 4})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  const startTime = Date.now()
  t.plan(6)
  return client.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    t.equals(logHandlerStub.callCount, 1)
    t.equals(logHandlerStub.args[0][0], 'warning')
    t.ok(logHandlerStub.args[0][1].includes, 'Rate limit error occurred.')
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

test('Retry on network error', (t) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/rate-limit-me').networkError()

  return client.get('/rate-limit-me')
    .then((response) => {
      t.fail('should not succeed')
      teardown()
    })
    .catch((error) => {
      t.equals(error.attempts, 2, 'logs two attempts, one initial and one retry')
      teardown()
    })
})

test('no retry when automatic handling flag is disabled', (t) => {
  const { client } = setupWithoutErrorRetry()
  mock.onGet('/rate-limit-me').replyOnce(500, 'Mocked 500 Error', {'x-contentful-request-id': 3})
  mock.onGet('/rate-limit-me').replyOnce(200, 'would work but retry is disabled', {'x-contentful-request-id': 4})

  return client.get('/rate-limit-me')
    .then((response) => {
      t.fail('Promise should reject not resolve')
      teardown()
    })
    .catch((error) => {
      t.equals(error.response.status, 500)
      t.equals(error.response.headers['x-contentful-request-id'], 3)
      t.equals(error.response.data, 'Mocked 500 Error')
      t.equals(logHandlerStub.callCount, 0, 'did not log anything')
      t.equals(error.message, 'Request failed with status code 500')
      t.equals(error.attempts, undefined)
      teardown()
    })
})
test('Should Fail if it hits maxRetries', (t) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt #1', {'x-contentful-request-id': 4})
  mock.onGet('/error').replyOnce(501, 'error attempt #2', {'x-contentful-request-id': 4})
  mock.onGet('/error').replyOnce(200, 'should not be there', {'x-contentful-request-id': 4})

  return client.get('/error')
    .then((response) => {
      t.fail('the request should return error')
      teardown()
    })
    .catch((error) => {
      t.ok(error)
      t.equals(error.response.data, 'error attempt #2', 'returned error since maxRetries was reached')
      t.equals(logHandlerStub.callCount, 1)
      t.equals(logHandlerStub.args[0][0], 'warning', 'logs a retry warning')
      t.equals(error.message, 'Request failed with status code 501')
      t.equals(error.attempts, 2, 'logs the correct amounth of attempts')
      teardown()
    })
})
test('Rejects error straight away when X-Contentful-Request-Id header is missing', (t) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')

  return client.get('/error')
    .then((response) => {
      t.fail('the request should return error')
      teardown()
    }).catch((error) => {
      t.ok(error)
      t.equals(error.response.data, 'error attempt')
      t.equals(logHandlerStub.callCount, 0, 'did not log anything')
      t.equals(error.message, 'Request failed with status code 500')
      t.equals(error.attempts, 1)
      teardown()
    })
})
test('Rejects errors with strange status codes', (t) => {
  const { client } = setup()
  mock.onGet('/error').replyOnce(765, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')

  return client.get('/error')
    .then((response) => {
      t.fail('the request should return error')
      teardown()
    }).catch((error) => {
      t.ok(error)
      t.equals(error.response.data, 'error attempt')
      t.equals(logHandlerStub.callCount, 0, 'did not log anything')
      teardown()
    })
})
