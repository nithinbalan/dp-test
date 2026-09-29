'use client';

/**
 * @tier organisms
 *
 * Composes Card, Heading, Text and IconButton atoms. Escape closes it;
 * clicking the backdrop closes it; the panel itself stops that click from
 * reaching the backdrop.
 */
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { DialogProps } from './Dialog.types';

// Two separate maps, not one conditionally combined with the other — cn()
// concatenates rather than merges, so two max-w values applied together
// would resolve by stylesheet order, not by which one this render meant.
const CENTER_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

const END_SIZES = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-xl',
} as const;

function useCloseOnEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}

function backdropClassName(isEnd: boolean): string {
  return cn(
    'bg-fg-default/50 fixed inset-0 z-50 flex',
    isEnd ? 'items-stretch justify-end' : 'items-center justify-center p-4',
  );
}

function panelClassName(
  isEnd: boolean,
  size: NonNullable<DialogProps['size']>,
  className: DialogProps['className'],
): string {
  const placementClasses = isEnd
    ? cn('h-full rounded-none border-y-0 border-e-0', END_SIZES[size])
    : cn('max-h-screen', CENTER_SIZES[size]);
  return cn('flex w-full flex-col gap-4 overflow-y-auto', placementClasses, className);
}

export function Dialog({
  isOpen,
  onClose,
  label,
  description,
  children,
  footerSlot,
  size = 'md',
  placement = 'center',
  closeLabel = 'Close',
  className,
  testId,
}: DialogProps) {
  useCloseOnEscape(isOpen, onClose);

  if (!isOpen) return null;

  const isEnd = placement === 'end';

  return (
    <div data-testid="dialog-backdrop" className={backdropClassName(isEnd)} onClick={onClose}>
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId ?? 'dialog'}-label`}
        aria-describedby={
          description !== undefined ? `${testId ?? 'dialog'}-description` : undefined
        }
        variant="outline"
        elevation="lg"
        onClick={(event) => {
          event.stopPropagation();
        }}
        className={panelClassName(isEnd, size, className)}
        testId={testId}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Heading level={2} size="lg" id={`${testId ?? 'dialog'}-label`}>
              {label}
            </Heading>
            {description !== undefined && (
              <Text size="sm" tone="muted" id={`${testId ?? 'dialog'}-description`}>
                {description}
              </Text>
            )}
          </div>
          <IconButton label={closeLabel} variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>

        {children}

        {footerSlot !== undefined && (
          <div className="flex justify-end gap-2 pt-2">{footerSlot}</div>
        )}
      </Card>
    </div>
  );
}
