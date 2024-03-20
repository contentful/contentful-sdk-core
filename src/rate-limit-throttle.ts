import { isString } from 'lodash'
import pThrottle from 'p-throttle'

import { AxiosInstance } from './types.js'
import { noop } from './utils.js'

type ThrottleType = 'auto' | string

const PERCENTAGE_REGEX = /(?<value>\d+)(%)/

function calculateLimit(type: ThrottleType, max = 7) {
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
      return throttle(() => config)()
    },
    function (error) {
      return Promise.reject(error)
    },
  )

  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      if (
        !isCalculated &&
        isString(type) &&
        (type === 'auto' || PERCENTAGE_REGEX.test(type)) &&
        response.headers &&
        response.headers['x-contentful-ratelimit-second-limit']
      ) {
        const rawLimit = parseInt(response.headers['x-contentful-ratelimit-second-limit'])
        const nextLimit = calculateLimit(type, rawLimit)

        if (nextLimit !== limit) {
          if (requestInterceptorId) {
            axiosInstance.interceptors.request.eject(requestInterceptorId)
          }

          limit = nextLimit

          throttle = createThrottle(nextLimit, logHandler)
          requestInterceptorId = axiosInstance.interceptors.request.use(
            (config) => {
              return throttle(() => config)()
            },
            function (error) {
              return Promise.reject(error)
            },
          )
        }

        isCalculated = true
      }

      return response
    },
    function (error) {
      return Promise.reject(error)
    },
  )

  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId)
    axiosInstance.interceptors.response.eject(responseInterceptorId)
  }
}
