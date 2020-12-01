import type { AxiosInstance, AxiosRequestConfig } from 'axios'

type DefaultOptions = AxiosRequestConfig & {
  logHandler: Function
  responseLogger?: Function
  requestLogger?: Function
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
  /** If we should use http instead */
  insecure?: boolean

  /** Alternate host */
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
  requestLogger?: Function
  /** Gets called on every response, takes axios response object as an argument */
  responseLogger?: Function
  /** A log handler function to process given log messages & errors. Receives the log level (error, warning & info) and the actual log data (Error object or string). (Default can be found here: https://github.com/contentful/contentful-sdk-core/blob/master/lib/create-http-client.js) */
  logHandler?: Function
  /** Additional headers */
  headers?: Record<string, any>

  defaultHostname?: string

  retryOnError?: boolean

  timeout?: number

  basePath?: string

  baseURL?: string

  maxContentLength?: number

  retryLimit?: number
}
