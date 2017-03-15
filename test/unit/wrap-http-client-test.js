import test from 'tape'
import sinon from 'sinon'
import reduce from 'lodash/reduce'
import wrapHttpClient from '../../lib/wrap-http-client'

function createHttpMock () {
  return reduce(
    ['get', 'post', 'put', 'delete', 'patch', 'head'],
    (mock, methodName) => {
      mock[methodName] = sinon.stub()
      return mock
    },
    {}
  )
}

test('Passes along HTTP client parameters', (t) => {
  const rateLimitStub = sinon.stub()
  const httpMock = createHttpMock()
  const concurrency = 2
  const delay = 500
  wrapHttpClient.__Rewire__('rateLimit', rateLimitStub)
  wrapHttpClient(httpMock, {
    concurrency,
    delay
  })
  t.equal(rateLimitStub.callCount, 1, 'rate limiter is executed')
  t.true(rateLimitStub.alwaysCalledWith(httpMock, ['get', 'post', 'put', 'delete', 'patch', 'head'], concurrency, delay), 'rate limiter config passed correctly')
  wrapHttpClient.__ResetDependency__('rateLimit')
  t.end()
})

test('Call doesnt get backed off', (t) => {
  const httpMock = createHttpMock()
  httpMock.get.onCall(0).returns(Promise.resolve(''))
  const http = wrapHttpClient(httpMock, {
    concurrency: 6,
    delay: 1000,
    maxRetries: 4,
    retryOnTooManyRequests: true
  })

  http.get()
  .then(() => {
    t.ok(httpMock.get.calledOnce, 'http get is called once')
    t.end()
  })
})

test('Call gets backed off first time but then succeeds', (t) => {
  const httpMock = createHttpMock()
  httpMock.get.onCall(0).returns(Promise.reject({status: 429}))
  httpMock.get.onCall(1).returns(Promise.resolve(''))
  const http = wrapHttpClient(httpMock, {
    concurrency: 6,
    delay: 1000,
    maxRetries: 4,
    retryOnTooManyRequests: true
  })

  http.get()
  .then(() => {
    t.ok(httpMock.get.calledTwice, 'http get is called twice')
    t.end()
  })
})

test('Call gets backed off until maxRetries is reached', (t) => {
  const httpMock = createHttpMock()
  httpMock.get.returns(Promise.reject({status: 429}))
  const http = wrapHttpClient(httpMock, {
    concurrency: 6,
    delay: 1000,
    maxRetries: 2,
    retryOnTooManyRequests: true
  })

  http.get()
  .then(
    () => {},
    () => {
      t.ok(httpMock.get.calledThrice, 'http get is called three times')
      t.end()
    }
  )
})

test('Call gets 5xx error first time but then succeeds', (t) => {
  const httpMock = createHttpMock()
  httpMock.get.onCall(0).returns(Promise.reject({status: 500}))
  httpMock.get.onCall(1).returns(Promise.resolve(''))
  const http = wrapHttpClient(httpMock, {
    concurrency: 6,
    delay: 1000,
    maxRetries: 4,
    retryOnTooManyRequests: true
  })

  http.get()
  .then(() => {
    t.ok(httpMock.get.calledTwice, 'http get is called twice')
    t.end()
  })
})

test('Call gets 5xx error until maxRetries is reached', (t) => {
  const httpMock = createHttpMock()
  httpMock.get.returns(Promise.reject({status: 500}))
  const http = wrapHttpClient(httpMock, {
    concurrency: 6,
    delay: 1000,
    maxRetries: 2,
    retryOnTooManyRequests: true
  })

  http.get()
  .then(
    () => {},
    () => {
      t.ok(httpMock.get.calledThrice, 'http get is called three times')
      t.end()
    }
  )
})
