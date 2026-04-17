"use client";

import { Loader2, Shield } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button-v2";
import { useWallet } from "@/shared/context/wallet-context";
import { activeNetwork } from "@/shared/config/stellar";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";

interface AddTrustlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTrustlineDialog({ open, onOpenChange }: AddTrustlineDialogProps) {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const [assetCode, setAssetCode] = useState("");
  const [issuer, setIssuer] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    assetCode.trim().length >= 1 &&
    assetCode.trim().length <= 12 &&
    issuer.trim().length === 56 &&
    issuer.trim().startsWith("G");

  const handleSubmit = useCallback(async () => {
    if (!address || !isValid) return;
    setLoading(true);

    try {
      await checkWalletNetwork();

      const { Horizon, TransactionBuilder, Operation, Asset } = await import(
        "@stellar/stellar-sdk"
      );

      // Load source account
      const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
        allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
      });
      const account = await horizon.loadAccount(address);

      // Build ChangeTrust transaction
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: activeNetwork.networkPassphrase,
      })
        .addOperation(
          Operation.changeTrust({
            asset: new Asset(assetCode.trim(), issuer.trim()),
          }),
        )
        .setTimeout(180)
        .build();

      const xdr = tx.toXDR();

      // Sign via wallet
      const { StellarWalletsKit } = await import(
        "@creit.tech/stellar-wallets-kit/sdk"
      );
      try {
        StellarWalletsKit.setWallet(address);
      } catch {
        // ignore
      }

      const signingResult = await StellarWalletsKit.signTransaction(xdr, {
        address,
        networkPassphrase: activeNetwork.networkPassphrase,
      });

      const signedXdr = signingResult.signedTxXdr || signingResult;
      if (!signedXdr || typeof signedXdr !== "string") {
        throw new Error("Invalid signed transaction");
      }

      // Submit
      toast.info("Submitting trustline transaction...");
      const signedTx = TransactionBuilder.fromXDR(
        signedXdr,
        activeNetwork.networkPassphrase,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await horizon.submitTransaction(signedTx as any);

      toast.success(`Trustline added for ${assetCode.trim()}`);
      queryClient.invalidateQueries({ queryKey: ["profile", "wallet-tokens"] });

      setAssetCode("");
      setIssuer("");
      onOpenChange(false);
    } catch (err) {
      const msg = parseSigningError(err);
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancel")) {
        toast.error("Transaction rejected");
      } else {
        toast.error("Trustline failed", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  }, [address, assetCode, issuer, isValid, onOpenChange, queryClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Add Trustline
          </DialogTitle>
          <DialogDescription>
            Add a trustline to hold a new Stellar asset in your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Asset Code
            </label>
            <Input
              placeholder="e.g. USDC, BLND, AQUA"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
              maxLength={12}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Issuer Address
            </label>
            <Input
              placeholder="G..."
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              maxLength={56}
              disabled={loading}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Add Trustline"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
