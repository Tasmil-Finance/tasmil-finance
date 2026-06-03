import { createHash } from "node:crypto";
import { Memo, Transaction, TransactionBuilder, xdr } from "@stellar/stellar-sdk";

export const WELCOME_REWARD_MARKER = "tasmil:wr:v1";

export function buildWelcomeRewardMemo(): Memo {
  const digest = createHash("sha256").update(WELCOME_REWARD_MARKER).digest();
  return Memo.hash(digest);
}

function extractSorobanData(tx: Transaction): xdr.SorobanTransactionData | undefined {
  const envelope = tx.toEnvelope();
  const sorobanExt = envelope.v1().tx().ext();

  if (sorobanExt.switch() !== 1) {
    return undefined;
  }

  return sorobanExt.sorobanData();
}

function deriveCloneBaseFee(
  tx: Transaction,
  sorobanData?: xdr.SorobanTransactionData,
): string {
  const operationCount = BigInt(Math.max(tx.operations.length, 1));
  const totalFee = BigInt(tx.fee);
  const resourceFee = sorobanData ? BigInt(sorobanData.resourceFee().toString()) : 0n;
  const classicFee = totalFee - resourceFee;

  return (classicFee > 0n ? classicFee / operationCount : 100n).toString();
}

/**
 * Stamp an unsigned XDR with the Tasmil welcome-reward memo hash.
 * No-op if memo is already set on the transaction.
 */
export function stampWelcomeRewardMemoXdr(
  txXdr: string,
  networkPassphrase: string,
): string {
  try {
    const tx = TransactionBuilder.fromXDR(txXdr, networkPassphrase);
    if (!(tx instanceof Transaction) || tx.memo.type !== "none") {
      return txXdr;
    }

    const sorobanData = extractSorobanData(tx);
    const builder = TransactionBuilder.cloneFrom(tx, {
      fee: deriveCloneBaseFee(tx, sorobanData),
      memo: buildWelcomeRewardMemo(),
      networkPassphrase,
    });

    if (sorobanData) {
      builder.setSorobanData(sorobanData);
    }

    return builder.build().toXDR();
  } catch {
    return txXdr;
  }
}
