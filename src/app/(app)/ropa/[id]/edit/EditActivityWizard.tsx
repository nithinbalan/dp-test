'use client';

/** Fetches the activity being edited, then hands the prefilled state to the shared wizard. */
import { notFound } from 'next/navigation';
import { useActivity } from '@shared/hooks';
import { AddActivityWizard } from '../../add/AddActivityWizard';
import type { AddActivityMessages } from '../../add/AddActivityWizard.types';
import { buildEditState } from './buildEditState';
import { EditActivityWizardSkeleton } from './EditActivityWizardSkeleton';

export function EditActivityWizard({ id, t }: { id: string; t: AddActivityMessages }) {
  const { data, isLoading, isError } = useActivity(id);

  if (isLoading) return <EditActivityWizardSkeleton t={t} />;
  if (isError || !data) notFound();

  return (
    <AddActivityWizard
      t={t}
      initialState={buildEditState(data)}
      editing={{ id: data.id, refCode: data.refCode, ownerName: data.ownerName }}
    />
  );
}
