/**
 * Backs the `asChild` prop reserved in design-system/contract.json §1 — until
 * now unimplemented anywhere. Merges one element's props onto its single
 * child instead of wrapping it, so e.g. `<Button asChild><Link href="/x">`
 * renders one real `<a>` styled as a button, not a button nested in a link.
 *
 * Minimal, hand-rolled rather than `@radix-ui/react-slot`: this repo has no
 * Radix dependency yet, and the merge behaviour needed — combine className,
 * compose the two onClicks (both fire), otherwise let the child's own props
 * win — covers every current use.
 */
import { cloneElement, isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

type SlotProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  [key: string]: unknown;
};

function composeHandlers<E>(
  slotHandler: ((event: E) => void) | undefined,
  childHandler: ((event: E) => void) | undefined,
): ((event: E) => void) | undefined {
  if (!slotHandler || !childHandler) return childHandler ?? slotHandler;
  return (event: E) => {
    slotHandler(event);
    childHandler(event);
  };
}

export function Slot({ children, className, onClick, ...rest }: SlotProps) {
  if (!isValidElement<Record<string, unknown>>(children)) return null;

  return cloneElement(children, {
    ...rest,
    ...children.props,
    className: cn(className, children.props.className as string | undefined),
    onClick: composeHandlers(
      onClick as ((event: unknown) => void) | undefined,
      children.props.onClick as ((event: unknown) => void) | undefined,
    ),
  });
}
