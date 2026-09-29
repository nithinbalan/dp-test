'use client';

/**
 * @tier molecules
 *
 * Composes Label and Input atoms into a one-time-passcode entry row. Owns no
 * value of its own — every keystroke is reported upward as one composed string,
 * and focus movement between cells is derived from `value`/`length`, not from
 * separate per-cell state.
 */
import { useId, useRef } from 'react';
import { Input } from '@atoms/Input';
import { Label } from '@atoms/Label';
import { cn } from '@shared/lib';
import type { OtpInputMessages, OtpInputProps } from './OtpInput.types';

const DEFAULT_MESSAGES: OtpInputMessages = {
  label: 'Verification code',
  digitLabel: 'Digit {position} of {length}',
};

function digitLabelFor(template: string, position: number, length: number): string {
  return template.replace('{position}', String(position)).replace('{length}', String(length));
}

/** Which cell (if any) a key press should move focus to. Pure — easy to reason about in isolation. */
function nextFocusIndex(
  key: string,
  index: number,
  length: number,
  isEmpty: boolean,
): number | null {
  if (key === 'Backspace' && isEmpty && index > 0) return index - 1;
  if (key === 'ArrowLeft' && index > 0) return index - 1;
  if (key === 'ArrowRight' && index < length - 1) return index + 1;
  return null;
}

function OtpCell({
  index,
  digit,
  length,
  digitLabel,
  isInvalid,
  isDisabled,
  onRef,
  onChange,
  onKeyDown,
  onPaste,
}: {
  index: number;
  digit: string;
  length: number;
  digitLabel: string;
  isInvalid: boolean;
  isDisabled: boolean;
  onRef: (index: number, node: HTMLInputElement | null) => void;
  onChange: (index: number, raw: string) => void;
  onKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <Input
      ref={(node) => {
        onRef(index, node);
      }}
      type="text"
      inputMode="numeric"
      autoComplete={index === 0 ? 'one-time-code' : 'off'}
      maxLength={1}
      value={digit}
      onChange={(event) => {
        onChange(index, event.target.value);
      }}
      onKeyDown={(event) => {
        onKeyDown(index, event);
      }}
      onPaste={onPaste}
      aria-label={digitLabelFor(digitLabel, index + 1, length)}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      className="w-10 text-center"
    />
  );
}

export function OtpInput({
  length = 6,
  value,
  onValueChange,
  errorMessage,
  isDisabled = false,
  messages,
  className,
  testId,
}: OtpInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const t = { ...DEFAULT_MESSAGES, ...messages };
  const isInvalid = errorMessage !== undefined && errorMessage !== '';
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  function setCellRef(index: number, node: HTMLInputElement | null) {
    cellRefs.current[index] = node;
  }

  function commit(nextDigits: string[]) {
    onValueChange(nextDigits.join('').slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    commit(next);
    if (char !== '' && index < length - 1) cellRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    const target = nextFocusIndex(event.key, index, length, digits[index] === '');
    if (target !== null) cellRefs.current[target]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted === '') return;
    event.preventDefault();
    commit(pasted.split(''));
    cellRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label size="sm">{t.label}</Label>
      <div
        role="group"
        aria-label={t.label}
        aria-describedby={isInvalid ? errorId : undefined}
        data-testid={testId}
        className="flex gap-2"
      >
        {digits.map((digit, index) => (
          <OtpCell
            key={index}
            index={index}
            digit={digit}
            length={length}
            digitLabel={t.digitLabel}
            isInvalid={isInvalid}
            isDisabled={isDisabled}
            onRef={setCellRef}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />
        ))}
      </div>
      {isInvalid && (
        <p id={errorId} role="alert" className="text-danger-fg text-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
