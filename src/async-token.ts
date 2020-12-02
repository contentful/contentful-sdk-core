import type { AxiosInstance } from './types'

export default function asyncToken(instance: AxiosInstance, getToken: () => Promise<string>): void {
  instance.interceptors.request.use(
    async function (config) {
      const accessToken = await getToken()
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      }
      return config
    },
    function (error) {
      return Promise.reject(error)
    }
  )
}
