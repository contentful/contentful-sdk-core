import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import rateLimit from '../../src/rate-limit'

const logHandlerStub = jest.fn()

jest.setTimeout(50000)

const mock = new MockAdapter(axios)

function setup(options = {}) {
  const client = axios.create(
    Object.assign(
      {
        logHandler: logHandlerStub,
        retryOnError: true,
      },
      options
    )
  )
  rateLimit(client, options.retryLimit)
  return { client }
}

function setupWithoutErrorRetry() {
  const client = axios.create({
    retryOnError: false,
    logHandler: logHandlerStub,
  })
  rateLimit(client)
  return { client }
}

function setupWithOneRetry() {
  const client = axios.create({
    retryOnError: true,
    logHandler: logHandlerStub,
  })
  rateLimit(client, 1)
  return { client }
}

function setupWithNonAxiosError() {
  const client = axios.create({
    logHandler: logHandlerStub,
    retryOnError: true,
  })
  client.interceptors.response.use(function (response) {
    return Promise.reject(new Error('some non-axios error'))
  })
  rateLimit(client)
  return { client }
}

afterEach(() => {
  logHandlerStub.mockReset()
  mock.reset()
})

it('Retry on 429 after a duration >= rateLimit header', (done) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', { 'x-contentful-ratelimit-reset': 4 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  const startTime = Date.now()
  expect.assertions(6)
  client.get('/rate-limit-me').then((response) => {
    expect(response.data).toBeDefined()
    expect(response.data).toEqual('works')
    expect(logHandlerStub).toBeCalledTimes(1)
    expect(logHandlerStub.mock.calls[0][0]).toEqual('warning')
    expect(logHandlerStub.mock.calls[0][1]).toContain('Rate limit error occurred.')
    expect(Date.now() - startTime >= 4000).toBeTruthy()

    done()
  })
})

it('Retry on 5** - multiple errors', (done) => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 1 })
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 1 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works #1')
  mock
    .onGet('/rate-limit-me')
    .replyOnce(503, 'Another Server Error', { 'x-contentful-request-id': 2 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works #2')
  expect.assertions(5)
  return client.get('/rate-limit-me').then((response) => {
    expect(response.data).toBeDefined()
    expect(response.data).toEqual('works #1')
    const startTime = Date.now()
    return client.get('/rate-limit-me').then((response) => {
      // First error should not influence second errors retry delay
      expect(Date.now() - startTime <= 3000).toBeTruthy()
      expect(response.data).toBeDefined()
      expect(response.data).toEqual('works #2')

      done()
    })
  })
})

it('Retry on 5** - multiple errors - reach/exceed limit', (done) => {
  const { client } = setup({ retryLimit: 7 })
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 12345 })
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 12345 })
  mock
    .onGet('/rate-limit-me')
    .replyOnce(503, 'Another Server Error', { 'x-contentful-request-id': 12345 })
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 12345 })
  mock
    .onGet('/rate-limit-me')
    .replyOnce(503, 'Another Server Error', { 'x-contentful-request-id': 12345 })
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 12345 })
  mock
    .onGet('/rate-limit-me')
    .replyOnce(503, 'Another Server Error', { 'x-contentful-request-id': 12345 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 12345 })

  // expect.assertions(3)

  return client.get('/rate-limit-me').then((response) => {
    expect(response.data).toBeDefined()
    expect(response.data).toEqual('works')
    done()
  })
  // .then(() => {
  //   return client
  //     .get('/rate-limit-me')
  //     .then(() => {
  //       throw new Error('Promise should reject not resolve')
  //     })
  //     .catch((error) => {
  //       expect(error.message).toEqual('Request failed with status code 500')
  //
  //       done()
  //     })
  // })
})

it('Retry on network error', (done) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/rate-limit-me').networkError()

  return client
    .get('/rate-limit-me')
    .then(() => {
      throw new Error('It should not happen')
    })
    .catch((error) => {
      // logs two attempts, one initial and one retry
      expect(error.attempts).toEqual(2)

      done()
    })
})

it('no retry when automatic handling flag is disabled', (done) => {
  const { client } = setupWithoutErrorRetry()
  mock.onGet('/rate-limit-me').replyOnce(500, 'Mocked 500 Error', { 'x-contentful-request-id': 3 })
  mock
    .onGet('/rate-limit-me')
    .replyOnce(200, 'would work but retry is disabled', { 'x-contentful-request-id': 4 })

  expect.assertions(6)
  return client
    .get('/rate-limit-me')
    .then(() => {
      throw new Error('Promise should reject not resolve')
    })
    .catch((error) => {
      expect(error.response.status).toEqual(500)
      expect(error.response.headers['x-contentful-request-id']).toEqual(3)
      expect(error.response.data).toEqual('Mocked 500 Error')
      expect(logHandlerStub).toHaveBeenCalledTimes(0)
      expect(error.message).toEqual('Request failed with status code 500')
      expect(error.attempts).not.toBeDefined()

      done()
    })
})

it('no retry with non-axios error', (done) => {
  const { client } = setupWithNonAxiosError()
  mock
    .onGet('/rate-limit-me')
    .replyOnce(200, 'worked but will fail due to interceptor', { 'x-contentful-request-id': 4 })

  expect.assertions(4)
  return client
    .get('/rate-limit-me')
    .then(() => {
      throw new Error('Promise should reject not resolve')
    })
    .catch((error) => {
      // Check if right error is returned:
      expect(error.message).toEqual('some non-axios error')
      // Ensure no retry happened:
      expect(logHandlerStub).toHaveBeenCalledTimes(0)
      expect(error.response).not.toBeDefined()
      expect(error.attempts).not.toBeDefined()

      done()
    })
})

it('Should Fail if it hits maxRetries', (done) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt #1', { 'x-contentful-request-id': 4 })
  mock.onGet('/error').replyOnce(501, 'error attempt #2', { 'x-contentful-request-id': 4 })
  mock.onGet('/error').replyOnce(200, 'should not be there', { 'x-contentful-request-id': 4 })

  expect.assertions(5)
  return client
    .get('/error')
    .then(() => {
      throw new Error('the request should return error')
    })
    .catch((error) => {
      // returned error since maxRetries was reached
      expect(error.response.data).toEqual('error attempt #2')
      expect(logHandlerStub).toHaveBeenCalledTimes(1)
      expect(logHandlerStub.mock.calls[0][0]).toEqual('warning')
      expect(error.message).toEqual('Request failed with status code 501')
      expect(error.attempts).toEqual(2)

      done()
    })
})

it('Rejects error straight away when X-Contentful-Request-Id header is missing', (done) => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')

  expect.assertions(4)

  return client
    .get('/error')
    .then(() => {
      throw new Error('the request should return error')
    })
    .catch((error) => {
      expect(error.response.data).toEqual('error attempt')
      expect(error.message).toEqual('Request failed with status code 500')
      expect(error.attempts).toEqual(1)
      // did not log anything
      expect(logHandlerStub).toBeCalledTimes(0)

      done()
    })
})

it('Rejects errors with strange status codes', (done) => {
  const { client } = setup()
  mock.onGet('/error').replyOnce(765, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')

  expect.assertions(2)
  return client
    .get('/error')
    .then(() => {
      throw new Error('the request should return error')
    })
    .catch((error) => {
      expect(error.response.data).toEqual('error attempt')
      // did not log anything
      expect(logHandlerStub).toBeCalledTimes(0)

      done()
    })
})
