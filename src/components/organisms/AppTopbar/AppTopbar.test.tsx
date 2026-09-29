import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppTopbar } from './AppTopbar';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function setup(props: Partial<ComponentProps<typeof AppTopbar>> = {}) {
  return render(
    <AppTopbar
      orgName="Your Company Pvt Ltd"
      workspaceAddress="yourco.jethurdpdp.com"
      enforcementDaysRemaining={304}
      userName="Data Protection Lead"
      userInitials="DP"
      userRole="Admin"
      locale="en"
      onLocaleChange={vi.fn()}
      onOpenMobileNav={vi.fn()}
      {...props}
    />,
  );
}

describe('AppTopbar', () => {
  it('renders the org name and enforcement countdown', () => {
    setup();
    expect(screen.getByText('Your Company Pvt Ltd')).toBeDefined();
    expect(screen.getByText('304 days to enforcement')).toBeDefined();
  });

  it('calls onOpenMobileNav', () => {
    const onOpenMobileNav = vi.fn();
    setup({ onOpenMobileNav });
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(onOpenMobileNav).toHaveBeenCalledTimes(1);
  });

  it('opens the account menu and calls onSignOut', () => {
    const onSignOut = vi.fn();
    setup({ onSignOut });
    fireEvent.click(screen.getByRole('button', { name: 'Account menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders a theme toggle', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Change theme' })).toBeDefined();
  });
});
