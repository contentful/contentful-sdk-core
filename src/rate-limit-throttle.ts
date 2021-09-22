import pThrottle from "p-throttle";
import {AxiosInstance} from "./types";

export default (axiosInstance: AxiosInstance, limit = 7) => {
    const throttle = pThrottle({
        limit,
        interval: 1000
    });

    const interceptorId = axiosInstance.interceptors.request.use((config) => {
        return throttle<[], typeof config>(() => config)()
    }, Promise.reject)

    return () => axiosInstance.interceptors.request.eject(interceptorId);
}
