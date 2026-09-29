/**
 * Class merge helper. Every component accepts `className` and merges it LAST
 * so consumers can override — see docs/COMPONENT_CONTRACT.md §1.
 *
 * TODO(setup): swap for clsx + tailwind-merge once the dependency is added;
 * this naive version does not resolve conflicting Tailwind utilities.
 */
export type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) out.push(cn(...input));
    else out.push(String(input));
  }
  return out.join(' ').trim();
}
