export interface AdminFiatTopup {
  id: string;
  status: "PENDING" | "FULFILLED" | "EXPIRED" | "CANCELLED";
  rail: "FIAT";
  reference: string | null;
  pricingSnapshotUsd: string;
  pricingCredits: number;
  pricingPoints: number;
  createdAt: string;
  expiresAt: string;
  user: { id: string; stellarPubkey: string };
  package: { id: string };
}
