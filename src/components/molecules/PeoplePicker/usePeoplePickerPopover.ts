import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

/** Popover's rough height (search row + list + footer) for the flip check below. */
const ESTIMATED_POPOVER_HEIGHT = 380;
/** The popover's own width (`min-w-72`) — independent of the trigger's. */
const POPOVER_MIN_WIDTH = 288;

export type PeoplePickerPopoverPosition = {
  /** `fixed`-positioned coordinates, viewport-relative — safe even when the
   * trigger sits inside a scroll-clipped ancestor, unlike the old
   * `absolute`-anchored-to-a-`relative`-parent popup, which a wizard body
   * bounded to its own `overflow-y-auto` would silently clip. */
  style: { position: 'fixed'; top?: number; bottom?: number; left?: number; right?: number };
};

/** Anchored to the trigger's start edge by default and grows toward the end
 * — measure the room in that direction and flip to the end edge (grows
 * toward the start instead) when it would otherwise run past the viewport's
 * edge; same idea vertically for top/bottom. */
function computePosition(root: HTMLElement): PeoplePickerPopoverPosition {
  const rect = root.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const isTop = spaceBelow < ESTIMATED_POPOVER_HEIGHT && spaceAbove > spaceBelow;

  const isRtl = getComputedStyle(root).direction === 'rtl';
  const spaceForward = isRtl ? rect.right : window.innerWidth - rect.left;
  const isFlippedHorizontally = spaceForward < POPOVER_MIN_WIDTH;
  const gap = 4;
  const startsFromLeft = isRtl ? isFlippedHorizontally : !isFlippedHorizontally;

  return {
    style: {
      position: 'fixed',
      ...(isTop ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
      ...(startsFromLeft ? { left: rect.left } : { right: window.innerWidth - rect.right }),
    },
  };
}

/**
 * Open/query state for the `trigger` variant's popover: closes on an outside
 * pointerdown or Escape, and clears the search text on close either way.
 * Also tracks the trigger's live viewport position (not just once at open —
 * the popover is portaled to `document.body` and positioned `fixed`, so it
 * has to follow any scrollable ancestor's scroll) to decide which side it
 * opens on, vertically and horizontally, and to place it correctly.
 */
export function usePeoplePickerPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<PeoplePickerPopoverPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  function close() {
    setIsOpen(false);
    setQuery('');
  }

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    function update() {
      if (!root) return;
      setPosition(computePosition(root));
    }

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    // The popup is portaled to `document.body`, so it's no longer a DOM
    // descendant of `rootRef` — a click inside it must still count as
    // "inside", or every result click would close the popup before its own
    // onClick (which fires after pointerdown) ever ran.
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      close();
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }

  return {
    isOpen,
    query,
    rootRef,
    popoverRef,
    position,
    setQuery,
    open: () => {
      setIsOpen(true);
    },
    toggle: () => {
      setIsOpen((open) => !open);
    },
    close,
    onKeyDown,
  };
}
