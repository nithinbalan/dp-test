'use client';

/**
 * Logo preview + upload control for the Workspace panel's first row. Shows an
 * instant local preview via `FileReader` while `onFileSelected` uploads the real
 * file in the background — see WorkspaceSettingsPanel.tsx for the mutation.
 */
import { useId, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Button } from '@atoms/Button';

export function WorkspaceLogoField({
  workspaceName,
  logoUrl,
  uploadLabel,
  replaceLabel,
  isUploading,
  onLogoPreview,
  onFileSelected,
}: {
  workspaceName: string;
  logoUrl: string | undefined;
  uploadLabel: string;
  replaceLabel: string;
  isUploading: boolean;
  onLogoPreview: (logoUrl: string) => void;
  onFileSelected: (file: File) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file === undefined) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    onFileSelected(file);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar
        label={workspaceName}
        initials="J"
        size="lg"
        shape="rounded"
        tone="brand"
        imageSlot={
          logoUrl !== undefined ? (
            // eslint-disable-next-line @next/next/no-img-element -- a locally-read data URL, not a remote asset next/image would optimise
            <img src={logoUrl} alt="" className="size-full object-cover" />
          ) : undefined
        }
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        isDisabled={isUploading}
        startSlot={<Upload className="size-4" />}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {logoUrl !== undefined ? replaceLabel : uploadLabel}
      </Button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
