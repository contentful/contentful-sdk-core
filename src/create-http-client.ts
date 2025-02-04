import type { AxiosStatic } from 'axios'
import copy from 'fast-copy'

import asyncToken from './async-token.js'
import rateLimitRetry from './rate-limit.js'
import rateLimitThrottle from './rate-limit-throttle.js'
import type { AxiosInstance, CreateHttpClientParams } from './types.js'
import createDefaultOptions from './create-default-options.js'

function copyHttpClientParams(options: CreateHttpClientParams): CreateHttpClientParams {
  const copiedOptions = copy(options)
  // httpAgent and httpsAgent cannot be copied because they can contain private fields
  copiedOptions.httpAgent = options.httpAgent
  copiedOptions.httpsAgent = options.httpsAgent
  return copiedOptions
}

/**
 * Create pre-configured axios instance
 * @private
 * @param {AxiosStatic} axios - Axios library
 * @param {CreateHttpClientParams} options - Initialization parameters for the HTTP client
 * @return {AxiosInstance} Initialized axios instance
 */
export default function createHttpClient(
  axios: AxiosStatic,
  options: CreateHttpClientParams,
): AxiosInstance {
  const axiosOptions = createDefaultOptions(options)

  const instance = axios.create(axiosOptions) as AxiosInstance
  instance.httpClientParams = options

  /**
   * Creates a new axios instance with the same default base parameters as the
   * current one, and with any overrides passed to the newParams object
   * This is useful as the SDKs use dependency injection to get the axios library
   * and the version of the library comes from different places depending
   * on whether it's a browser build or a node.js build.
   * @private
   * @param {CreateHttpClientParams} newParams - Initialization parameters for the HTTP client
   * @return {AxiosInstance} Initialized axios instance
   */
  instance.cloneWithNewParams = function (
    newParams: Partial<CreateHttpClientParams>,
  ): AxiosInstance {
    return createHttpClient(axios, {
      ...copyHttpClientParams(options),
      ...newParams,
    })
  }

  /**
   * Apply interceptors.
   * Please note that the order of interceptors is important
   */

  if (options.onBeforeRequest) {
    instance.interceptors.request.use(options.onBeforeRequest)
  }

  if (typeof options.accessToken === 'function') {
    asyncToken(instance, options.accessToken)
  }

  if (options.throttle) {
    rateLimitThrottle(instance, options.throttle)
  }
  rateLimitRetry(instance, options.retryLimit)

  if (options.onError) {
    instance.interceptors.response.use((response) => response, options.onError)
  }

  return instance
}
