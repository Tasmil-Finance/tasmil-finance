import BigNumber from "bignumber.js";
import type { DecodedOp, TxAttrs, TxGroup } from "./types";

const PRIMARY_PRIORITY: ReadonlyArray<DecodedOp["kind"]> = [
  "swap",
  "lend-deposit",
  "lend-withdraw",
  "lp-deposit",
  "lp-withdraw",
  "harvest",
];

function pickPrimary(ops: DecodedOp[]): DecodedOp {
  for (const kind of PRIMARY_PRIORITY) {
    const found = ops.find((o) => o.kind === kind);
    if (found) return found;
  }
  // Largest absolute delta sum.
  let best = ops[0]!;
  let bestAbs = new BigNumber(0);
  for (const o of ops) {
    const abs = o.deltas.reduce(
      (acc, d) => acc.plus(new BigNumber(d.amount).abs()),
      new BigNumber(0)
    );
    if (abs.gt(bestAbs)) {
      bestAbs = abs;
      best = o;
    }
  }
  return best;
}

export function groupByTransaction(
  ops: DecodedOp[],
  attrsByTx: Record<string, TxAttrs>
): TxGroup[] {
  const map = new Map<string, DecodedOp[]>();
  for (const o of ops) {
    const list = map.get(o.txHash);
    if (list) list.push(o);
    else map.set(o.txHash, [o]);
  }

  const groups: TxGroup[] = [];
  for (const [txHash, txOps] of map) {
    const successful = txOps.every((o) => o.successful);
    const primary = pickPrimary(txOps);
    const earliest = txOps.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt;
    groups.push({
      txHash,
      createdAt: earliest,
      successful,
      primary,
      ops: txOps,
      attrs: attrsByTx[txHash] ?? {},
    });
  }
  return groups;
}
