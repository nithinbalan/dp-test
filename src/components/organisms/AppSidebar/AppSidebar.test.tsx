import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppSidebar } from './AppSidebar';
import type { SidebarNavGroup, SidebarNavItem } from './AppSidebar.types';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const AI_ITEM: SidebarNavItem = { href: '/ai', label: 'Jethur AI', icon: <span>✦</span> };
const GROUPS: SidebarNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <span>D</span> },
      { href: '/readiness', label: 'Gap Assessment', icon: <span>G</span>, badge: '3' },
    ],
  },
];

describe('AppSidebar', () => {
  it('renders every group and its items', () => {
    render(<AppSidebar groups={GROUPS} aiItem={AI_ITEM} />);
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /Gap Assessment/ })).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('marks the link matching the current route as active', () => {
    render(<AppSidebar groups={GROUPS} aiItem={AI_ITEM} />);
    expect(screen.getByRole('link', { name: /Dashboard/ }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      screen.getByRole('link', { name: /Gap Assessment/ }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('calls onCloseMobile from the backdrop and the close button', () => {
    const onCloseMobile = vi.fn();
    render(
      <AppSidebar groups={GROUPS} aiItem={AI_ITEM} isMobileOpen onCloseMobile={onCloseMobile} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });
});
