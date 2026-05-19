import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getBrowserAiBaseUrl } from "@/lib/runtime-urls";
import { useAuthStore } from "@/store/use-auth";

export const getApiBaseUrl = () => {
  return getBrowserAiBaseUrl();
};

// Lazy-initialize baseURL so window.location.origin is available at call time
const apiClient = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Set baseURL dynamically on each request (handles devtunnels/port-forwarding)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!config.baseURL) {
      config.baseURL = getBrowserAiBaseUrl();
    }
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const detail =
      typeof error.response?.data === "object" &&
      error.response?.data &&
      "detail" in error.response.data
        ? String((error.response.data as { detail?: unknown }).detail)
        : "";
    const isSessionInvalid =
      error.response?.status === 401 ||
      (error.response?.status === 403 && detail === "SESSION_INVALID");

    if (isSessionInvalid && !orig._retry) {
      orig._retry = true;
      if (typeof window !== "undefined") {
        const fresh = !useAuthStore.getState().isTokenExpired();
        const url = orig?.url ?? "unknown";
        console.warn(
          `[auth:ai] ${error.response?.status} from ${url} (token fresh=${fresh}, detail=${detail || "n/a"})`
        );
        window.dispatchEvent(new CustomEvent("auth:session-invalid", { detail: { fresh, url } }));
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
    const response = await apiClient.get("/ok");
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

if (typeof window !== "undefined") {
  (window as any).testApi = testApiConnection;
}

export default apiClient;
