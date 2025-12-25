// lib/server-api-client.ts
// Helper to create axios instance for Server Components
import axios, { AxiosInstance } from "axios";
import { cookies } from "next/headers";

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

/**
 * Create an axios instance for Server Components
 * This instance includes auth token from cookies
 */
export async function createServerApiClient(): Promise<AxiosInstance> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  return apiClient;
}

/**
 * Create config object for Kubb client functions in Server Components
 */
export async function getServerWithAuth() {
  const client = await createServerApiClient();
  
  // Kubb expects a client with getConfig and setConfig methods
  type KubbClient = typeof client & {
    getConfig: () => Record<string, unknown>;
    setConfig: (config: Record<string, unknown>) => Record<string, unknown>;
  };

  // Add getConfig and setConfig methods to axios instance
  const kubbClient = Object.assign(client, {
    getConfig: () => ({}),
    setConfig: (config: Record<string, unknown>) => config,
  } as const) as KubbClient;

  // Match the structure of withAuth: { client: kubbClient }
  // where kubbClient is the axios instance with getConfig/setConfig
  return { client: kubbClient } as const;
}

