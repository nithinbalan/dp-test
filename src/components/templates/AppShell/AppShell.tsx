/**
 * @tier templates
 *
 * Sidebar + topbar + scrollable content, in a row. No margins of its own; it
 * fills the viewport, which is the page's call.
 *
 * `fixed inset-0` rather than `h-dvh`: this is meant to be the app's ONLY
 * scroll container (`<main>`, below). `h-dvh` alone still leaves the shell in
 * normal document flow, so a focus-driven scroll — a native `<select>`
 * opening, a popover's search input receiving focus — can scroll the
 * *document* instead of `<main>`, leaving a second, independent scrollbar at
 * its own position (the classic double-scrollbar bug). Pinning the shell to
 * the viewport with `fixed` makes that impossible: there is no document
 * scroll position left for the browser to move.
 */
import { cn } from '@shared/lib';
import type { AppShellProps } from './AppShell.types';

export function AppShell({ sidebarSlot, topbarSlot, children, className, testId }: AppShellProps) {
  return (
    <div className={cn('bg-bg-canvas fixed inset-0 flex', className)} data-testid={testId}>
      {sidebarSlot}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {topbarSlot}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
