import cloneDeep from 'lodash/cloneDeep'
import qs from 'qs'

import rateLimit from './rate-limit'
import { isNode, getNodeVersion } from './utils'

// Matches 'sub.host:port' or 'host:port' and extracts hostname and port
// Also enforces toplevel domain specified, no spaces and no protocol
const HOST_REGEX = /^(?!\w+:\/\/)([^\s:]+\.?[^\s:]+)(?::(\d+))?(?!:)$/

/**
 * Create pre configured axios instance
 * @private
 * @param {Object} axios - Axios library
 * @param {Object} httpClientParams - Initialization parameters for the HTTP client
 * @prop {string} space - Space ID
 * @prop {string} accessToken - Access Token
 * @prop {boolean=} insecure - If we should use http instead
 * @prop {string=} host - Alternate host
 * @prop {Object=} httpAgent - HTTP agent for node
 * @prop {Object=} httpsAgent - HTTPS agent for node
 * @prop {function=} adapter - Axios adapter to handle requests
 * @prop {function=} requestLogger - Gets called on every request triggered by the SDK, takes the axios request config as an argument
 * @prop {function=} responseLogger - Gets called on every response, takes axios response object as an argument
 * @prop {Object=} proxy - Axios proxy config
 * @prop {Object=} headers - Additional headers
 * @prop {function=} logHandler - A log handler function to process given log messages & errors. Receives the log level (error, warning & info) and the actual log data (Error object or string). (Default can be found here: https://github.com/contentful/contentful-sdk-core/blob/master/lib/create-http-client.js)
 * @return {Object} Initialized axios instance
 */
export default function createHttpClient (axios, options) {
  const defaultConfig = {
    insecure: false,
    retryOnError: true,
    logHandler: (level, data) => {
      if (level === 'error' && data) {
        const title = [data.name, data.message].filter((a) => a).join(' - ')
        console.error(`[error] ${title}`)
        console.error(data)
        return
      }
      console.log(`[${level}] ${data}`)
    },
    // Passed to axios
    headers: {},
    httpAgent: false,
    httpsAgent: false,
    timeout: 30000,
    proxy: false,
    basePath: '',
    adapter: false,
    maxContentLength: 1073741824 // 1GB
  }
  const config = {
    ...defaultConfig,
    ...options
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
  let port = config.insecure ? 80 : 443
  if (config.host && HOST_REGEX.test(config.host)) {
    const parsed = config.host.split(':')
    if (parsed.length === 2) {
      [hostname, port] = parsed
    } else {
      hostname = parsed[0]
    }
  }

  // Ensure that basePath does start but not end with a slash
  if (config.basePath) {
    config.basePath = `/${config.basePath.split('/').filter(Boolean).join('/')}`
  }

  const baseURL = options.baseURL || `${protocol}://${hostname}:${port}${config.basePath}/spaces/${space}`

  if (!config.headers['Authorization']) {
    config.headers['Authorization'] = 'Bearer ' + config.accessToken
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
    retryOnError: config.retryOnError
  }
  const instance = axios.create(axiosOptions)
  instance.httpClientParams = options

  /**
   * Creates a new axios instance with the same default base parameters as the
   * current one, and with any overrides passed to the newParams object
   * This is useful as the SDKs use dependency injection to get the axios library
   * and the version of the library comes from different places depending
   * on whether it's a browser build or a node.js build.
   * @private
   * @param {Object} httpClientParams - Initialization parameters for the HTTP client
   * @return {Object} Initialized axios instance
   */
  instance.cloneWithNewParams = function (newParams) {
    return createHttpClient(axios, {
      ...cloneDeep(options),
      ...newParams
    })
  }
  rateLimit(instance, axiosOptions, config.retryLimit)
  return instance
}
