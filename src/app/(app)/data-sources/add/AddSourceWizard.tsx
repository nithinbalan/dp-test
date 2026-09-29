'use client';

/**
 * Owns the four-step Add Source flow.
 *
 * Page-local, like `SourceRegister` — this step sequence and its per-connector
 * field logic belong to Data Sources, not to the design system. Submitting adds
 * the source to the mock store and returns to the register, where its first scan
 * is already running: the register starts one for any connected source that has
 * never been scanned.
 */
import { useMemo } from 'react';
import NextLink from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Plug, Rocket, TriangleAlert } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { PageHeader } from '@molecules/PageHeader';
import { Stepper } from '@molecules/Stepper';
import { WizardShell } from '@templates/WizardShell';
import type { Connector } from '@shared/mock/connectors';
import type { AddSourceMessages, AddSourceState, ConnectionTest } from './AddSourceWizard.types';
import { ConnectorStep } from './ConnectorStep';
import { ConnectStep } from './ConnectStep';
import { ReviewStep } from './ReviewStep';
import { ScanStep } from './ScanStep';
import { useAddSourceFlow } from './use-add-source-flow';

const STEP_COUNT = 4;

/** The outcome of the last connection test, shown beside the footer buttons. */
function TestResult({ test, t }: { test: ConnectionTest; t: AddSourceMessages }) {
  if (test === 'ok') {
    return (
      <Text
        as="span"
        size="xs"
        tone="success"
        isMono
        className="bg-success-subtle rounded-pill flex items-center gap-1.5 px-3 py-1.5"
      >
        <CheckCircle2 className="size-4" />
        {t.testOk}
      </Text>
    );
  }
  if (test === 'missingFields') {
    return (
      <Text
        as="span"
        size="xs"
        tone="danger"
        isMono
        className="bg-danger-subtle rounded-pill flex items-center gap-1.5 px-3 py-1.5"
      >
        <TriangleAlert className="size-4" />
        {t.testMissingFields}
      </Text>
    );
  }
  return null;
}

export function AddSourceWizard({ messages: t }: { messages: AddSourceMessages }) {
  const flow = useAddSourceFlow(t);
  const { step, setStep } = flow;

  const steps = useMemo(
    () =>
      [t.stepConnector, t.stepConnect, t.stepScan, t.stepReview].map((label, index) => ({
        value: String(index),
        label,
      })),
    [t],
  );

  return (
    <div className="flex flex-col gap-6">
      <NextLink
        href="/data-sources"
        className="text-fg-subtle hover:text-brand-fg inline-flex w-fit items-center gap-2 text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" />
        {t.backToSources}
      </NextLink>
      <PageHeader label={t.title} refTag={t.refTag} description={t.description} />
      <WizardShell
        stepperSlot={
          <Stepper
            steps={steps}
            activeIndex={step}
            messages={{ label: t.stepperLabel }}
            onValueChange={(value) => {
              setStep(Number(value));
            }}
          />
        }
        footerSlot={
          <WizardFooter
            t={t}
            step={step}
            hasConnector={flow.connector !== undefined}
            test={flow.test}
            isSubmitting={flow.isSubmitting}
            onBack={() => {
              setStep((current) => current - 1);
            }}
            onTest={flow.testConnection}
            onContinue={() => {
              if (step === 1) flow.continueFromConnect();
              else setStep((current) => current + 1);
            }}
            onSubmit={flow.submit}
          />
        }
      >
        <WizardBody
          t={t}
          step={step}
          state={flow.state}
          connector={flow.connector}
          invalidKeys={flow.invalidKeys}
          isLoadingDatabases={flow.isLoadingDatabases}
          onSelectConnector={flow.selectConnector}
          onValueChange={flow.setValue}
          onChange={flow.change}
          onLoadDatabases={flow.loadDatabases}
        />
      </WizardShell>
    </div>
  );
}

function WizardFooter({
  t,
  step,
  hasConnector,
  test,
  isSubmitting,
  onBack,
  onTest,
  onContinue,
  onSubmit,
}: {
  t: AddSourceMessages;
  step: number;
  hasConnector: boolean;
  test: ConnectionTest;
  isSubmitting: boolean;
  onBack: () => void;
  onTest: () => void;
  onContinue: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      {step === 0 ? (
        <Button asChild variant="ghost">
          <NextLink href="/data-sources">{t.cancel}</NextLink>
        </Button>
      ) : (
        <Button
          variant="outline"
          startSlot={<ArrowLeft className="size-4 rtl:-scale-x-100" />}
          onClick={onBack}
        >
          {t.back}
        </Button>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {step === 0 ? (
          <Text as="span" size="xs" tone="muted" isMono className="tracking-wider uppercase">
            {t.pickHint}
          </Text>
        ) : null}
        {step === 1 ? <TestResult test={test} t={t} /> : null}
        {step === 1 ? (
          <Button
            variant="outline"
            isLoading={test === 'testing'}
            startSlot={<Plug className="size-4" />}
            onClick={onTest}
          >
            {test === 'testing' ? t.testingLabel : t.testConnection}
          </Button>
        ) : null}
        {step > 0 && step < STEP_COUNT - 1 ? (
          <Button
            tone="brand"
            isDisabled={!hasConnector}
            endSlot={<ArrowRight className="size-4 rtl:-scale-x-100" />}
            onClick={onContinue}
          >
            {t.continueCta}
          </Button>
        ) : step === STEP_COUNT - 1 ? (
          <Button
            tone="brand"
            isLoading={isSubmitting}
            startSlot={<Rocket className="size-4" />}
            onClick={onSubmit}
          >
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        ) : null}
      </div>
    </>
  );
}

/** Falls back to step 1 whenever no connector is chosen — every later step needs one. */
function WizardBody({
  t,
  step,
  state,
  connector,
  invalidKeys,
  isLoadingDatabases,
  onSelectConnector,
  onValueChange,
  onChange,
  onLoadDatabases,
}: {
  t: AddSourceMessages;
  step: number;
  state: AddSourceState;
  connector: Connector | undefined;
  invalidKeys: ReadonlySet<string>;
  isLoadingDatabases: boolean;
  onSelectConnector: (id: string) => void;
  onValueChange: (key: string, value: string) => void;
  onChange: (patch: Partial<AddSourceState>) => void;
  onLoadDatabases: () => void;
}) {
  if (step === 0 || connector === undefined) {
    return <ConnectorStep t={t} selectedId={state.connectorId} onSelect={onSelectConnector} />;
  }
  if (step === 1) {
    return (
      <ConnectStep
        connector={connector}
        state={state}
        t={t}
        invalidKeys={invalidKeys}
        isLoadingDatabases={isLoadingDatabases}
        onValueChange={onValueChange}
        onChange={onChange}
        onLoadDatabases={onLoadDatabases}
      />
    );
  }
  if (step === 2) {
    return <ScanStep connectorName={connector.name} state={state} t={t} onChange={onChange} />;
  }
  return <ReviewStep connector={connector} state={state} t={t} />;
}
