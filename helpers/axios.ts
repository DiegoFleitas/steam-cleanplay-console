import https from 'https';
import axios, { type AxiosInstance } from 'axios';

// Follow no redirects: validateUrl() only checks the initial hostname, so a
// redirect from an allowlisted host must not be able to reach a new one.
const instance: AxiosInstance = axios.create({ maxRedirects: 0 });

// Log origin + pathname only. Query strings can carry credentials
// (e.g. the injected Steam `?key=` param).
const redactUrlForLogging = (url: string | undefined): string => {
  if (!url) return '(no url)';
  try {
    const parsed = new URL(url, 'http://localhost');
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0];
  }
};

instance.interceptors.request.use((config) => {
  console.log(`[axios] Sending request to ${redactUrlForLogging(config.url)}`);
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error: {
    config: unknown;
    response?: { status?: number; headers?: { 'retry-after'?: string } };
  }) => {
    const { config, response } = error;
    if (response?.status && response.status >= 300 && response.status < 400) {
      return Promise.reject(Object.assign(new Error('Upstream redirect blocked'), { status: 502 }));
    }
    if (response?.status === 429) {
      const retryAfter = response.headers?.['retry-after'] || 1;
      console.log(`[axios] Rate limit exceeded, retrying in ${retryAfter} (s)`);
      return new Promise((resolve) => {
        setTimeout(
          () => resolve(axios(config as Parameters<typeof axios>[0])),
          Number(retryAfter) * 1000,
        );
      });
    }
    return Promise.reject(error);
  },
);

export default function (keepAlive?: boolean): AxiosInstance {
  if (keepAlive) {
    instance.defaults.httpsAgent = new https.Agent({ keepAlive: true });
  }
  return instance;
}
