import axios, { type AxiosInstance } from "axios";
import https from "https";

const instance: AxiosInstance = axios.create({});

instance.interceptors.request.use((config) => {
  console.log(`[axios] Sending request to ${config.url}`);
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error: { config: unknown; response?: { status?: number; headers?: { "retry-after"?: string } } }) => {
    const { config, response } = error;
    if (response?.status === 429) {
      const retryAfter = response.headers?.["retry-after"] || 1;
      console.log(`[axios] Rate limit exceeded, retrying in ${retryAfter} (s)`);
      return new Promise((resolve) => {
        setTimeout(() => resolve(axios(config as Parameters<typeof axios>[0])), Number(retryAfter) * 1000);
      });
    }
    return Promise.reject(error);
  }
);

export default function (keepAlive?: boolean): AxiosInstance {
  if (keepAlive) {
    instance.defaults.httpsAgent = new https.Agent({ keepAlive: true });
  }
  return instance;
}
