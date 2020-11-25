import copy from 'fast-copy'

/**
 * Creates request parameters configuration by parsing an existing query object
 * @private
 * @param {Object} query
 * @return {Object} Config object with `params` property, ready to be used in axios
 */
export default function createRequestConfig ({ query }) {
  const config = {}
  delete query.resolveLinks
  config.params = copy(query)
  return config
}
