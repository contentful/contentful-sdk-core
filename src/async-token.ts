import type { AxiosInstance } from './types.js'

export default function asyncToken(instance: AxiosInstance, getToken: () => Promise<string>): void {
  instance.interceptors.request.use(function (config) {
    return getToken().then((accessToken) => {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
      return config
    })
  })
}
