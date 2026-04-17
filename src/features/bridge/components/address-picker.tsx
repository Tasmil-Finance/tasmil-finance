"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Check, ChevronDown, Pencil, Plus, Unplug, Wallet, X, AlertCircle } from "lucide-react";
import { useAddressStore, type ChainType, type SavedAddress } from "@/store/use-address";
import { TokenImage } from "@/shared/components/token-image";

function truncAddr(addr: string) {
  if (!addr) return "";
  return addr.length <= 14 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getChainLogo(chainType: ChainType): string {
  switch (chainType) {
    case "stellar": return "/chains/stellar.png";
    case "evm": return "/chains/ethereum.png";
    case "solana": return "/chains/solana.png";
  }
}

function getChainLabel(chainType: ChainType): string {
  switch (chainType) {
    case "stellar": return "Stellar";
    case "evm": return "EVM";
    case "solana": return "Solana";
  }
}

function validateAddress(address: string, chainType: ChainType): boolean {
  if (!address.trim()) return false;
  switch (chainType) {
    case "stellar":
      return /^G[A-Z2-7]{55}$/.test(address.trim());
    case "evm":
      return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
    case "solana":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());
    default:
      return address.trim().length > 10;
  }
}

// ─── Address Picker Component ───────────────────────────────────

interface AddressPickerProps {
  direction: "source" | "dest";
  chainType: ChainType;
  selectedAddress: string | null;
  onSelect: (address: string) => void;
  stellarAddress?: string | null;
  evmAddress?: string | null;
  solanaAddress?: string | null;
  onConnectWallet?: () => void;
  onDisconnectStellar?: () => void;
  onDisconnectEvm?: () => void;
}

export function AddressPicker({
  direction,
  chainType,
  selectedAddress,
  onSelect,
  stellarAddress,
  evmAddress,
  solanaAddress,
  onConnectWallet,
  onDisconnectStellar,
  onDisconnectEvm,
}: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState("");

  const store = useAddressStore();

  // Get all addresses for this chain type
  const chainAddresses = useMemo(() => {
    const addrs: SavedAddress[] = [];
    const seen = new Set<string>();

    // 1. Connected wallet (live)
    const connectedAddr =
      chainType === "stellar" ? stellarAddress :
      chainType === "evm" ? evmAddress :
      chainType === "solana" ? solanaAddress : null;

    if (connectedAddr && !seen.has(connectedAddr)) {
      addrs.push({
        address: connectedAddr,
        label: `Connected ${getChainLabel(chainType)}`,
        chainType,
        source: "connected",
        addedAt: Date.now(),
      });
      seen.add(connectedAddr);
    }

    // 2. Saved addresses from store
    for (const a of store.getByChain(chainType)) {
      if (!seen.has(a.address)) {
        addrs.push(a);
        seen.add(a.address);
      }
    }

    return addrs;
  }, [chainType, stellarAddress, evmAddress, solanaAddress, store]);

  const handleSelectAddress = (addr: string) => {
    onSelect(addr);
    setOpen(false);
    setManualInput("");
    setManualError("");
  };

  const handleAddManual = () => {
    const addr = manualInput.trim();
    if (!addr) return;

    if (!validateAddress(addr, chainType)) {
      setManualError(`Invalid ${getChainLabel(chainType)} address`);
      return;
    }

    // Save to store
    store.addAddress({
      address: addr,
      label: `Manual ${getChainLabel(chainType)}`,
      chainType,
      source: "manual",
    });

    handleSelectAddress(addr);
  };

  const logo = getChainLogo(chainType);
  const label = direction === "source" ? "From" : "To";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {selectedAddress ? (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg py-1 px-2 text-sm transition-colors cursor-pointer"
            style={{ color: "var(--muted-foreground)" }}
          >
            <TokenImage src={logo} alt={chainType} className="h-4 w-4 rounded-full shrink-0" />
            <span>{truncAddr(selectedAddress)}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg py-1 px-2 text-sm transition-colors cursor-pointer"
            style={{ background: "var(--input)", color: "var(--muted-foreground)" }}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Add Address</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[480px] p-0 gap-0 rounded-2xl overflow-hidden border-0"
        style={{ background: "var(--card)" }}
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            {label} Address
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-4">
          {/* ── Manual Address Input ── */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>
              Enter {getChainLabel(chainType)} address
            </p>
            <div className="relative">
              <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--ring)" }} />
              <input
                type="text"
                placeholder={
                  chainType === "stellar" ? "G..." :
                  chainType === "evm" ? "0x..." :
                  "Solana address..."
                }
                value={manualInput}
                onChange={(e) => { setManualInput(e.target.value); setManualError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddManual(); }}
                className="w-full rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] border-0"
                style={{ background: "var(--secondary)", color: "var(--foreground)" }}
              />
              {manualInput && (
                <button
                  type="button"
                  onClick={() => { setManualInput(""); setManualError(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                </button>
              )}
            </div>
            {manualError && (
              <p className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>
                <AlertCircle className="h-3 w-3" /> {manualError}
              </p>
            )}
            {manualInput && !manualError && validateAddress(manualInput, chainType) && (
              <button
                type="button"
                onClick={handleAddManual}
                className="mt-2 w-full flex items-center gap-2 rounded-xl p-3 text-sm transition-colors"
                style={{ background: "var(--secondary)", color: "var(--foreground)" }}
              >
                <TokenImage src={logo} alt={chainType} className="h-5 w-5 rounded-full" />
                <span className="font-mono text-xs truncate flex-1">{manualInput}</span>
                <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>Use this</span>
              </button>
            )}
          </div>

          {/* ── Connected Wallets ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                <Wallet className="h-3.5 w-3.5" /> Connected Wallets
              </p>
              {onConnectWallet && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); setTimeout(() => onConnectWallet(), 200); }}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: "var(--primary)" }}
                >
                  <Plus className="h-3 w-3" /> Connect new
                </button>
              )}
            </div>

            <ScrollArea className="max-h-[280px]">
              <div className="flex flex-col gap-1">
                {chainAddresses.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: "var(--ring)" }}>
                    No wallets connected
                  </p>
                )}
                {chainAddresses.map((item) => {
                  const isSelected = selectedAddress === item.address;
                  return (
                    <button
                      key={item.address}
                      type="button"
                      onClick={() => handleSelectAddress(item.address)}
                      className="flex items-center gap-3 rounded-xl p-3 text-left transition-colors"
                      style={{ background: isSelected ? "var(--accent)" : "transparent" }}
                    >
                      <TokenImage src={logo} alt={chainType} className="h-9 w-9 rounded-lg object-contain shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {truncAddr(item.address)}
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                          {item.source === "connected" ? (
                            <><Wallet className="h-3 w-3" /> {item.label}</>
                          ) : (
                            <><Pencil className="h-3 w-3" /> {item.label}</>
                          )}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />}
                      {/* Disconnect button for connected wallets */}
                      {item.source === "connected" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.chainType === "stellar" && onDisconnectStellar) onDisconnectStellar();
                            else if (item.chainType === "evm" && onDisconnectEvm) onDisconnectEvm();
                          }}
                          className="p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                          title="Disconnect"
                        >
                          <Unplug className="h-4 w-4" style={{ color: "var(--ring)" }} />
                        </button>
                      )}
                      {/* Remove button for manual addresses */}
                      {item.source === "manual" && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); store.removeAddress(item.address); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                        >
                          <X className="h-3.5 w-3.5" style={{ color: "var(--ring)" }} />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
