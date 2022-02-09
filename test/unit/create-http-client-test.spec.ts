/* eslint-disable @typescript-eslint/no-explicit-any */

import createHttpClient from '../../src/create-http-client'

import axios, { AxiosAdapter } from 'axios'
import MockAdapter from 'axios-mock-adapter'

jest.mock('../../src/rate-limit', () => jest.fn())
jest.mock('../../src/rate-limit-throttle', () => jest.fn())

const mockedAxios = axios as jest.Mocked<typeof axios>

const logHandlerStub = jest.fn()

const mock = new MockAdapter(axios)

beforeEach(() => {
  // @ts-expect-error No need to instantiate a complete axios instance
  // for the mock.
  jest.spyOn(axios, 'create').mockReturnValue({})
})

afterEach(() => {
  mockedAxios.create.mockReset()
  mock.reset()
  logHandlerStub.mockReset()
})

it('Calls axios with expected default URL', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    space: 'clientSpaceId',
    defaultHostname: 'defaulthost',
    logHandler: logHandlerStub,
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('https://defaulthost:443/spaces/clientSpaceId/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed host', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:8080',
    logHandler: logHandlerStub,
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('https://contentful.com:8080/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed host with insecure flag', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:321',
    insecure: true,
    logHandler: logHandlerStub,
  })
  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('http://contentful.com:321/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed hostname with insecure flag', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com',
    insecure: true,
    logHandler: logHandlerStub,
  })
  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('http://contentful.com:80/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed headers', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    headers: {
      'X-Custom-Header': 'example',
      Authorization: 'Basic customAuth',
    },
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL)
  expect(callConfig?.headers?.['X-Custom-Header']).toEqual('example')
  expect(callConfig?.headers?.Authorization).toEqual('Basic customAuth')
})

it('Calls axios with request/response logger', () => {
  const requestLoggerStub = jest.fn()
  const responseLoggerStub = jest.fn()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com',
    insecure: true,
    requestLogger: requestLoggerStub,
    responseLogger: responseLoggerStub,
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('http://contentful.com:80/spaces/')
  expect(requestLoggerStub).not.toHaveBeenCalled()
  expect(responseLoggerStub).not.toHaveBeenCalled()
})

it('Fails with missing access token', () => {
  try {
    // @ts-expect-error expect access token not to be passed
    createHttpClient(axios, {
      logHandler: logHandlerStub,
    })
  } catch (err: any) {
    expect(err instanceof TypeError).toBeTruthy()
    expect(err.message).toEqual('Expected parameter accessToken')
    expect(logHandlerStub).toHaveBeenCalledTimes(1)
    expect(logHandlerStub.mock.calls[0][0]).toEqual('error')
    expect(logHandlerStub.mock.calls[0][1].message).toEqual('Expected parameter accessToken')
    expect(logHandlerStub.mock.calls[0][1] instanceof TypeError).toBeTruthy()
  }
})

it('Calls axios based on passed hostname with basePath', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'some.random.example.com',
    basePath: '/foo/bar',
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('https://some.random.example.com:443/foo/bar/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed hostname with invalid basePath and fixes the invalid one', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'some.random.example.com',
    basePath: 'foo/bar',
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('https://some.random.example.com:443/foo/bar/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Can change the adapter axios uses', () => {
  const testAdapter: AxiosAdapter = function myAdapter(config) {
    return new Promise(function (resolve) {
      const response = {
        data: 'Adapter was used',
        status: 200,
        statusText: 'request.statusText',
        headers: {},
        config: config,
        request: undefined,
      }
      resolve(response)
    })
  }

  const instance = createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    space: 'clientSpaceId',
    defaultHostname: 'defaulthost',
    logHandler: logHandlerStub,
    adapter: testAdapter,
  })

  const [callConfig] = mockedAxios.create.mock.calls[0]
  expect(callConfig?.baseURL).toEqual('https://defaulthost:443/spaces/clientSpaceId/')
  expect(logHandlerStub).not.toHaveBeenCalled()
  expect(instance.httpClientParams.adapter).toEqual(testAdapter)
})
