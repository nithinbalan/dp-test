'use client';

/**
 * "Import CSV" dialog — bulk-creates employees over `POST /api/employees/import`
 * via `useImportEmployeesCsv()`. Mirrors `AddEmployeeDialog.tsx`'s shape (a
 * `use*Form` hook owning draft/submit state, the Dialog only lays it out), but
 * the "form" is a single file plus the result summary the server hands back —
 * which rows landed and which were skipped, and why.
 *
 * The file step is a real drag-and-drop dropzone, not just a hidden
 * `<input type="file">` behind a button: type/size are checked client-side
 * before anything is sent, so a wrong file is rejected instantly instead of
 * round-tripping to the server for the same 400 the route would return anyway.
 */
import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { IconButton } from '@atoms/IconButton';
import { Spinner } from '@atoms/Spinner';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import { Field } from '@molecules/Field';
import { Dialog } from '@organisms/Dialog';
import { cn } from '@shared/lib';
import type { ImportEmployeesSummary, ImportRowSkip } from '@shared/hooks';
import { useImportEmployeesCsv } from '@shared/hooks';
import type { EmployeesMessages } from './EmployeesMessages';

const TEMPLATE_FILENAME = 'employees-import-template.csv';
const TEMPLATE_HEADER = 'fullName,workEmail,department,designation';
const TEMPLATE_EXAMPLE_ROW =
  'Muhammed Shihabuddeen F,name@company.com,Engineering,Software Engineer';
/** Mirrors the route's own cap (`MAX_CSV_SIZE_BYTES` in `import/route.ts`) — checked
 * here too so an oversized file is rejected instantly, not after a round trip. */
const MAX_FILE_SIZE_BYTES = 1024 * 1024;

/** No backend round trip needed for a static template — build and download it in the browser. */
function downloadTemplate() {
  const blob = new Blob([`${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE_ROW}\n`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = TEMPLATE_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function reasonLabel(t: EmployeesMessages, reason: ImportRowSkip['reason']): string {
  return reason === 'DUPLICATE_EMAIL' ? t.importReasonDuplicate : t.importReasonValidation;
}

/** Type/size checks a route would refuse anyway — caught here for instant feedback. */
function validateFile(t: EmployeesMessages, file: File): string | undefined {
  const looksLikeCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
  if (!looksLikeCsv) return t.importInvalidFileTypeError;
  if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) return t.importFileTooLargeError;
  return undefined;
}

function ImportSummaryView({
  t,
  summary,
}: {
  t: EmployeesMessages;
  summary: ImportEmployeesSummary;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert
        tone={summary.insertedCount > 0 ? 'success' : 'warning'}
        size="sm"
        startSlot={<CheckCircle2 className="size-4" />}
        label={t.importSummaryInserted.replace('{count}', String(summary.insertedCount))}
      />

      {summary.skipped.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Text size="sm" weight="medium">
              {t.importSummarySkippedTitle}
            </Text>
            <Badge variant="soft" size="xs" tone="warning">
              {summary.skipped.length}
            </Badge>
          </div>
          <ul className="border-border-default max-h-48 overflow-y-auto rounded-md border">
            {summary.skipped.map((skip, i) => (
              <li
                key={skip.row}
                className={cn(
                  'flex items-center gap-2 px-3 py-2',
                  i > 0 && 'border-border-default border-t',
                )}
              >
                <Badge variant="soft" size="xs" tone="neutral">
                  {skip.row}
                </Badge>
                <Text size="xs" tone="muted">
                  {reasonLabel(t, skip.reason)}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SelectedFileCard({
  fileName,
  fileSize,
  onRemove,
  removeLabel,
}: {
  fileName: string;
  fileSize: number;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="border-border-default bg-bg-subtle flex items-center gap-3 rounded-md border p-3">
      <FileText aria-hidden className="text-fg-subtle size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <Text size="sm" weight="medium" isTruncated>
          {fileName}
        </Text>
        <Text size="xs" tone="muted">
          {formatFileSize(fileSize)}
        </Text>
      </div>
      <IconButton label={removeLabel} variant="ghost" size="sm" onClick={onRemove}>
        <X className="size-4" />
      </IconButton>
    </div>
  );
}

function Dropzone({
  t,
  errorMessage,
  onFileSelected,
}: {
  t: EmployeesMessages;
  errorMessage: string | undefined;
  onFileSelected: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <Field
      label={t.importFileFieldLabel}
      description={t.importFileFieldHint}
      errorMessage={errorMessage}
    >
      {(control) => (
        <div
          role="button"
          tabIndex={0}
          id={control.id}
          aria-describedby={control['aria-describedby']}
          aria-invalid={control.isInvalid}
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => {
            setIsDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            const file = event.dataTransfer.files[0];
            if (file) onFileSelected(file);
          }}
          className={cn(
            'duration-fast ease-standard rounded-md border-2 border-dashed p-6 text-center transition-colors',
            'focus-visible:ring-border-focus cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            isDragActive
              ? 'border-brand-solid bg-brand-subtle'
              : 'border-border-default hover:bg-bg-subtle',
          )}
        >
          <Upload aria-hidden className="text-fg-subtle mx-auto size-6" />
          <Text size="sm" tone="muted" className="mt-2">
            {isDragActive ? t.importDropActiveHint : t.importDropHint}
          </Text>
          <input
            ref={inputRef}
            type="file"
            tabIndex={-1}
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFileSelected(file);
              event.target.value = '';
            }}
          />
        </div>
      )}
    </Field>
  );
}

function FilePickerView({
  t,
  file,
  errorMessage,
  isUploading,
  onFileSelected,
  onRemoveFile,
}: {
  t: EmployeesMessages;
  file: File | undefined;
  errorMessage: string | undefined;
  isUploading: boolean;
  onFileSelected: (file: File) => void;
  onRemoveFile: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {file ? (
        isUploading ? (
          <div className="flex items-center gap-3 p-3">
            <Spinner size="sm" tone="brand" />
            <Text size="sm" tone="muted">
              {t.importUploadingLabel}
            </Text>
          </div>
        ) : (
          <SelectedFileCard
            fileName={file.name}
            fileSize={file.size}
            onRemove={onRemoveFile}
            removeLabel={t.importRemoveFileLabel}
          />
        )
      ) : (
        <Dropzone t={t} errorMessage={errorMessage} onFileSelected={onFileSelected} />
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={downloadTemplate}
      >
        {t.importDownloadTemplateCta}
      </Button>
    </div>
  );
}

function useImportEmployeesForm() {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<ImportEmployeesSummary | undefined>(undefined);
  const importCsv = useImportEmployeesCsv();

  function reset() {
    setFile(undefined);
    setErrorMessage(undefined);
    setSummary(undefined);
  }

  function selectFile(t: EmployeesMessages, candidate: File) {
    const validationError = validateFile(t, candidate);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage(undefined);
    setFile(candidate);
  }

  function submit(t: EmployeesMessages) {
    if (!file) {
      setErrorMessage(t.importNoFileError);
      return;
    }
    setErrorMessage(undefined);

    importCsv.mutate(file, {
      onSuccess: (result) => {
        setSummary(result);
      },
      onError: () => {
        setErrorMessage(t.importErrorGeneric);
      },
    });
  }

  return {
    file,
    selectFile,
    removeFile: () => {
      setFile(undefined);
    },
    errorMessage,
    summary,
    submit,
    reset,
    isPending: importCsv.isPending,
  };
}

export function ImportEmployeesDialog({
  t,
  isOpen,
  onClose,
}: {
  t: EmployeesMessages;
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useImportEmployeesForm();

  function handleClose() {
    form.reset();
    onClose();
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      label={t.importDialogTitle}
      description={t.importDialogDescription}
      placement="end"
      size="lg"
      testId="import-employees-dialog"
      footerSlot={
        form.summary ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                form.reset();
              }}
            >
              {t.importAnotherCta}
            </Button>
            <Button tone="brand" onClick={handleClose}>
              {t.importDoneCta}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose} isDisabled={form.isPending}>
              {t.cancelCta}
            </Button>
            <Button
              tone="brand"
              isDisabled={form.isPending || !form.file}
              onClick={() => {
                form.submit(t);
              }}
            >
              {t.importSubmitCta}
            </Button>
          </>
        )
      }
    >
      {form.summary ? (
        <ImportSummaryView t={t} summary={form.summary} />
      ) : (
        <FilePickerView
          t={t}
          file={form.file}
          errorMessage={form.errorMessage}
          isUploading={form.isPending}
          onFileSelected={(file) => {
            form.selectFile(t, file);
          }}
          onRemoveFile={form.removeFile}
        />
      )}
    </Dialog>
  );
}
