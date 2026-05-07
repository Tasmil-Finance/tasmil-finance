import { useQuery } from "@tanstack/react-query";

export interface TrustlineableToken {
  symbol: string;
  name?: string;
  logo?: string;
  issuer: string;
  contractId?: string;
}

interface RegistryToken {
  symbol: string;
  name?: string;
  logo?: string;
  chains?: string[];
  addresses?: Record<string, string>;
  issuer?: string;
}

interface RegistryResponse {
  tokens?: RegistryToken[];
}

async function fetchTrustlineable(): Promise<TrustlineableToken[]> {
  const res = await fetch("/api/tokens");
  if (!res.ok) throw new Error(`Failed to load tokens (${res.status})`);
  const data = (await res.json()) as RegistryResponse;
  const tokens = data.tokens ?? [];
  return tokens
    .filter(
      (t): t is RegistryToken & { issuer: string } =>
        Array.isArray(t.chains) &&
        t.chains.includes("stellar") &&
        typeof t.issuer === "string" &&
        t.issuer.length > 0
    )
    .map((t) => ({
      symbol: t.symbol,
      name: t.name,
      logo: t.logo,
      issuer: t.issuer,
      contractId: t.addresses?.stellar,
    }));
}

export function useTrustlineableTokens() {
  return useQuery({
    queryKey: ["tokens", "trustlineable"],
    queryFn: fetchTrustlineable,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
