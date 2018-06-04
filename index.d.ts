import { AxiosInstance, AxiosStatic } from '@contentful/axios';


export function createHttpClient(
  axios: AxiosInstance,
  options: { [key: string]: any }
): AxiosInstance;

export function getUserAgentHeader(
  sdk: string,
  application: string,
  integration: string
): string;
