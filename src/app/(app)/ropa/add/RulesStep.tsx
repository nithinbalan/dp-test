'use client';

/** Step 3 of the Add/Edit Activity wizard. Prototype source: `.rpa-step[data-rpstep="3"]`. */
import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { PeoplePicker, type PersonOption } from '@molecules/PeoplePicker';
import { SegmentedControl } from '@molecules/SegmentedControl';
import { TagPicker } from '@molecules/TagPicker';
import { cn } from '@shared/lib';
import type { LawfulBasis } from '@shared/mock/ropa';
import type {
  AddActivityFieldErrors,
  AddActivityMessages,
  AddActivityState,
} from './AddActivityWizard.types';

const BASIS_ORDER: LawfulBasis[] = [
  'consent',
  'voluntary',
  'employment',
  'legal-obligation',
  'parental-consent',
  'security',
];

/** Companies that process data on the workspace's behalf. Fixture, like the prototype's RPA_PROCS — no vendor register is wired up yet. */
const PROCESSOR_OPTIONS = [
  'Razorpay',
  'AWS ap-south-1',
  'WhatsApp BSP',
  'Courier partner',
  'Marketing tool',
].map((name) => ({ value: name, label: name }));

/** Defaults mirror the prototype's RPA_OPS/RPA_SEC pre-selection — the operations and
 * safeguards most activities already have in place. */
const OPERATION_OPTIONS = ['Collection', 'Storage', 'Use', 'Sharing', 'Retrieval', 'Erasure'].map(
  (name) => ({ value: name, label: name }),
);
const SECURITY_OPTIONS = [
  'Encryption at rest',
  'Access control',
  'Audit logging',
  'Backups',
  'Masking',
].map((name) => ({ value: name, label: name }));

function basisLabel(
  t: AddActivityMessages,
  basis: LawfulBasis,
): { title: string; description: string; ref: string } {
  const map: Record<LawfulBasis, { title: string; description: string; ref: string }> = {
    consent: {
      title: t.wizardBasisConsent,
      description: t.wizardBasisConsentDesc,
      ref: t.wizardBasisConsentRef,
    },
    voluntary: {
      title: t.wizardBasisVoluntary,
      description: t.wizardBasisVoluntaryDesc,
      ref: t.wizardBasisVoluntaryRef,
    },
    employment: {
      title: t.wizardBasisEmployment,
      description: t.wizardBasisEmploymentDesc,
      ref: t.wizardBasisEmploymentRef,
    },
    'legal-obligation': {
      title: t.wizardBasisLegal,
      description: t.wizardBasisLegalDesc,
      ref: t.wizardBasisLegalRef,
    },
    'parental-consent': {
      title: t.wizardBasisParental,
      description: t.wizardBasisParentalDesc,
      ref: t.wizardBasisParentalRef,
    },
    security: {
      title: t.wizardBasisSecurity,
      description: t.wizardBasisSecurityDesc,
      ref: t.wizardBasisSecurityRef,
    },
  };
  return map[basis];
}

function BasisOption({
  title,
  description,
  ref: refTag,
  isSelected,
  onSelect,
}: {
  title: string;
  description: string;
  ref: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} className="text-start">
      <Card isInteractive variant={isSelected ? 'soft' : 'outline'} size="sm" className="h-full">
        <Text size="sm" weight="bold" className="block">
          {title}
        </Text>
        <Text size="xs" tone="muted" className="mt-0.5 block">
          {description}
        </Text>
        <Text size="2xs" tone="brand" isMono weight="medium" className="mt-1.5 block">
          {refTag}
        </Text>
      </Card>
    </button>
  );
}

function AdvancedSection({
  t,
  state,
  onChange,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  onChange: (next: Partial<AddActivityState>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-border-default rounded-control border">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        className="text-fg-muted flex w-full items-center gap-2 px-3.5 py-2.5 text-start"
      >
        <SlidersHorizontal className="size-4" />
        <Text size="xs" weight="medium" className="flex-1">
          {t.wizardAdvancedToggle}
        </Text>
        <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="border-border-default flex flex-col gap-4 border-t px-3.5 py-3.5">
          <TagPicker
            label={t.wizardOperationsLabel}
            description={t.wizardOperationsHint}
            options={OPERATION_OPTIONS}
            value={state.operations}
            onValueChange={(operations) => {
              onChange({ operations });
            }}
          />
          <TagPicker
            label={t.wizardSecurityLabel}
            description={t.wizardSecurityHint}
            options={SECURITY_OPTIONS}
            value={state.securityMeasures}
            onValueChange={(securityMeasures) => {
              onChange({ securityMeasures });
            }}
          />
        </div>
      )}
    </div>
  );
}

function BasisGrid({
  t,
  selected,
  isInvalid,
  onSelect,
}: {
  t: AddActivityMessages;
  selected: string;
  isInvalid: boolean;
  onSelect: (basis: LawfulBasis) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text size="sm" weight="medium">
        {t.wizardLawfulBasisLabel}
      </Text>
      <Text size="xs" tone="muted">
        {t.wizardLawfulBasisHint}
      </Text>
      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BASIS_ORDER.map((basis) => {
          const { title, description, ref } = basisLabel(t, basis);
          return (
            <BasisOption
              key={basis}
              title={title}
              description={description}
              ref={ref}
              isSelected={selected === basis}
              onSelect={() => {
                onSelect(basis);
              }}
            />
          );
        })}
      </div>
      {isInvalid && (
        <p role="alert" className="text-danger-fg text-xs">
          {t.wizardBasisError}
        </p>
      )}
    </div>
  );
}

function RetentionAndOwner({
  t,
  state,
  people,
  isOwnerInvalid,
  onChange,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  people: readonly PersonOption[];
  isOwnerInvalid: boolean;
  onChange: (next: Partial<AddActivityState>) => void;
}) {
  const retentionOptions: ListboxOption[] = [
    { value: 'until-purpose', label: t.wizardRetentionUntilPurpose },
    { value: '12-months', label: t.wizardRetention12Months },
    { value: '24-months', label: t.wizardRetention24Months },
    { value: '8-years-tax', label: t.wizardRetention8YearsTax },
    { value: 'kyc', label: t.wizardRetentionKyc },
    { value: '90-days', label: t.wizardRetention90Days },
    { value: 'majority', label: t.wizardRetentionMajority },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Listbox
        label={t.wizardRetentionLabel}
        options={retentionOptions}
        value={state.retention}
        onValueChange={(retention) => {
          onChange({ retention });
        }}
        fullWidth
      />
      <PeoplePicker
        label={t.wizardOwnerLabel}
        people={people}
        value={state.ownerId}
        errorMessage={isOwnerInvalid ? t.wizardOwnerError : undefined}
        onValueChange={(ownerId) => {
          onChange({ ownerId });
        }}
        isRequired
        variant="trigger"
        employeeRegisterHref="/employees"
        messages={{
          searchPlaceholder: t.wizardOwnerSearchPlaceholder,
          escHint: t.wizardOwnerEscHint,
          footerLabel: t.wizardOwnerFooterLabel,
          manageLabel: t.wizardOwnerManageLabel,
        }}
      />
    </div>
  );
}

export function RulesStep({
  t,
  state,
  people,
  errors,
  onChange,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  people: readonly PersonOption[];
  errors: AddActivityFieldErrors;
  onChange: (next: Partial<AddActivityState>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Heading level={2} size="lg">
        {t.step3Heading}
      </Heading>

      <BasisGrid
        t={t}
        selected={state.lawfulBasis}
        isInvalid={errors.lawfulBasis ?? false}
        onSelect={(lawfulBasis) => {
          onChange({ lawfulBasis });
        }}
      />

      <TagPicker
        label={t.wizardProcessorsLabel}
        description={t.wizardProcessorsHint}
        options={PROCESSOR_OPTIONS}
        value={state.processors}
        onValueChange={(processors) => {
          onChange({ processors });
        }}
      />

      <RetentionAndOwner
        t={t}
        state={state}
        people={people}
        isOwnerInvalid={errors.ownerId ?? false}
        onChange={onChange}
      />

      <div className="flex flex-col gap-1.5">
        <Text size="sm" weight="medium">
          {t.wizardCrossBorderLabel}
        </Text>
        <SegmentedControl
          label={t.wizardCrossBorderLabel}
          items={[
            { value: 'india', label: t.wizardCrossBorderIndia },
            { value: 's16', label: t.wizardCrossBorderTransfer },
          ]}
          value={state.crossBorder}
          onValueChange={(crossBorder) => {
            onChange({ crossBorder: crossBorder as AddActivityState['crossBorder'] });
          }}
          fullWidth
        />
      </div>

      <AdvancedSection t={t} state={state} onChange={onChange} />
    </div>
  );
}
