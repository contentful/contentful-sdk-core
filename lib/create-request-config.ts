/* eslint-disable @typescript-eslint/no-explicit-any */

import copy from 'fast-copy'

type Config = {
  params?: Record<string, any>;
}

/**
 * Creates request parameters configuration by parsing an existing query object
 * @private
 * @param {Object} query
 * @return {Object} Config object with `params` property, ready to be used in axios
 */
export default function createRequestConfig ({ query }: { query: Record<string, any> }): Config {
  const config: Config  = {}
  delete query.resolveLinks
  config.params = copy(query)
  return config
}
