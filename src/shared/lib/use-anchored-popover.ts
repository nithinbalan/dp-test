'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

export type AnchoredPopoverPosition = {
  /**
   * `fixed`-positioned coordinates, viewport-relative — safe even when the
   * trigger sits inside a scroll-clipped ancestor (a wizard body bounded to
   * its own `overflow-y-auto`, a table's scroll region, …), unlike an
   * `absolute`-positioned popup anchored to a `relative` parent, which gets
   * silently clipped the moment that ancestor's overflow isn't `visible`.
   */
  style: {
    position: 'fixed';
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width: number;
  };
  /** Which side of the trigger the popup opened on. */
  placement: 'top' | 'bottom';
};

/**
 * Tracks a trigger element's live viewport position while a popover anchored
 * to it is open, recomputing on scroll (capture phase — a scrollable ancestor
 * between the trigger and the viewport fires its own scroll event, which
 * never reaches a non-capturing window listener) and on resize. Portal the
 * popover to `document.body` and spread the returned `style` onto it.
 *
 * Returns `null` while closed, so callers can skip rendering the popup
 * entirely (and skip measuring a trigger that hasn't mounted yet).
 */
export function useAnchoredPopover(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  estimatedPopoverHeight: number,
): AnchoredPopoverPosition | null {
  const [position, setPosition] = useState<AnchoredPopoverPosition | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const el = triggerRef.current;
    if (!el) return undefined;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement: 'top' | 'bottom' =
        spaceBelow < estimatedPopoverHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
      const gap = 4;
      const isRtl = getComputedStyle(el).direction === 'rtl';

      setPosition({
        placement,
        style: {
          position: 'fixed',
          width: rect.width,
          ...(placement === 'bottom'
            ? { top: rect.bottom + gap }
            : { bottom: window.innerHeight - rect.top + gap }),
          ...(isRtl ? { right: window.innerWidth - rect.right } : { left: rect.left }),
        },
      });
    }

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, triggerRef, estimatedPopoverHeight]);

  return position;
}
