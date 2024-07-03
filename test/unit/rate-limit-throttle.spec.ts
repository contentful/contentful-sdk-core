/* eslint @typescript-eslint/ban-ts-comment: 0 */

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { AxiosInstance } from '../../src'
import createHttpClient from '../../src/create-http-client'
import { calculateLimit } from '../../src/rate-limit-throttle'

const logHandlerStub = jest.fn()

function wait(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function executeCalls(client: AxiosInstance, callsCount: number) {
  const requests = []
  for (let i = 0; i < callsCount; i++) {
    requests.push(client.get('/throttled-call'))
  }
  return requests
}

describe('throttle to rate limit axios interceptor', () => {
  let mock: InstanceType<typeof MockAdapter>

  beforeEach(() => {
    mock = new MockAdapter(axios)
    mock.onGet('/throttled-call').reply(200, null, { 'x-contentful-ratelimit-second-limit': 10 })
  })

  afterEach(() => {
    mock.reset()
    logHandlerStub.mockReset()
  })

  async function expectCallsExecutedWithin(
    client: AxiosInstance,
    callsCount: number,
    duration: number
  ) {
    // initial call to potentially update throttling settings
    client.get('/throttled-call')
    await wait(1000)

    const calls = executeCalls(client, callsCount)

    const start = Date.now()
    await Promise.all(calls)
    expect(mock.history.get).toHaveLength(callsCount + 1)

    expect(Date.now() - start).toBeLessThanOrEqual(duration)
  }

  function expectLogHandlerHasBeenCalled(limit: number, callCount: number) {
    expect(logHandlerStub).toBeCalledTimes(callCount)
    expect(logHandlerStub.mock.calls[callCount - 1][0]).toEqual('info')
    expect(logHandlerStub.mock.calls[callCount - 1][1]).toContain(`Throttle request to ${limit}/s`)
  }

  it('fires all requests directly', async () => {
    const client = createHttpClient(axios, {
      accessToken: 'token',
      logHandler: logHandlerStub,
      throttle: 0,
    })
    await expectCallsExecutedWithin(client, 20, 100)
    expect(logHandlerStub).not.toHaveBeenCalled()
  })

  it('throws on network errors', async () => {
    mock = new MockAdapter(axios)
    mock.onGet('/throttled-call').networkError()
    const client = createHttpClient(axios, {
      accessToken: 'token',
      logHandler: logHandlerStub,
      throttle: 'auto',
      retryOnError: false,
    })

    await expect(client.get('/throttled-call')).rejects.toThrow('Network Error')
  })

  it('fires limited requests per second', async () => {
    const client = createHttpClient(axios, {
      accessToken: 'token',
      logHandler: logHandlerStub,
      throttle: 3,
    })
    await expectCallsExecutedWithin(client, 3, 1010)
    expectLogHandlerHasBeenCalled(3, 1)
  })

  it('invalid argument defaults to 7/s', async () => {
    const client = createHttpClient(axios, {
      accessToken: 'token',
      logHandler: logHandlerStub,
      // @ts-ignore
      throttle: 'invalid',
    })
    await expectCallsExecutedWithin(client, 7, 1010)
    expectLogHandlerHasBeenCalled(7, 1)
  })

  it('invalid % argument defaults to 7/s', async () => {
    const client = createHttpClient(axios, {
      accessToken: 'token',
      logHandler: logHandlerStub,
      // @ts-ignore
      throttle: 'invalid%',
    })
    await expectCallsExecutedWithin(client, 7, 1010)
    expectLogHandlerHasBeenCalled(7, 1)
  })

  it('calculate limit based on response header', async () => {
    const client = createHttpClient(axios, {
      accessToken: 'token',
      logHandler: logHandlerStub,
      throttle: 'auto',
    })
    await expectCallsExecutedWithin(client, 10, 1010)
    expectLogHandlerHasBeenCalled(10, 2)
  })

  it.each([
    { throttle: '30%', limit: 3, duration: 1010 },
    { throttle: '50%', limit: 5, duration: 1010 },
    { throttle: '70%', limit: 7, duration: 1010 },
  ])(
    'calculate $throttle limit based on response header',
    async ({ throttle, limit, duration }) => {
      const client = createHttpClient(axios, {
        accessToken: 'token',
        logHandler: logHandlerStub,
        // @ts-ignore
        throttle: throttle,
      })
      await expectCallsExecutedWithin(client, limit, duration)
      expectLogHandlerHasBeenCalled(limit, 2)
    }
  )
})

describe('a calculate limit function', () => {
  describe('with type "auto"', () => {
    it('always returns the given max limit', () => {
      expect(calculateLimit('auto', 10)).toEqual(10)
      expect(calculateLimit('auto', 1)).toEqual(1)
    })
  })
  describe('with %', () => {
    it('always returns % of max limit', () => {
      expect(calculateLimit('0%', 10)).toEqual(1)
      expect(calculateLimit('50%', 10)).toEqual(5)
      expect(calculateLimit('100%', 10)).toEqual(10)
    })
  })
})
