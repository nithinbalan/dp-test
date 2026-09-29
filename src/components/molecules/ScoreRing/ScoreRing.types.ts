/**
 * Circular readiness/compliance score — the hero visual on Dashboard,
 * Readiness and Controls. Composes Text for the centred number and description;
 * the ring itself is a plain SVG circle pair (track + progress arc).
 *
 * @tier molecules
 * @tag data-display
 * @tag dashboard
 */
export type ScoreRingProps = {
  /** Current position, 0…max. Clamped, so bad data cannot overflow the ring. */
  value: number;
  /** Upper bound of the range. @default 100 */
  max?: number | undefined;
  /** What the ring measures, for screen readers. */
  label: string;
  /** Human-readable form of the value, read instead of the raw percentage. */
  valueLabel?: string | undefined;
  /** Small line under the number — a band name like "Developing". */
  description?: string | undefined;
  /** Diameter. @default 'lg' */
  size?: 'md' | 'lg' | 'xl' | undefined;
  /** Semantic intent of the filled arc. @default 'brand' */
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | undefined;
  /**
   * Sitting on a dark surface (e.g. a hero card on `bg-inverse`) rather than
   * the default light one — swaps `description`'s tone so it stays legible
   * instead of rendering `muted`'s light-surface grey on a dark background.
   * @default false
   */
  isOnInverse?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
