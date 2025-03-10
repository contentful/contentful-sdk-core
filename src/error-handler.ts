import isPlainObject from 'lodash/isPlainObject.js'
import type { ContentfulErrorData } from './types.js'

function obscureHeaders(config: any) {
  // Management, Delivery and Preview API tokens
  if (config?.headers?.['Authorization']) {
    const token = `...${config.headers['Authorization'].toString().substr(-5)}`
    config.headers['Authorization'] = `Bearer ${token}`
  }
  // Encoded Delivery or Preview token map for Cross-Space References
  if (config?.headers?.['X-Contentful-Resource-Resolution']) {
    const token = `...${config.headers['X-Contentful-Resource-Resolution'].toString().substr(-5)}`
    config.headers['X-Contentful-Resource-Resolution'] = token
  }
}

/**
 * Handles errors received from the server. Parses the error into a more useful
 * format, places it in an exception and throws it.
 * See https://www.contentful.com/developers/docs/references/errors/
 * for more details on the data received on the errorResponse.data property
 * and the expected error codes.
 * @private
 */
export default function errorHandler(errorResponse: any): never {
  const { config, response } = errorResponse
  let errorName

  obscureHeaders(config)

  if (!isPlainObject(response) || !isPlainObject(config)) {
    throw errorResponse
  }

  const data = response?.data

  const errorData: ContentfulErrorData = {
    status: response?.status,
    statusText: response?.statusText,
    message: '',
    details: {},
  }

  if (config && isPlainObject(config)) {
    errorData.request = {
      url: config.url,
      headers: config.headers,
      method: config.method,
      payloadData: config.data,
    }
  }
  if (data && typeof data === 'object') {
    if ('requestId' in data) {
      errorData.requestId = data.requestId || 'UNKNOWN'
    }
    if ('message' in data) {
      errorData.message = data.message || ''
    }
    if ('details' in data) {
      errorData.details = data.details || {}
    }
    errorName = data.sys?.id
  }

  const error = new Error()
  error.name =
    errorName && errorName !== 'Unknown' ? errorName : `${response?.status} ${response?.statusText}`

  try {
    error.message = JSON.stringify(errorData, null, '  ')
  } catch {
    error.message = errorData?.message ?? ''
  }
  throw error
}
