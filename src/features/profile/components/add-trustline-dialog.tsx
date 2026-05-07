"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { activeNetwork } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { WalletToken } from "../hooks/use-wallet-tokens";
import { AssetPicker, type AssetPickerValue } from "./asset-picker";

interface AddTrustlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTokens: WalletToken[];
}

export function AddTrustlineDialog({
  open,
  onOpenChange,
  existingTokens,
}: AddTrustlineDialogProps) {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<AssetPickerValue | null>(null);
  const [loading, setLoading] = useState(false);

  const excludeKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of existingTokens) {
      if (t.assetIssuer) set.add(`${t.assetCode}:${t.assetIssuer}`);
    }
    return set;
  }, [existingTokens]);

  const isValid = selected !== null;

  const handleSubmit = useCallback(async () => {
    if (!address || !selected) return;
    setLoading(true);

    try {
      await checkWalletNetwork();

      const { Horizon, TransactionBuilder, Operation, Asset } = await import(
        "@stellar/stellar-sdk"
      );

      const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
        allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
      });
      const account = await horizon.loadAccount(address);

      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: activeNetwork.networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: new Asset(selected.code, selected.issuer) }))
        .setTimeout(180)
        .build();

      const xdr = tx.toXDR();

      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
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

      toast.info("Submitting trustline transaction...");
      const signedTx = TransactionBuilder.fromXDR(signedXdr, activeNetwork.networkPassphrase);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await horizon.submitTransaction(signedTx as any);

      toast.success(`Trustline added for ${selected.code}`);
      queryClient.invalidateQueries({ queryKey: ["profile", "wallet-tokens"] });

      setSelected(null);
      onOpenChange(false);
    } catch (err) {
      const msg = parseSigningError(err);
      const lower = msg.toLowerCase();
      if (lower.includes("op_already_exists") || lower.includes("already_exists")) {
        toast.success(`Trustline already exists for ${selected.code}`);
        queryClient.invalidateQueries({ queryKey: ["profile", "wallet-tokens"] });
        setSelected(null);
        onOpenChange(false);
      } else if (lower.includes("reject") || lower.includes("denied") || lower.includes("cancel")) {
        toast.error("Transaction rejected");
      } else {
        toast.error("Trustline failed", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  }, [address, selected, onOpenChange, queryClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle>Add Trustline</DialogTitle>
          <DialogDescription>
            Add a trustline to hold a new Stellar asset in your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Asset</label>
            <AssetPicker
              value={selected}
              onChange={setSelected}
              excludeKeys={excludeKeys}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
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
