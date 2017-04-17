import qs from 'qs'
import cloneDeep from 'lodash/cloneDeep'
import assign from 'lodash/assign'
import rateLimit from './rate-limit'
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
 * @prop {Object=} headers - Additional headers
 * @return {Object} Initialized axios instance
 */
export default function createHttpClient (axios, httpClientParams) {
  const {space, accessToken, insecure, host, defaultHostname, httpAgent, httpsAgent} = httpClientParams
  let {headers} = httpClientParams
  let [hostname, port] = (host && host.split(':')) || []
  hostname = hostname || defaultHostname
  port = port || (insecure ? 80 : 443)
  let baseURL = `${insecure ? 'http' : 'https'}://${hostname}:${port}/spaces/`
  if (space) {
    baseURL += space + '/'
  }
  headers = headers || {}
  headers['Authorization'] = 'Bearer ' + accessToken

  // Set these headers only for node because browsers don't like it when you
  // override user-agent or accept-encoding.
  // The SDKs should set their own X-Contentful-User-Agent.
  if (process && process.release && process.release.name === 'node') {
    headers['user-agent'] = 'node.js/' + process.version
    headers['Accept-Encoding'] = 'gzip'
  }

  const instance = axios.create({
    baseURL: baseURL,
    headers: headers,
    httpAgent: httpAgent || {},
    httpsAgent: httpsAgent || {},
    paramsSerializer: qs.stringify
  })
  instance.httpClientParams = httpClientParams

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
    return createHttpClient(axios, assign(cloneDeep(httpClientParams), newParams))
  }
  rateLimit(instance)
  return instance
}
