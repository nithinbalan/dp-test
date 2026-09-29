import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useAnchoredPopover } from '@shared/lib';

/** Popover's rough height (option list) for the flip check below. */
const ESTIMATED_POPOVER_HEIGHT = 240;

/**
 * Open state for the popup: closes on an outside pointerdown or Escape.
 * Position is tracked live (not just computed once at open) via
 * `useAnchoredPopover`, since the popup is portaled to `document.body` and
 * positioned `fixed` — it has to follow the trigger's viewport position as
 * any scrollable ancestor scrolls, not just avoid running off-screen at the
 * moment it opens.
 */
export function useListboxPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPopover(triggerRef, isOpen, ESTIMATED_POPOVER_HEIGHT);

  function close() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    // The popup is portaled to `document.body`, so it's no longer a DOM
    // descendant of `triggerRef` — a click inside it must still count as
    // "inside", or every option click would close the popup before its own
    // onClick (which fires after pointerdown) ever ran.
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
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
    triggerRef,
    popoverRef,
    position,
    toggle: () => {
      setIsOpen((open) => !open);
    },
    close,
    onKeyDown,
  };
}
