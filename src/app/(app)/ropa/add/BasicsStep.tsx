'use client';

/** Step 1 of the Add/Edit Activity wizard. Prototype source: `.rpa-step[data-rpstep="1"]`. */
import { Alert } from '@molecules/Alert';
import { Field } from '@molecules/Field';
import { Input } from '@atoms/Input';
import { Listbox, type ListboxOption } from '@molecules/Listbox';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import type {
  AddActivityFieldErrors,
  AddActivityMessages,
  AddActivityState,
} from './AddActivityWizard.types';

function NameAndPurposeFields({
  t,
  state,
  errors,
  onChange,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  errors: AddActivityFieldErrors;
  onChange: (next: Partial<AddActivityState>) => void;
}) {
  return (
    <>
      <Field
        label={t.wizardNameLabel}
        description={t.wizardNameHint}
        errorMessage={errors.name ? t.wizardNameError : undefined}
        isRequired
      >
        {(control) => (
          <Input
            {...control}
            placeholder={t.wizardNamePlaceholder}
            value={state.name}
            onChange={(event) => {
              onChange({ name: event.target.value });
            }}
            fullWidth
          />
        )}
      </Field>

      <Field
        label={t.wizardPurposeLabel}
        description={t.wizardPurposeHint}
        errorMessage={errors.purpose ? t.wizardPurposeError : undefined}
        isRequired
      >
        {(control) => (
          <Input
            {...control}
            placeholder={t.wizardPurposePlaceholder}
            value={state.purpose}
            onChange={(event) => {
              onChange({ purpose: event.target.value });
            }}
            fullWidth
          />
        )}
      </Field>
    </>
  );
}

export function BasicsStep({
  t,
  state,
  errors,
  onChange,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  errors: AddActivityFieldErrors;
  onChange: (next: Partial<AddActivityState>) => void;
}) {
  const principalOptions: ListboxOption[] = [
    { value: 'customers', label: t.wizardPrincipalCustomers },
    { value: 'consumers', label: t.wizardPrincipalConsumers },
    { value: 'employees', label: t.wizardPrincipalEmployees },
    { value: 'candidates', label: t.wizardPrincipalCandidates },
    { value: 'vendors', label: t.wizardPrincipalVendors },
    { value: 'minors', label: t.wizardPrincipalMinors },
    { value: 'all', label: t.wizardPrincipalAll },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <Heading level={2} size="lg">
          {t.step1Heading}
        </Heading>
        <Text size="sm" tone="muted">
          {t.step1Sub}
        </Text>
      </div>

      <NameAndPurposeFields t={t} state={state} errors={errors} onChange={onChange} />

      <Listbox
        label={t.wizardPrincipalsLabel}
        description={t.wizardPrincipalsHint}
        errorMessage={errors.principals ? t.wizardPrincipalsError : undefined}
        isRequired
        options={principalOptions}
        placeholder={t.wizardPrincipalsPlaceholder}
        value={state.principals}
        onValueChange={(principals) => {
          onChange({ principals });
        }}
        fullWidth
      />

      {state.principals === 'minors' && (
        <Alert tone="warning" variant="soft" label={t.wizardMinorsWarning} />
      )}
    </div>
  );
}
