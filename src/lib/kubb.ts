import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const getApiBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
  return url.replace(/\/$/, ''); // Remove trailing slash
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    console.error(`❌ ${error.response?.status} ${error.config?.url}`);
    
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-token-expired'));
      }
    }
    
    return Promise.reject(error);
  }
);

type KubbClient = typeof apiClient & {
  getConfig: () => Record<string, unknown>;
  setConfig: (config: Record<string, unknown>) => Record<string, unknown>;
};

export const kubbClient = {
  client: Object.assign(apiClient, {
    getConfig: () => ({}),
    setConfig: (config: Record<string, unknown>) => config,
  } as const) as KubbClient,
} as const;

export const withAuth = { client: kubbClient } as const;

export const $ = {
  ...withAuth,
  query: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },
} as const;

export const $live = {
  ...withAuth,
  query: { 
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  },
} as const;

export const $fresh = {
  ...withAuth,
  query: {
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 3,
  },
} as const;

export const $background = {
  ...withAuth,
  query: {
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  },
} as const;

export async function testApiConnection() {
  try {
    const response = await apiClient.get('/ok');
    console.log('✅ API connection successful!', response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ API connection failed:', error.message);
    return { success: false, error: error.message };
  }
}

if (typeof window !== 'undefined') {
  (window as any).testApi = testApiConnection;
}

export default apiClient;