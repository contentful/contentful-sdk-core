import copy from 'fast-copy'
import qs from 'qs'
import type { AxiosStatic } from 'axios'
import type { AxiosInstance, CreateHttpClientParams } from './types'

import rateLimit from './rate-limit'
import { isNode, getNodeVersion } from './utils'

// Matches 'sub.host:port' or 'host:port' and extracts hostname and port
// Also enforces toplevel domain specified, no spaces and no protocol
const HOST_REGEX = /^(?!\w+:\/\/)([^\s:]+\.?[^\s:]+)(?::(\d+))?(?!:)$/

/**
 * Create pre configured axios instance
 * @private
 * @param {AxiosStatic} axios - Axios library
 * @param {CreateHttpClientParams} options - Initialization parameters for the HTTP client
 * @return {ContentfulAxiosInstance} Initialized axios instance
 */
export default function createHttpClient(
  axios: AxiosStatic,
  options: CreateHttpClientParams
): AxiosInstance {
  const defaultConfig = {
    insecure: false as const,
    retryOnError: true as const,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logHandler: (level: string, data: any): void => {
      if (level === 'error' && data) {
        const title = [data.name, data.message].filter((a) => a).join(' - ')
        console.error(`[error] ${title}`)
        console.error(data)
        return
      }
      console.log(`[${level}] ${data}`)
    },
    // Passed to axios
    headers: {} as Record<string, unknown>,
    httpAgent: false as const,
    httpsAgent: false as const,
    timeout: 30000,
    proxy: false as const,
    basePath: '',
    adapter: undefined,
    maxContentLength: 1073741824, // 1GB
  }
  const config = {
    ...defaultConfig,
    ...options,
  }

  if (!config.accessToken) {
    const missingAccessTokenError = new TypeError('Expected parameter accessToken')
    config.logHandler('error', missingAccessTokenError)
    throw missingAccessTokenError
  }

  // Construct axios baseURL option
  const protocol = config.insecure ? 'http' : 'https'
  const space = config.space ? `${config.space}/` : ''
  let hostname = config.defaultHostname
  let port: number | string = config.insecure ? 80 : 443
  if (config.host && HOST_REGEX.test(config.host)) {
    const parsed = config.host.split(':')
    if (parsed.length === 2) {
      ;[hostname, port] = parsed
    } else {
      hostname = parsed[0]
    }
  }

  // Ensure that basePath does start but not end with a slash
  if (config.basePath) {
    config.basePath = `/${config.basePath.split('/').filter(Boolean).join('/')}`
  }

  const baseURL =
    options.baseURL || `${protocol}://${hostname}:${port}${config.basePath}/spaces/${space}`

  if (!config.headers.Authorization) {
    config.headers.Authorization = 'Bearer ' + config.accessToken
  }

  // Set these headers only for node because browsers don't like it when you
  // override user-agent or accept-encoding.
  // The SDKs should set their own X-Contentful-User-Agent.
  if (isNode()) {
    config.headers['user-agent'] = 'node.js/' + getNodeVersion()
    config.headers['Accept-Encoding'] = 'gzip'
  }

  const axiosOptions = {
    // Axios
    baseURL,
    headers: config.headers,
    httpAgent: config.httpAgent,
    httpsAgent: config.httpsAgent,
    paramsSerializer: qs.stringify,
    proxy: config.proxy,
    timeout: config.timeout,
    adapter: config.adapter,
    maxContentLength: config.maxContentLength,
    // Contentful
    logHandler: config.logHandler,
    responseLogger: config.responseLogger,
    requestLogger: config.requestLogger,
    retryOnError: config.retryOnError,
  }
  const instance = axios.create(axiosOptions) as AxiosInstance
  instance.httpClientParams = options

  /**
   * Creates a new axios instance with the same default base parameters as the
   * current one, and with any overrides passed to the newParams object
   * This is useful as the SDKs use dependency injection to get the axios library
   * and the version of the library comes from different places depending
   * on whether it's a browser build or a node.js build.
   * @private
   * @param {CreateHttpClientParams} httpClientParams - Initialization parameters for the HTTP client
   * @return {ContentfulAxiosInstance} Initialized axios instance
   */
  instance.cloneWithNewParams = function (
    newParams: Partial<CreateHttpClientParams>
  ): AxiosInstance {
    return createHttpClient(axios, {
      ...copy(options),
      ...newParams,
    })
  }
  rateLimit(instance, config.retryLimit)
  return instance
}
