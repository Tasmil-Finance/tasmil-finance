"use client";

import { Ban, ChevronLeft, ChevronRight, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  useAdminCodes,
  useGenerateCodes,
  useRevokeCode,
} from "@/features/admin-whitelist/hooks/use-admin-codes";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">ACTIVE</Badge>
    );
  if (status === "REVOKED")
    return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20">REVOKED</Badge>;
  return <Badge className="bg-muted text-muted-foreground hover:bg-muted">EXHAUSTED</Badge>;
}

export default function AdminCodesPage() {
  const [quantity, setQuantity] = useState(10);
  const [page, setPage] = useState(1);
  const [lastBatch, setLastBatch] = useState<string[]>([]);

  const { data, isLoading: isLoadingCodes } = useAdminCodes(page);
  const generateCodes = useGenerateCodes();
  const revokeCode = useRevokeCode();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  async function handleGenerate() {
    const result = await generateCodes.mutateAsync({ quantity });
    setLastBatch(result.codes);
    setPage(1);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex h-full gap-6 p-8">
      {/* Left panel — generate */}
      <div className="w-72 flex-shrink-0 space-y-6">
        <div>
          <Typography variant="h2" className="font-bold text-xl">
            Generate Codes
          </Typography>
          <p className="mt-1 text-muted-foreground text-sm">
            Creates standalone EARLY_ACCESS codes
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="quantity" className="mb-1.5 block font-medium text-sm">
              Quantity (1–100)
            </label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(100, Math.max(1, Number(e.target.value))))}
            />
          </div>

          <Button
            variant="gradient"
            onClick={handleGenerate}
            disabled={generateCodes.isPending}
            className="w-full"
          >
            {generateCodes.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {lastBatch.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Last Batch ({lastBatch.length})
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(lastBatch.join("\n"))}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                <Copy className="h-3 w-3" />
                Copy All
              </Button>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {lastBatch.map((code) => (
                <p key={code} className="font-mono text-emerald-400 text-xs">
                  {code}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel — table */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-3">
          <Typography variant="h2" className="font-bold text-xl">
            All Codes
          </Typography>
          {data && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-xs">
              {data.total}
            </span>
          )}
        </div>

        {isLoadingCodes ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-border border-b bg-card">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.codes.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.code)}
                            className="rounded p-1 hover:bg-muted"
                            title="Copy code"
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          {item.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() => revokeCode.mutate(item.id)}
                              disabled={revokeCode.isPending}
                              className="rounded p-1 hover:bg-red-500/10"
                              title="Revoke code"
                            >
                              <Ban className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.codes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        No codes yet. Generate your first batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
