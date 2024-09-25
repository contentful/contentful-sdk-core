import { afterEach, it, expect, describe } from 'vitest'

import createHttpClient from '../../src/create-http-client'

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

afterEach(() => {
  mock.reset()
})

it('should retrieve token asynchronously', async () => {
  const instance = createHttpClient(axios, {
    accessToken: () => {
      return Promise.resolve('async-token')
    },
  })

  mock.onGet('/test-endpoint').replyOnce(200)

  expect(instance.defaults.headers.Authorization).not.toBeDefined()

  await instance.get('/test-endpoint')
  expect(mock.history.get[0].headers?.Authorization).toEqual('Bearer async-token')
})

describe('custom interceptors', () => {
  it('adds new header asynchronously', async () => {
    const getHeaderAsync = () => {
      return Promise.resolve('custom-header-value')
    }

    const instance = createHttpClient(axios, {
      accessToken: 'token',
      onBeforeRequest: async (config) => {
        const value = await getHeaderAsync()
        config.headers['custom-header'] = value
        return config
      },
    })

    mock.onGet('/test-endpoint').replyOnce(200)

    await instance.get('/test-endpoint')
    expect(mock.history.get[0].headers?.['custom-header']).toEqual('custom-header-value')
  })

  it('is able to intercept response codes', async () => {
    let accessToken = 'invalid-token'

    const refreshToken = () => {
      accessToken = 'valid-token'
      return Promise.resolve(accessToken)
    }

    const instance = createHttpClient(axios, {
      accessToken: () => Promise.resolve(accessToken),
      onError: async (error) => {
        const originalRequest = error.config
        if (error.response.status === 403 && !originalRequest._retry403) {
          originalRequest._retry403 = true
          const newToken = await refreshToken()
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          axios.defaults.headers.Authorization = 'Bearer ' + newToken
          return instance(originalRequest)
        }
        return Promise.reject(error)
      },
    })

    mock.onGet('/test-endpoint').replyOnce(403)
    mock.onGet('/test-endpoint').replyOnce(200)

    await instance.get('/test-endpoint')

    expect(mock.history.get[0].headers?.Authorization).toEqual('Bearer invalid-token')
    expect(mock.history.get[1].headers?.Authorization).toEqual('Bearer valid-token')
  })
})
