import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs, tabPanelProps } from './Tabs';

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'records', label: 'Records' },
  { value: 'audit', label: 'Audit log', isDisabled: true },
];

const renderTabs = (props: Partial<React.ComponentProps<typeof Tabs>> = {}) =>
  render(
    <Tabs
      label="Workspace sections"
      items={items}
      value="overview"
      onValueChange={() => undefined}
      idPrefix="t"
      {...props}
    />,
  );

describe('Tabs', () => {
  it('renders a tablist with one selected tab', () => {
    renderTabs();
    expect(screen.getByRole('tablist', { name: 'Workspace sections' })).toBeDefined();
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Overview');
  });

  /**
   * A strip of nine tabs would otherwise be nine tab stops between the user and
   * the content they were heading for.
   */
  it('is one tab stop — arrows move within, Tab leaves', () => {
    renderTabs();
    const stops = screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0);
    expect(stops).toHaveLength(1);
  });

  it('moves to the next tab on the forward arrow', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith('records');
  });

  /**
   * Arrow keys are physical and reading order is logical. In Arabic they point
   * opposite ways, and nothing in CSS can reconcile them — only this mapping can.
   */
  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('treats the LEFT arrow as forward', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const onValueChange = vi.fn();
      renderTabs({ onValueChange });
      fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
      expect(onValueChange).toHaveBeenCalledWith('records');
    });
  });

  it('skips disabled tabs when moving with the keyboard', () => {
    const onValueChange = vi.fn();
    renderTabs({ value: 'records', onValueChange });
    // 'audit' is disabled, so forward from the last selectable tab wraps to the first.
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith('overview');
  });

  it('jumps to the ends with Home and End', () => {
    const onValueChange = vi.fn();
    renderTabs({ value: 'records', onValueChange });
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(onValueChange).toHaveBeenCalledWith('overview');
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(onValueChange).toHaveBeenCalledWith('records');
  });

  /** A tablist whose tabs control nothing is worse than a row of links. */
  it('points the tab and its panel at each other', () => {
    render(
      <>
        <Tabs
          label="Sections"
          items={items}
          value="overview"
          onValueChange={() => undefined}
          idPrefix="t"
        />
        <div {...tabPanelProps('t', 'overview')}>Panel</div>
      </>,
    );
    const tab = screen.getByRole('tab', { selected: true });
    const panel = screen.getByRole('tabpanel');
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });
});
