export type ProxyRewrite = {
  source: string;
  destination: string;
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function getPublicAiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["NEXT_PUBLIC_AI_URL"] ?? "";
  return url ? trimTrailingSlash(url) : "";
}

export function getBrowserAiBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
  locationOrigin: string | null | undefined = typeof window !== "undefined"
    ? window.location.origin
    : undefined
): string {
  const url = locationOrigin ?? env["NEXT_PUBLIC_AI_URL"] ?? "";
  return url ? trimTrailingSlash(url) : "";
}

export function getServerAiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["AI_INTERNAL_URL"];
  if (url) return trimTrailingSlash(url);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: AI_INTERNAL_URL");
  }
  return "http://localhost:8001";
}

export function getServerBackendBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["BACKEND_INTERNAL_URL"] ?? env["NEXT_PUBLIC_BACKEND_URL"];
  if (url) return trimTrailingSlash(url);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: BACKEND_INTERNAL_URL");
  }
  return "http://localhost:6756";
}

export function getBrowserBackendBaseUrl(
  _env: NodeJS.ProcessEnv = process.env,
  locationOrigin: string | null | undefined = typeof window !== "undefined"
    ? window.location.origin
    : undefined
): string {
  const url = locationOrigin ?? "";
  return url ? trimTrailingSlash(url) : "";
}

export function getAiProxyRewrites(env: NodeJS.ProcessEnv = process.env): ProxyRewrite[] {
  const aiBaseUrl = getServerAiBaseUrl(env);

  return [
    {
      source: "/assistants/:path*",
      destination: `${aiBaseUrl}/assistants/:path*`,
    },
    {
      source: "/threads/:path*",
      destination: `${aiBaseUrl}/threads/:path*`,
    },
    {
      source: "/runs/:path*",
      destination: `${aiBaseUrl}/runs/:path*`,
    },
    {
      source: "/info",
      destination: `${aiBaseUrl}/info`,
    },
    {
      source: "/ok",
      destination: `${aiBaseUrl}/ok`,
    },
    {
      source: "/agui/:path*",
      destination: `${aiBaseUrl}/agui/:path*`,
    },
  ];
}

export function getBackendProxyRewrites(env: NodeJS.ProcessEnv = process.env): ProxyRewrite[] {
  const backendBaseUrl = getServerBackendBaseUrl(env);

  return [
    {
      source: "/api/account/:path*",
      destination: `${backendBaseUrl}/api/account/:path*`,
    },
    {
      source: "/api/admin/:path*",
      destination: `${backendBaseUrl}/api/admin/:path*`,
    },
    {
      source: "/api/admin-auth/:path*",
      destination: `${backendBaseUrl}/api/admin-auth/:path*`,
    },
    {
      source: "/api/auth/:path*",
      destination: `${backendBaseUrl}/api/auth/:path*`,
    },
    {
      source: "/api/chat-usage/:path*",
      destination: `${backendBaseUrl}/api/chat-usage/:path*`,
    },
    {
      source: "/api/credit/:path*",
      destination: `${backendBaseUrl}/api/credit/:path*`,
    },
    {
      source: "/api/email/:path*",
      destination: `${backendBaseUrl}/api/email/:path*`,
    },
    {
      source: "/api/health",
      destination: `${backendBaseUrl}/api/health`,
    },
    {
      source: "/api/internal/credit/:path*",
      destination: `${backendBaseUrl}/api/internal/credit/:path*`,
    },
    {
      source: "/api/pools/:path*",
      destination: `${backendBaseUrl}/api/pools/:path*`,
    },
    {
      source: "/api/protocol/:path*",
      destination: `${backendBaseUrl}/api/protocol/:path*`,
    },
    {
      source: "/api/rebalance/:path*",
      destination: `${backendBaseUrl}/api/rebalance/:path*`,
    },
    {
      source: "/api/referral/:path*",
      destination: `${backendBaseUrl}/api/referral/:path*`,
    },
    {
      source: "/api/topup/:path*",
      destination: `${backendBaseUrl}/api/topup/:path*`,
    },
    {
      source: "/api/user/:path*",
      destination: `${backendBaseUrl}/api/user/:path*`,
    },
    {
      source: "/api/users/:path*",
      destination: `${backendBaseUrl}/api/users/:path*`,
    },
    {
      source: "/api/welcome-reward/:path*",
      destination: `${backendBaseUrl}/api/welcome-reward/:path*`,
    },
  ];
}
