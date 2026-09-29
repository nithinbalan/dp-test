/**
 * @tier templates
 *
 * Two-pane structure only — see AuthShell.types.ts. No margins of its own; it is
 * meant to fill the viewport, which is the page's call, not this component's.
 */
import { cn } from '@shared/lib';
import type { AuthShellProps } from './AuthShell.types';

export function AuthShell({ leftSlot, rightSlot, className, testId }: AuthShellProps) {
  return (
    <div className={cn('grid min-h-screen lg:grid-cols-2', className)} data-testid={testId}>
      <div className="bg-bg-inverse text-fg-inverse relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <span className="bg-accent-solid/5 absolute -end-40 -top-40 size-128 rounded-full" />
          <span className="bg-bg-inverse absolute -end-24 -top-24 size-80 rounded-full" />
          <span className="bg-brand-solid/25 absolute -start-32 -bottom-48 size-112 rounded-full" />
          <span className="bg-bg-inverse absolute -start-16 -bottom-32 size-88 rounded-full" />
        </div>
        <div className="relative flex flex-1 flex-col justify-between">{leftSlot}</div>
      </div>
      <div className="bg-bg-canvas flex items-center justify-center p-6">{rightSlot}</div>
    </div>
  );
}
