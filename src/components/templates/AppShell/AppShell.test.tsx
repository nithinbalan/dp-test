import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders the sidebar, topbar and content', () => {
    render(
      <AppShell sidebarSlot={<span>Sidebar</span>} topbarSlot={<span>Topbar</span>}>
        <span>Content</span>
      </AppShell>,
    );
    expect(screen.getByText('Sidebar')).toBeDefined();
    expect(screen.getByText('Topbar')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });
});
