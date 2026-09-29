'use client';

/**
 * Lightweight, app-wide feedback for actions that have nowhere else to report
 * a result — "scan now", "reminder sent", the many placeholder actions across
 * modules that don't have a real backend yet. Fixed to the bottom-end corner
 * of the viewport and auto-dismissed — mirrors the source design's dark,
 * pill-shaped `toast()` helper, but as a typed hook instead of a global
 * function. Deliberately not built on `Alert`: that component is documented
 * as staying with the page it describes, while a toast is transient and
 * lives at the app root.
 *
 * `ToastProvider` is mounted once, high in the tree (the `(app)` layout).
 * Everything below it calls `useToast().show(...)`.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'neutral';

export type ToastOptions = {
  label: string;
  description?: string | undefined;
  tone?: ToastTone | undefined;
};

type ToastItem = ToastOptions & { id: string };

type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 4000;

/**
 * Lime is the accent — "one deliberate mark per screen" — so it is reserved
 * for the everything's-fine case that covers most toasts here. `warning` and
 * `danger` keep their own colour so a failure still reads as a failure.
 */
const TOAST_ICONS: Record<ToastTone, { Icon: typeof CheckCircle2; className: string }> = {
  success: { Icon: CheckCircle2, className: 'text-accent-solid' },
  brand: { Icon: CheckCircle2, className: 'text-accent-solid' },
  info: { Icon: CheckCircle2, className: 'text-accent-solid' },
  neutral: { Icon: CheckCircle2, className: 'text-accent-solid' },
  warning: { Icon: AlertTriangle, className: 'text-warning-solid' },
  danger: { Icon: XCircle, className: 'text-danger-solid' },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div aria-live="polite" className="fixed end-6 bottom-6 z-50 flex flex-col items-end gap-2">
      {toasts.map((toast) => {
        const { Icon, className } = TOAST_ICONS[toast.tone ?? 'neutral'];
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => {
              onDismiss(toast.id);
            }}
            className="bg-bg-inverse rounded-surface flex items-center gap-2.5 px-4 py-3.5 shadow-xl"
          >
            <Icon aria-hidden className={cn('size-5 shrink-0', className)} />
            <div className="flex flex-col items-start gap-0.5 text-start whitespace-nowrap">
              <Text as="span" size="sm" className="text-fg-inverse">
                {toast.label}
              </Text>
              {toast.description !== undefined && (
                <Text as="span" size="xs" className="text-fg-inverse-subtle">
                  {toast.description}
                </Text>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((current) => [...current, { ...options, id }]);
      setTimeout(() => {
        dismiss(id);
      }, TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** Falls back to a silent no-op outside a provider, rather than crashing the tree. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return (
    ctx ?? {
      show: () => {
        console.warn('useToast() called with no ToastProvider mounted — nothing shown.');
      },
    }
  );
}
