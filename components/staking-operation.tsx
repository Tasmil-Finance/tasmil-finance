"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button-v2";
import { Typography } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Coins,
  TrendingUp,
} from "lucide-react";
import {
  useDelegateStake,
  useUndelegateStake,
  useClaimRewards,
  useRestakeRewards,
  useLockStake,
} from "@/hooks/use-staking-operations";

interface StakingOperationProps {
  operation: {
    action: string;
    validatorID: number;
    amount?: number;
    amountFormatted?: string;
    wrID?: number;
    lockupDuration?: number;
    lockupDurationDays?: number;
    message: string;
    requiresWallet: boolean;
    requiresConfirmation: boolean;
  };
  onSuccess?: (result: {
    hash: string;
    success: boolean;
    message: string;
  }) => void;
  onError?: (error: string) => void;
}

export function StakingOperation({
  operation,
  onSuccess,
  onError,
}: StakingOperationProps) {
  const { address, isConnected } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    hash?: string;
    message: string;
  } | null>(null);

  // Hooks for different operations
  const delegateStake = useDelegateStake();
  const undelegateStake = useUndelegateStake();
  const claimRewards = useClaimRewards();
  const restakeRewards = useRestakeRewards();
  const lockStake = useLockStake();

  const handleExecute = async () => {
    if (!isConnected || !address) {
      onError?.("Please connect your wallet first");
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      let result;

      switch (operation.action) {
        case "delegate":
          if (!operation.amount) {
            throw new Error("Amount is required for delegation");
          }
          result = await delegateStake.delegateStake(
            operation.validatorID,
            operation.amount.toString()
          );
          break;

        case "undelegate":
          if (!operation.amount || !operation.wrID) {
            throw new Error(
              "Amount and withdrawal request ID are required for undelegation"
            );
          }
          result = await undelegateStake.undelegateStake(
            operation.validatorID,
            operation.wrID,
            operation.amount.toString()
          );
          break;

        case "claimRewards":
          result = await claimRewards.claimRewards(operation.validatorID);
          break;

        case "restakeRewards":
          result = await restakeRewards.restakeRewards(operation.validatorID);
          break;

        case "lockStake":
          if (!operation.amount || !operation.lockupDuration) {
            throw new Error(
              "Amount and lockup duration are required for locking stake"
            );
          }
          result = await lockStake.lockStake(
            operation.validatorID,
            operation.lockupDuration,
            operation.amount.toString()
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${operation.action}`);
      }

      const successResult = {
        success: true,
        hash: result.hash,
        message: `Transaction successful! Hash: ${result.hash}`,
      };

      setExecutionResult(successResult);
      onSuccess?.(successResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setExecutionResult({
        success: false,
        message: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const getOperationIcon = () => {
    switch (operation.action) {
      case "delegate":
        return <Coins className="h-5 w-5 text-primary" />;
      case "undelegate":
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case "claimRewards":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "restakeRewards":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "lockStake":
        return <Coins className="h-5 w-5 text-purple-500" />;
      default:
        return <Coins className="h-5 w-5 text-primary" />;
    }
  };

  const getOperationTitle = () => {
    switch (operation.action) {
      case "delegate":
        return "Delegate Stake";
      case "undelegate":
        return "Undelegate Stake";
      case "claimRewards":
        return "Claim Rewards";
      case "restakeRewards":
        return "Restake Rewards";
      case "lockStake":
        return "Lock Stake";
      default:
        return "Staking Operation";
    }
  };

  const getButtonText = () => {
    if (isExecuting) return "Processing...";
    switch (operation.action) {
      case "delegate":
        return "Stake U2U";
      case "undelegate":
        return "Unstake U2U";
      case "claimRewards":
        return "Claim Rewards";
      case "restakeRewards":
        return "Restake Rewards";
      case "lockStake":
        return "Lock Stake";
      default:
        return "Execute";
    }
  };

  const isPending =
    delegateStake.isPending ||
    undelegateStake.isPending ||
    claimRewards.isPending ||
    restakeRewards.isPending ||
    lockStake.isPending;

  const hasError =
    delegateStake.isError ||
    undelegateStake.isError ||
    claimRewards.isError ||
    restakeRewards.isError ||
    lockStake.isError;

  const errorMessage =
    delegateStake.errorMessage ||
    undelegateStake.errorMessage ||
    claimRewards.errorMessage ||
    restakeRewards.errorMessage ||
    lockStake.errorMessage;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getOperationIcon()}
          <CardTitle className="text-xl">{getOperationTitle()}</CardTitle>
        </div>
        <CardDescription>{operation.message}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Operation Details */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Typography variant="small" color="foreground">
              Validator ID
            </Typography>
            <Typography variant="small" weight="semibold">
              {operation.validatorID}
            </Typography>
          </div>

          {operation.amount && (
            <div className="flex justify-between">
              <Typography variant="small" color="foreground">
                Amount
              </Typography>
              <Typography variant="small" weight="semibold">
                {operation.amountFormatted}
              </Typography>
            </div>
          )}

          {operation.wrID && (
            <div className="flex justify-between">
              <Typography variant="small" color="foreground">
                Withdrawal Request ID
              </Typography>
              <Typography variant="small" weight="semibold">
                {operation.wrID}
              </Typography>
            </div>
          )}

          {operation.lockupDurationDays && (
            <div className="flex justify-between">
              <Typography variant="small" color="foreground">
                Lockup Duration
              </Typography>
              <Typography variant="small" weight="semibold">
                {operation.lockupDurationDays} days
              </Typography>
            </div>
          )}
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to proceed with this operation.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {(hasError || executionResult?.success === false) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || executionResult?.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Execute Button - Only show if no successful transaction */}
        {!executionResult?.success && (
          <Button
            onClick={handleExecute}
            disabled={!isConnected || isExecuting || isPending}
            className="w-full h-10 rounded-lg"
            variant={"gradient"}
          >
            {isExecuting || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {getButtonText()}
              </>
            ) : (
              getButtonText()
            )}
          </Button>
        )}

        {/* Success message - Simple confirmation without hash */}
        {executionResult?.success && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <Typography
                variant="small"
                className="text-green-600 font-medium"
              >
                Transaction submitted successfully!
              </Typography>
            </div>
            <Typography variant="small" className="text-muted-foreground">
              The transaction result will be updated automatically.
            </Typography>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

