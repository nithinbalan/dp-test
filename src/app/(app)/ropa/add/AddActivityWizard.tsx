'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { Button } from '@atoms/Button';
import { PageHeader } from '@molecules/PageHeader';
import type { PersonOption } from '@molecules/PeoplePicker';
import { Stepper } from '@molecules/Stepper';
import { WizardShell } from '@templates/WizardShell';
import {
  useCreateActivity,
  useEmployees,
  useToast,
  useUpdateActivity,
  type EmployeeRow,
} from '@shared/hooks';
import { BasicsStep } from './BasicsStep';
import { DataStep } from './DataStep';
import { RulesStep } from './RulesStep';
import type {
  AddActivityFieldErrors,
  AddActivityMessages,
  AddActivityState,
  EditingActivity,
} from './AddActivityWizard.types';

const STEP_COUNT = 3;
const DEFAULT_STATE: AddActivityState = {
  name: '',
  purpose: '',
  principals: '',
  identifiers: [],
  collectionSource: 'direct',
  storageLocations: [],
  retention: 'until-purpose',
  lawfulBasis: '',
  processors: [],
  ownerId: undefined,
  crossBorder: 'india',
  operations: ['Collection', 'Storage', 'Use'],
  securityMeasures: ['Encryption at rest', 'Access control', 'Audit logging'],
};

/**
 * Matches the prototype's `rpaNextStep()`/`rpaSave()`: required fields are
 * checked on advance/submit, never proactively — a field only turns red
 * after the user has tried to move past it.
 */
function validateStep(step: number, state: AddActivityState): AddActivityFieldErrors {
  if (step === 0) {
    return {
      name: state.name.trim() === '',
      purpose: state.purpose.trim() === '',
      principals: state.principals === '',
    };
  }
  if (step === 1) {
    return { identifiers: state.identifiers.length === 0 };
  }
  return {};
}

function validateFinal(state: AddActivityState): AddActivityFieldErrors {
  return {
    lawfulBasis: state.lawfulBasis === '',
    ownerId: state.ownerId === undefined,
  };
}

function hasError(errors: AddActivityFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function wizardSteps(t: AddActivityMessages) {
  return [t.wizardStepBasics, t.wizardStepData, t.wizardStepRules].map((label, index) => ({
    value: String(index),
    label,
  }));
}

/** The owner picker's roster — real employees, same source Configuration Studio's
 * DPO field uses, mapped into `PeoplePicker`'s option shape. */
function usePeopleOptions(): PersonOption[] {
  const { data } = useEmployees();
  return (data?.employees ?? []).map(employeeToPersonOption);
}

function employeeToPersonOption(employee: EmployeeRow): PersonOption {
  return {
    id: employee.id,
    name: employee.fullName,
    initials: employee.fullName
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    detail: employee.workEmail ?? employee.designation ?? undefined,
    group: employee.departmentName ?? undefined,
  };
}

function WizardFooter({
  t,
  step,
  isEditing,
  onBack,
  onNext,
  onSubmit,
}: {
  t: AddActivityMessages;
  step: number;
  isEditing: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      {step > 0 ? (
        <Button variant="outline" onClick={onBack}>
          {t.wizardBack}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <NextLink href="/ropa">{t.wizardCancel}</NextLink>
        </Button>
      )}
      <div className="ms-auto">
        {step < STEP_COUNT - 1 ? (
          <Button tone="brand" onClick={onNext}>
            {t.wizardNext}
          </Button>
        ) : (
          <Button
            tone="brand"
            onClick={onSubmit}
            startSlot={isEditing ? <Save className="size-4" /> : <Plus className="size-4" />}
          >
            {isEditing ? t.footerSaveChanges : t.wizardSubmit}
          </Button>
        )}
      </div>
    </>
  );
}

function WizardHeader({
  t,
  isEditing,
  editing,
}: {
  t: AddActivityMessages;
  isEditing: boolean;
  editing: EditingActivity | undefined;
}) {
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <NextLink href="/ropa" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {t.wizardBackCta}
        </NextLink>
      </Button>
      <PageHeader
        refTag={
          isEditing && editing
            ? t.wizardEditRefTag.replace('{ref}', editing.refCode)
            : t.wizardRefTag
        }
        label={
          isEditing && editing ? t.wizardEditTitle.replace('{ref}', editing.refCode) : t.wizardTitle
        }
        description={isEditing ? undefined : t.wizardDescription}
      />
    </>
  );
}

/**
 * Matches the prototype's `rpaSave()`: editing always reopens the record for
 * re-approval regardless of its prior status, since a statutory field just
 * changed underneath it — the service enforces this server-side too.
 */
function useSubmitActivity({
  t,
  state,
  editing,
  people,
  createActivity,
  updateActivity,
  toast,
  router,
}: {
  t: AddActivityMessages;
  state: AddActivityState;
  editing: EditingActivity | undefined;
  people: readonly PersonOption[];
  createActivity: ReturnType<typeof useCreateActivity>;
  updateActivity: ReturnType<typeof useUpdateActivity>;
  toast: ReturnType<typeof useToast>;
  router: ReturnType<typeof useRouter>;
}) {
  return function submit() {
    const mutation = editing ? updateActivity : createActivity;
    mutation.mutate(state, {
      onSuccess: () => {
        if (editing) {
          const ownerName = people.find((p) => p.id === state.ownerId)?.name ?? editing.ownerName;
          toast.show({
            label: t.toastActivityUpdated
              .replace('{ref}', editing.refCode)
              .replace('{owner}', ownerName),
            tone: 'success',
          });
          router.push(`/ropa/${editing.id}`);
          return;
        }
        toast.show({ label: t.toastActivityAdded.replace('{name}', state.name), tone: 'success' });
        router.push('/ropa');
      },
      onError: () => {
        toast.show({ label: t.toastSaveError, tone: 'danger' });
      },
    });
  };
}

export function AddActivityWizard({
  t,
  initialState,
  editing,
}: {
  t: AddActivityMessages;
  initialState?: AddActivityState;
  editing?: EditingActivity;
}) {
  const router = useRouter();
  const toast = useToast();
  const people = usePeopleOptions();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity(editing?.id ?? '');
  const [step, setStep] = useState(0);
  const [state, setState] = useState<AddActivityState>(initialState ?? DEFAULT_STATE);
  const [errors, setErrors] = useState<AddActivityFieldErrors>({});
  const isEditing = editing !== undefined;
  const steps = wizardSteps(t);

  const submitActivity = useSubmitActivity({
    t,
    state,
    editing,
    people,
    createActivity,
    updateActivity,
    toast,
    router,
  });

  function handleChange(next: Partial<AddActivityState>) {
    setState((current) => ({ ...current, ...next }));
  }

  function handleNext() {
    const nextErrors = validateStep(step, state);
    setErrors(nextErrors);
    if (hasError(nextErrors)) {
      toast.show({ label: t.toastValidationStep, tone: 'warning' });
      return;
    }
    setStep((current) => current + 1);
  }

  function handleSubmit() {
    const finalErrors = validateFinal(state);
    setErrors(finalErrors);
    if (hasError(finalErrors)) {
      toast.show({ label: t.toastValidationFinal, tone: 'warning' });
      return;
    }
    submitActivity();
  }

  return (
    <div className="flex flex-col gap-4">
      <WizardHeader t={t} isEditing={isEditing} editing={editing} />
      <WizardShell
        stepperSlot={
          <Stepper steps={steps} activeIndex={step} messages={{ label: t.wizardStepperLabel }} />
        }
        footerSlot={
          <WizardFooter
            t={t}
            step={step}
            isEditing={isEditing}
            onBack={() => {
              setErrors({});
              setStep((current) => current - 1);
            }}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        }
      >
        {step === 0 && <BasicsStep t={t} state={state} errors={errors} onChange={handleChange} />}
        {step === 1 && <DataStep t={t} state={state} errors={errors} onChange={handleChange} />}
        {step === 2 && (
          <RulesStep t={t} state={state} people={people} errors={errors} onChange={handleChange} />
        )}
      </WizardShell>
    </div>
  );
}
