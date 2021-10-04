import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import createHttpClient from '../../src/create-http-client'
import { CreateHttpClientParams } from '../../src'

const logHandlerStub = jest.fn()

jest.setTimeout(50000)

const mock = new MockAdapter(axios)

function setup(options: Partial<CreateHttpClientParams> = {}) {
  const client = createHttpClient(axios, {
    accessToken: 'token',
    logHandler: logHandlerStub,
    retryOnError: true,
    ...options,
  })
  return { client }
}

function setupWithoutErrorRetry() {
  const client = createHttpClient(axios, {
    accessToken: 'token',
    logHandler: logHandlerStub,
    retryOnError: false,
  })
  return { client }
}

function setupWithOneRetry() {
  const client = createHttpClient(axios, {
    accessToken: 'token',
    retryLimit: 1,
    retryOnError: true,
    logHandler: logHandlerStub,
  })
  return { client }
}

afterEach(() => {
  logHandlerStub.mockReset()
  mock.reset()
})

it('Retry on 429 after a duration >= rateLimit header', async () => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(429, 'rateLimited', { 'x-contentful-ratelimit-reset': 4 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  const startTime = Date.now()
  expect.assertions(6)
  const response = await client.get('/rate-limit-me')

  expect(response.data).toBeDefined()
  expect(response.data).toEqual('works')
  expect(logHandlerStub).toBeCalledTimes(1)
  expect(logHandlerStub.mock.calls[0][0]).toEqual('warning')
  expect(logHandlerStub.mock.calls[0][1]).toContain('Rate limit error occurred.')
  expect(Date.now() - startTime >= 4000).toBeTruthy()
})

it('Retry on 5** - multiple errors', async () => {
  const { client } = setup()
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 1 })
  mock.onGet('/rate-limit-me').replyOnce(500, 'Server Error', { 'x-contentful-request-id': 1 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works #1')
  mock
    .onGet('/rate-limit-me')
    .replyOnce(503, 'Another Server Error', { 'x-contentful-request-id': 2 })
  mock.onGet('/rate-limit-me').replyOnce(200, 'works #2')
  expect.assertions(5)

  let response = await client.get('/rate-limit-me')
  expect(response.data).toBeDefined()
  expect(response.data).toEqual('works #1')

  const startTime = Date.now()
  response = await client.get('/rate-limit-me')
  // First error should not influence second errors retry delay
  expect(Date.now() - startTime <= 3000).toBeTruthy()
  expect(response.data).toBeDefined()
  expect(response.data).toEqual('works #2')
})

it('Retry on 5** - multiple errors - reach/exceed limit', async () => {
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

  expect.assertions(3)

  const response = await client.get('/rate-limit-me')

  expect(response.data).toBeDefined()
  expect(response.data).toEqual('works')

  try {
    await client.get('/rate-limit-me')
  } catch (error) {
    expect(error.message).toEqual('Request failed with status code 500')
  }
})

it('Retry on network error', async () => {
  const { client } = setupWithOneRetry()
  mock.onGet('/rate-limit-me').networkError()

  try {
    await client.get('/rate-limit-me')
  } catch (error) {
    // logs two attempts, one initial and one retry
    expect(error.attempts).toEqual(2)
  }
})

it('no retry when automatic handling flag is disabled', async () => {
  const { client } = setupWithoutErrorRetry()
  mock.onGet('/rate-limit-me').replyOnce(500, 'Mocked 500 Error', { 'x-contentful-request-id': 3 })
  mock
    .onGet('/rate-limit-me')
    .replyOnce(200, 'would work but retry is disabled', { 'x-contentful-request-id': 4 })

  expect.assertions(6)
  try {
    await client.get('/rate-limit-me')
  } catch (error) {
    expect(error.response.status).toEqual(500)
    expect(error.response.headers['x-contentful-request-id']).toEqual(3)
    expect(error.response.data).toEqual('Mocked 500 Error')
    expect(logHandlerStub).toHaveBeenCalledTimes(0)
    expect(error.message).toEqual('Request failed with status code 500')
    expect(error.attempts).not.toBeDefined()
  }
})

it('Should Fail if it hits maxRetries', async () => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt #1', { 'x-contentful-request-id': 4 })
  mock.onGet('/error').replyOnce(501, 'error attempt #2', { 'x-contentful-request-id': 4 })
  mock.onGet('/error').replyOnce(200, 'should not be there', { 'x-contentful-request-id': 4 })

  expect.assertions(5)
  try {
    await client.get('/error')
  } catch (error) {
    // returned error since maxRetries was reached
    expect(error.response.data).toEqual('error attempt #2')
    expect(logHandlerStub).toHaveBeenCalledTimes(1)
    expect(logHandlerStub.mock.calls[0][0]).toEqual('warning')
    expect(error.message).toEqual('Request failed with status code 501')
    expect(error.attempts).toEqual(2)
  }
})

it('Rejects error straight away when X-Contentful-Request-Id header is missing', async () => {
  const { client } = setupWithOneRetry()
  mock.onGet('/error').replyOnce(500, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')

  expect.assertions(4)

  try {
    await client.get('/error')
  } catch (error) {
    expect(error.response.data).toEqual('error attempt')
    expect(error.message).toEqual('Request failed with status code 500')
    expect(error.attempts).toEqual(1)
    // did not log anything
    expect(logHandlerStub).toBeCalledTimes(0)
  }
})

it('Rejects errors with strange status codes', async () => {
  const { client } = setup()
  mock.onGet('/error').replyOnce(765, 'error attempt')
  mock.onGet('/error').replyOnce(200, 'works')

  expect.assertions(2)
  try {
    await client.get('/error')
  } catch (error) {
    expect(error.response.data).toEqual('error attempt')
    // did not log anything
    expect(logHandlerStub).toBeCalledTimes(0)
  }
})
