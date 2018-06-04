var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import cloneDeep from 'lodash/cloneDeep';
import qs from 'qs';

import rateLimit from './rate-limit';
import { isNode, getNodeVersion } from './utils';

// Matches 'sub.host:port' and extracts hostname and port
// Also enforces toplevel domain specified, no spaces and no protocol
var HOST_REGEX = /^(?!\w+:\/\/)([^\s:]+\.[^\s:]+)(?::(\d+))?(?!:)$/;

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
 * @prop {Object=} proxy - Axios proxy config
 * @prop {Object=} headers - Additional headers
 * @prop {function=} logHandler - A log handler function to process given log messages & errors. Receives the log level (error, warning & info) and the actual log data (Error object or string). (Default can be found here: https://github.com/contentful/contentful-sdk-core/blob/master/lib/create-http-client.js)
 * @return {Object} Initialized axios instance
 */
export default function createHttpClient(axios, options) {
  var defaultConfig = {
    insecure: false,
    retryOnError: true,
    logHandler: function logHandler(level, data) {
      if (level === 'error' && data) {
        var title = [data.name, data.message].filter(function (a) {
          return a;
        }).join(' - ');
        console.error('[error] ' + title);
        console.error(data);
        return;
      }
      console.log('[' + level + '] ' + data);
    },
    // Passed to axios
    headers: {},
    httpAgent: false,
    httpsAgent: false,
    timeout: 30000,
    proxy: false,
    basePath: ''
  };
  var config = _extends({}, defaultConfig, options);

  if (!config.accessToken) {
    var missingAccessTokenError = new TypeError('Expected parameter accessToken');
    config.logHandler('error', missingAccessTokenError);
    throw missingAccessTokenError;
  }

  // Construct axios baseURL option
  var protocol = config.insecure ? 'http' : 'https';
  var space = config.space ? config.space + '/' : '';
  var hostname = config.defaultHostname;
  var port = config.insecure ? 80 : 443;

  if (HOST_REGEX.test(config.host)) {
    var parsed = config.host.split(':');
    if (parsed.length === 2) {
      var _parsed = _slicedToArray(parsed, 2);

      hostname = _parsed[0];
      port = _parsed[1];
    } else {
      hostname = parsed[0];
    }
  }

  // Ensure that basePath does start but not end with a slash
  if (config.basePath) {
    config.basePath = '/' + config.basePath.split('/').filter(Boolean).join('/');
  }

  var baseURL = protocol + '://' + hostname + ':' + port + config.basePath + '/spaces/' + space;

  config.headers['Authorization'] = 'Bearer ' + config.accessToken;

  // Set these headers only for node because browsers don't like it when you
  // override user-agent or accept-encoding.
  // The SDKs should set their own X-Contentful-User-Agent.
  if (isNode()) {
    config.headers['user-agent'] = 'node.js/' + getNodeVersion();
    config.headers['Accept-Encoding'] = 'gzip';
  }

  var axiosOptions = {
    // Axios
    baseURL: baseURL,
    headers: config.headers,
    httpAgent: config.httpAgent,
    httpsAgent: config.httpsAgent,
    paramsSerializer: qs.stringify,
    proxy: config.proxy,
    timeout: config.timeout,
    // Contentful
    logHandler: config.logHandler,
    retryOnError: config.retryOnError
  };
  var instance = axios.create(axiosOptions);
  instance.httpClientParams = options;

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
    return createHttpClient(axios, _extends({}, cloneDeep(options), newParams));
  };
  rateLimit(instance);
  return instance;
}