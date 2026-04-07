declare module "@stellar/freighter-api" {
  export function signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string },
  ): Promise<string>;

  export function isConnected(): Promise<boolean>;

  export function getPublicKey(): Promise<string>;
}
