import isString from 'lodash.isstring'
import pThrottle from 'p-throttle'
import { AxiosInstance } from './types'
import { noop } from './utils'

type ThrottleType = 'auto' | string

const PERCENTAGE_REGEX = /(?<value>\d+)(%)/

const HEADERS = {
  // @desc The maximum amount of requests which can be made in a second.
  RATE_LIMIT: 'x-contentful-ratelimit-second-limit',
  // @desc The number of seconds until the next request can be made.
  RATE_LIMIT_RESET: 'x-contentful-ratelimit-second-reset',
  // @desc The remaining amount of requests which can be made until the next secondly reset.
  RATE_LIMIT_REMAINING: 'x-contentful-ratelimit-second-remaining',
} as const

export function calculateLimit(type: ThrottleType, max = 7) {
  let limit = max

  if (PERCENTAGE_REGEX.test(type)) {
    const groups = type.match(PERCENTAGE_REGEX)?.groups
    if (groups && groups.value) {
      const percentage = parseInt(groups.value) / 100
      limit = Math.round(max * percentage)
    }
  }
  return Math.min(30, Math.max(1, limit))
}

function createThrottle(limit: number, logger: (...args: any[]) => void) {
  logger('info', `Throttle request to ${limit}/s`)
  return pThrottle({
    limit,
    interval: 1000,
    strict: false,
  })
}

export default (axiosInstance: AxiosInstance, type: ThrottleType | number = 'auto') => {
  const { logHandler = noop } = axiosInstance.defaults
  let limit = isString(type) ? calculateLimit(type) : calculateLimit('auto', type)
  let throttle = createThrottle(limit, logHandler)
  let isCalculated = false

  let requestInterceptorId = axiosInstance.interceptors.request.use(
    (config) => {
      return throttle<[], typeof config>(() => config)()
    },
    function (error) {
      return Promise.reject(error)
    }
  )

  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      // If we haven't yet calculated the limit based on the headers, do so now
      if (
        !isCalculated &&
        isString(type) &&
        (type === 'auto' || PERCENTAGE_REGEX.test(type)) &&
        response.headers &&
        response.headers[HEADERS.RATE_LIMIT]
      ) {
        const rawLimit = parseInt(response.headers[HEADERS.RATE_LIMIT])
        const nextLimit = calculateLimit(type, rawLimit)

        if (nextLimit !== limit) {
          if (requestInterceptorId) {
            axiosInstance.interceptors.request.eject(requestInterceptorId)
          }

          limit = nextLimit

          throttle = createThrottle(nextLimit, logHandler)
          requestInterceptorId = axiosInstance.interceptors.request.use(
            (config) => {
              return throttle<[], typeof config>(() => config)()
            },
            function (error) {
              return Promise.reject(error)
            }
          )
        }

        isCalculated = true
      }

      return response
    },
    function (error) {
      return Promise.reject(error)
    }
  )

  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId)
    axiosInstance.interceptors.response.eject(responseInterceptorId)
  }
}
