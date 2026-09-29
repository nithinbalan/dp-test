import type { ReactNode } from 'react';

/** One step on the trail. */
export type BreadcrumbItem = {
  /** What the user reads. Comes from the caller, already translated. */
  label: string;
  /** Where it goes. Omit for the current page — the last crumb is not a link. */
  href?: string | undefined;
};

/**
 * Trail from the workspace root to the current page.
 *
 * The last crumb is rendered as text with `aria-current="page"`, never as a link:
 * a link to the page you are already on is a dead control, and it is the single
 * most common breadcrumb defect.
 *
 * @tier molecules
 * @tag navigation
 */
export type BreadcrumbsProps = {
  /** The trail, root first. */
  items: readonly BreadcrumbItem[];
  /**
   * Accessible name for the navigation landmark. English default; pass a
   * translation. Named because a page has several landmarks and "navigation" on
   * its own does not distinguish them.
   * @default 'Breadcrumb'
   */
  label?: string | undefined;
  /** Glyph between crumbs. Rendered decoratively. @default a chevron */
  separator?: ReactNode | undefined;
  /** Scale. @default 'sm' */
  size?: '2xs' | 'xs' | 'sm' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
