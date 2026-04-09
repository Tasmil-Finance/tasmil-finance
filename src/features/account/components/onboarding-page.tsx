'use client';

import { CheckCircle, Loader2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button-v2';
import { useWalletStore } from '@/store/use-wallet';

import {
  useDeployAccount,
  useFundAccount,
  usePresets,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from '../hooks/use-account-api';
import type { RiskPreset } from '../types';
import { FundForm } from './fund-form';
import { PresetCard } from './preset-card';

type Step = 1 | 2 | 3;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Create Account' },
  { step: 2, label: 'Choose Strategy' },
  { step: 3, label: 'Fund' },
];

export function OnboardingPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? null;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset | null>(null);

  const { data: presets, isLoading: presetsLoading } = usePresets();
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const fundAccount = useFundAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  // ---- Step 1: Deploy smart account + setup session keys ----
  const handleDeploy = async () => {
    if (!publicKey) return;
    try {
      const result = await deployAccount.mutateAsync(publicKey);

      if (!result?.xdr) {
        throw new Error('No deploy transaction returned from server');
      }

      // Sign and submit the deploy TX
      const { StellarWalletsKit } =
        await import('@creit.tech/stellar-wallets-kit/sdk');
      const passphrase =
        process.env['NEXT_PUBLIC_STELLAR_PASSPHRASE'] ??
        'Test SDF Network ; September 2015';

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        result.xdr,
        { address: publicKey, networkPassphrase: passphrase },
      );
      await submitTx.mutateAsync({
        signedXdr: signedTxXdr,
        publicKey,
        txType: 'deploy',
      });

      // After deploy confirms, build and sign setup TXs (session key registration)
      try {
        const setupResult = await setupAccount.mutateAsync(publicKey);
        const setupXdrs = setupResult?.setupTxs ?? [];
        for (const setupXdr of setupXdrs) {
          const signed = await StellarWalletsKit.signTransaction(setupXdr, {
            address: publicKey,
            networkPassphrase: passphrase,
          });
          await submitTx.mutateAsync({ signedXdr: signed.signedTxXdr });
        }
      } catch (setupErr) {
        console.error('Setup TXs failed (account deployed but session key not registered):', setupErr);
        // Don't block — account is deployed, setup can be retried
      }

      setCurrentStep(2);
    } catch (err) {
      console.error('Deploy failed:', err);
    }
  };

  // ---- Step 2 → 3 ----
  const handleContinueToFund = async () => {
    if (!selectedPreset || !publicKey) return;
    try {
      await updatePreset.mutateAsync({ publicKey, preset: selectedPreset });
      setCurrentStep(3);
    } catch (err) {
      console.error('Failed to save preset:', err);
    }
  };

  // ---- Step 3: Fund account ----
  const handleFund = async (amount: number, token: 'USDC' | 'XLM') => {
    if (!publicKey) return;
    try {
      const result = await fundAccount.mutateAsync({
        publicKey,
        amount,
        token,
      });

      // Sign via StellarWalletsKit if XDR returned
      if (!result?.xdr) {
        console.error('Fund: no XDR returned from backend');
        return;
      }

      const { StellarWalletsKit } =
        await import('@creit.tech/stellar-wallets-kit/sdk');
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(
        result.xdr,
        {
          address: publicKey,
          networkPassphrase:
            process.env['NEXT_PUBLIC_STELLAR_PASSPHRASE'] ??
            'Test SDF Network ; September 2015',
        }
      );
      await submitTx.mutateAsync({
        signedXdr: signedTxXdr,
        publicKey,
        txType: 'fund',
        amount,
        token,
      });

      router.push('/farming');
    } catch (err) {
      console.error('Fund failed:', err);
    }
  };

  // ---- Not connected ----
  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">
          Connect Your Wallet
        </h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to create a smart account and get started.
        </p>
      </div>
    );
  }

  const isDeploying = deployAccount.isPending || setupAccount.isPending || submitTx.isPending;
  const isFunding = fundAccount.isPending || submitTx.isPending;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl text-foreground">
          Set Up Your Account
        </h1>
        <p className="text-muted-foreground">
          Create a self-custody smart account, pick a strategy, and fund it.
        </p>
      </div>

      {/* Step indicators */}
      <div className="mx-auto mb-10 flex max-w-md items-center justify-between">
        {STEPS.map(({ step, label }, idx) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 font-medium text-sm transition-colors',
                  currentStep > step
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : currentStep === step
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/20 text-muted-foreground'
                )}
              >
                {currentStep > step ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-xs',
                  currentStep >= step
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-3 mb-5 h-px w-16',
                  currentStep > step ? 'bg-emerald-500/50' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 1 && (
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-6">
            <h2 className="font-semibold text-foreground text-xl">
              Create Smart Account
            </h2>
            <p className="text-muted-foreground text-sm">
              Your smart account is a self-custody Stellar account with session
              keys for automated rebalancing. You keep full control — only
              pre-approved actions can be executed by the keeper bot.
            </p>
            <ul className="mx-auto max-w-xs space-y-2 text-left text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Self-custody — your keys, your funds
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Session keys for automated yield
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Revokable at any time
              </li>
            </ul>
          </div>

          <Button
            variant="gradient"
            size="lg"
            className="h-12 w-full"
            onClick={handleDeploy}
            disabled={isDeploying}
          >
            {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeploying ? 'Creating account...' : 'Create Smart Account'}
          </Button>

          {deployAccount.isError && (
            <p className="text-destructive text-sm">
              Failed to create account. Please try again.
            </p>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-semibold text-foreground text-xl">
              Choose Your Strategy
            </h2>
            <p className="text-muted-foreground text-sm">
              Select a risk profile. The AI engine will allocate across pools
              accordingly.
            </p>
          </div>

          {presetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {presets?.map((preset) => (
                <PresetCard
                  key={preset.name}
                  preset={preset}
                  selected={selectedPreset === preset.name}
                  onSelect={() => setSelectedPreset(preset.name)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Button
              variant="gradient"
              size="lg"
              className="h-12 w-full max-w-sm"
              onClick={handleContinueToFund}
              disabled={!selectedPreset}
            >
              Continue with {selectedPreset ?? '...'}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="mx-auto max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="font-semibold text-foreground text-xl">
              Fund Your Account
            </h2>
            <p className="text-muted-foreground text-sm">
              Deposit funds to start earning yield with the{' '}
              <span className="font-medium text-foreground">
                {selectedPreset}
              </span>{' '}
              strategy.
            </p>
          </div>

          <FundForm onFund={handleFund} isLoading={isFunding} />

          {fundAccount.isError && (
            <p className="text-center text-destructive text-sm">
              Funding failed. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
