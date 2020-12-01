/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

type DefaultOptions = AxiosRequestConfig & {
  logHandler: (level: string, data?: Error | string) => void
  responseLogger?: (response: AxiosResponse<any> | Error) => unknown
  requestLogger?: (request: AxiosRequestConfig | Error) => unknown
  retryOnError?: boolean
}

export type ContentfulAxiosInstance = AxiosInstance & {
  httpClientParams: CreateHttpClientParams
  cloneWithNewParams: (params: CreateHttpClientParams) => ContentfulAxiosInstance
  defaults: DefaultOptions
}

export type CreateHttpClientParams = {
  /** Access Token */
  accessToken: string
  /** Space ID */
  space?: string

  /**
   * Requests will be made over http instead of the default https
   * @default false
   */
  insecure?: boolean

  /**
   * API host
   */
  host?: string
  /** HTTP agent for node */
  httpAgent?: AxiosRequestConfig['httpAgent']
  /** HTTPS agent for node */
  httpsAgent?: AxiosRequestConfig['httpsAgent']

  /** Axios adapter to handle requests */
  adapter?: AxiosRequestConfig['adapter']
  /** Axios proxy config */
  proxy?: AxiosRequestConfig['proxy']

  /** Gets called on every request triggered by the SDK, takes the axios request config as an argument */
  requestLogger?: DefaultOptions['requestLogger']
  /** Gets called on every response, takes axios response object as an argument */
  responseLogger?: DefaultOptions['responseLogger']
  /** A log handler function to process given log messages & errors. Receives the log level (error, warning & info) and the actual log data (Error object or string). (Default can be found here: https://github.com/contentful/contentful-sdk-core/blob/master/lib/create-http-client.js) */
  logHandler?: DefaultOptions['logHandler']

  /** Optional additional headers */
  headers?: Record<string, unknown>

  defaultHostname?: string

  /**
   * If we should retry on errors and 429 rate limit exceptions
   * @default true
   */
  retryOnError?: boolean

  /**
   * Optional number of retries before failure
   * @default 5
   */
  retryLimit?: number

  /**
   * Optional number of milliseconds before the request times out.
   * @default 30000
   */
  timeout?: number

  basePath?: string

  baseURL?: string

  /**
   * Optional maximum content length in bytes
   * @default 1073741824 i.e 1GB
   */
  maxContentLength?: number
}
