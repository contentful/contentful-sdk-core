import createHttpClient from '../../src/create-http-client'

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

jest.mock('../../src/rate-limit', () => jest.fn())

const logHandlerStub = jest.fn()

const mock = new MockAdapter(axios)

beforeEach(() => {
  jest.spyOn(axios, 'create').mockReturnValue({})
})

afterEach(() => {
  axios.create.mockReset()
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

  expect(axios.create.mock.calls[0][0].baseURL).toEqual(
    'https://defaulthost:443/spaces/clientSpaceId/'
  )
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed host', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:8080',
    logHandler: logHandlerStub,
  })

  expect(axios.create.mock.calls[0][0].baseURL).toEqual('https://contentful.com:8080/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed host with insecure flag', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:321',
    insecure: true,
    logHandler: logHandlerStub,
  })

  expect(axios.create.mock.calls[0][0].baseURL).toEqual('http://contentful.com:321/spaces/')
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed hostname with insecure flag', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com',
    insecure: true,
    logHandler: logHandlerStub,
  })

  expect(axios.create.mock.calls[0][0].baseURL).toEqual('http://contentful.com:80/spaces/')
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

  expect(axios.create.mock.calls[0][0].headers['X-Custom-Header']).toEqual('example')
  expect(axios.create.mock.calls[0][0].headers.Authorization).toEqual('Basic customAuth')
})

it('Calls axios with reques/response logger', () => {
  const requestloggerStub = jest.fn()
  const responseloggerStub = jest.fn()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com',
    insecure: true,
    requestLogger: requestloggerStub,
    responseLogger: responseloggerStub,
  })

  expect(axios.create.mock.calls[0][0].baseURL).toEqual('http://contentful.com:80/spaces/')
  expect(requestloggerStub).not.toHaveBeenCalled()
  expect(responseloggerStub).not.toHaveBeenCalled()
})

it('Fails with missing access token', () => {
  try {
    createHttpClient(axios, {
      logHandler: logHandlerStub,
    })
  } catch (err) {
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

  expect(axios.create.mock.calls[0][0].baseURL).toEqual(
    'https://some.random.example.com:443/foo/bar/spaces/'
  )
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Calls axios based on passed hostname with invalid basePath and fixes the invalid one', () => {
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'some.random.example.com',
    basePath: 'foo/bar',
  })

  expect(axios.create.mock.calls[0][0].baseURL).toEqual(
    'https://some.random.example.com:443/foo/bar/spaces/'
  )
  expect(logHandlerStub).not.toHaveBeenCalled()
})

it('Can change the adapter axios uses', () => {
  const testAdapter = function myAdapter(config) {
    return new Promise(function (resolve, reject) {
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

  expect(axios.create.mock.calls[0][0].baseURL).toEqual(
    'https://defaulthost:443/spaces/clientSpaceId/'
  )
  expect(logHandlerStub).not.toHaveBeenCalled()
  expect(instance.httpClientParams.adapter).toEqual(testAdapter)
})
