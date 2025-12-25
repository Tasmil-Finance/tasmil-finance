// lib/api-client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/use-auth";

// Get API base URL without /api prefix
// Kubb-generated URLs already include /api prefix
const getApiBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9337";
  // Remove /api if it exists, because Kubb-generated URLs already have it
  url = url.replace(/\/api$/, '');
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  return url;
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token as string));
  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return apiClient(orig);
        }).catch(err => Promise.reject(err));
      }

      orig._retry = true;
      isRefreshing = true;
      const { logout, setTokens } = useAuthStore.getState();

      try {
        // Try to refresh token - if refresh endpoint doesn't exist, just logout
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true,
        });
        const { accessToken: newToken } = data.data || data;
        if (newToken) {
          setTokens(newToken);
          processQueue(null, newToken);
          orig.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(orig);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (e) {
        processQueue(e as Error, null);
        logout();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Kubb expects a client with getConfig and setConfig methods
type KubbClient = typeof apiClient & {
  getConfig: () => Record<string, unknown>;
  setConfig: (config: Record<string, unknown>) => Record<string, unknown>;
};

const kubbClient = {
  client: Object.assign(apiClient, {
    getConfig: () => ({}),
    setConfig: (config: Record<string, unknown>) => config,
  } as const) as KubbClient,
} as const;

export { kubbClient };
export default apiClient;

