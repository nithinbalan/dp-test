import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Identity mark for a person or a workspace. Shows an image when one is supplied
 * and falls back to initials, which is the case that actually renders most of the
 * time in a B2B product where few users upload a photo.
 *
 * The image arrives as `imageSlot` rather than a `src` string on purpose: the
 * caller owns the loading strategy (`next/image`, a plain tag, a blurhash), and
 * an atom that picked one for them would force it on every consumer.
 *
 * @tier atoms
 * @tag identity
 * @tag data-display
 */
export type AvatarProps = Omit<ComponentPropsWithoutRef<'span'>, 'className'> & {
  /**
   * Accessible name — the person or workspace this represents. Required, because
   * initials alone ("AF") tell a screen-reader user nothing.
   */
  label: string;
  /** The glyphs to draw when there is no image. Supplied by the caller, since initials are language-specific. */
  initials?: string | undefined;
  /** A rendered image element. Takes precedence over `initials`. */
  imageSlot?: ReactNode | undefined;
  /** Scale. @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  /** Silhouette. `rounded` for workspaces, `circle` for people. @default 'rounded' */
  shape?: 'rounded' | 'circle' | 'square' | undefined;
  /** Semantic intent of the fallback fill. @default 'brand' */
  tone?: 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
