import { CreateHttpClientParams, DefaultOptions } from './types'
import { AxiosRequestHeaders } from 'axios'

// Matches 'sub.host:port' or 'host:port' and extracts hostname and port
// Also enforces toplevel domain specified, no spaces and no protocol
const HOST_REGEX = /^(?!\w+:\/\/)([^\s:]+\.?[^\s:]+)(?::(\d+))?(?!:)$/

/**
 * Create default options
 * @private
 * @param {CreateHttpClientParams} options - Initialization parameters for the HTTP client
 * @return {DefaultOptions} options to pass to axios
 */
export default function createDefaultOptions(options: CreateHttpClientParams): DefaultOptions {
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
    headers: {} as AxiosRequestHeaders,
    httpAgent: false as const,
    httpsAgent: false as const,
    timeout: 30000,
    throttle: 0,
    basePath: '',
    adapter: undefined,
    maxContentLength: 1073741824, // 1GB
    maxBodyLength: 1073741824, // 1GB
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

  if (!config.headers.Authorization && typeof config.accessToken !== 'function') {
    config.headers.Authorization = 'Bearer ' + config.accessToken
  }

  const axiosOptions: DefaultOptions = {
    // Axios
    baseURL,
    headers: config.headers,
    httpAgent: config.httpAgent,
    httpsAgent: config.httpsAgent,
    proxy: config.proxy,
    timeout: config.timeout,
    adapter: config.adapter,
    maxContentLength: config.maxContentLength,
    maxBodyLength: config.maxBodyLength,
    paramsSerializer: {
      serialize: (params) => {
        return qs.stringify(params)
      },
    },
    // Contentful
    logHandler: config.logHandler,
    responseLogger: config.responseLogger,
    requestLogger: config.requestLogger,
    retryOnError: config.retryOnError,
  }
  return axiosOptions
}
