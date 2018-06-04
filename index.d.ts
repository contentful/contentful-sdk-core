import { AxiosInstance, AxiosStatic } from '@contentful/axios';

export function createHttpClient(
  axios: AxiosInstance,
  options: { [key: string]: any }
): AxiosInstance;

export function getUserAgentHeader(
  sdk: string,
  application?: string,
  integration?: string
): string;

export interface ContentfulQuery {
  content_type?: string;
  'sys.id'?: string;
  [key: string]: any;
}

interface ContentfulRequestConfig {
  // TODO: omit `resovleLinks`
  params: ContentfulQuery;
}
export function createRequestConfig({
  query
}: {
  query: ContentfulQuery;
}): ContentfulRequestConfig;
