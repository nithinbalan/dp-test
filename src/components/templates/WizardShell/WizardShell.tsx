'use client';

/**
 * @tier templates
 *
 * Composes Card and Divider atoms as chrome around the three slots.
 * Matches prototype .wz-page:
 *  - .wz-stepper → tinted header, bottom separator, rounded-t
 *  - .wz-page-body → padded wizard body
 *  - .wz-pfoot → tinted footer, top separator, rounded-b
 *
 * `isFooterSticky` keeps the footer visible at the viewport bottom while a
 * tall step scrolls, in this app's one continuously-scrolling page pane (see
 * AppShell's `<main>`) rather than a box bounded to its own height.
 *
 * Two techniques were tried and rejected before this one:
 * - A hardcoded reserved-space guess (`pb-20`/`-mt-20`) matching one
 *   caller's footer height, which overlapped real content the moment a
 *   DIFFERENT caller's taller footer shipped.
 * - Capping the card's own height and scrolling only its body internally,
 *   which never overlaps anything but trades that for a second, nested
 *   scrollbar — a worse UX than the bug it fixed.
 *
 * This version keeps the single shared scroll pane AND never overlaps real
 * content: a plain, invisible spacer `<div>` — MEASURED to the footer's
 * actual rendered height via `ResizeObserver`, not guessed — sits between
 * the body and the footer. The footer itself gets no offset math at all
 * (no negative margin, no manual pull-up); its only job is `sticky
 * bottom-0`, which by itself already keeps it glued to the viewport bottom.
 * Because the spacer is a real block taking up real space in the flow, the
 * footer's "stuck" range is naturally bounded to exactly that spacer's box —
 * it settles into the same visual spot with or without scrolling, so it can
 * never sit on top of the step content above it.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { Card } from '@atoms/Card';
import { cn } from '@shared/lib';
import type { WizardShellProps } from './WizardShell.types';

export function WizardShell({
  stepperSlot,
  children,
  footerSlot,
  isFooterSticky = false,
  className,
  testId,
}: WizardShellProps) {
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useLayoutEffect(() => {
    if (!isFooterSticky) return undefined;
    const el = footerRef.current;
    if (!el) return undefined;
    // Measured synchronously here too (not just via the observer below) so
    // the very first paint already reserves the right amount of space,
    // instead of a 0px guess that snaps to the real height a frame later.
    setFooterHeight(el.getBoundingClientRect().height);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setFooterHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [isFooterSticky]);

  return (
    <Card
      variant="outline"
      elevation="sm"
      size="none"
      className={cn('flex flex-col overflow-visible', className)}
      testId={testId}
    >
      {/* .wz-stepper – tinted header row with bottom separator */}
      <div className="bg-bg-hover rounded-t-surface border-border-default flex items-center border-b px-7 py-4">
        {stepperSlot}
      </div>

      {/* .wz-page-body — never touched by sticky mode; the reserved space
          lives in the spacer below, not here */}
      <div className="px-7 pt-6 pb-5">{children}</div>

      {/* The reserved blank strip the sticky footer's "stuck" range is
          bounded to — real space in the flow, sized to the footer's own
          measured height, never a guess. */}
      {isFooterSticky && <div aria-hidden style={{ height: footerHeight }} />}

      {/* .wz-pfoot – plain `sticky bottom-0`, no offset math: with the
          spacer above doing the reserving, this alone is enough to keep it
          pinned without ever overlapping real content. */}
      <div ref={footerRef} className={isFooterSticky ? 'sticky bottom-0 z-10' : undefined}>
        <div className="bg-bg-hover rounded-b-surface border-border-default flex items-center gap-2.5 border-t px-7 py-3.5">
          <div className="flex flex-1 items-center justify-between gap-3">{footerSlot}</div>
        </div>
      </div>
    </Card>
  );
}
