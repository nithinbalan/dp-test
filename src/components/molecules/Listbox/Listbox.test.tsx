import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Listbox } from './Listbox';
import type { ListboxOption } from './Listbox.types';

const OPTIONS: ListboxOption[] = [
  { value: 'consent', label: 'Consent' },
  { value: 'contract', label: 'Performance of a contract' },
  { value: 'legal', label: 'Legal obligation', isDisabled: true },
];

describe('Listbox', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(
      <Listbox
        label="Lawful basis"
        options={OPTIONS}
        value={undefined}
        onValueChange={vi.fn()}
        placeholder="Choose a lawful basis"
      />,
    );
    expect(screen.getByText('Choose a lawful basis')).toBeDefined();
  });

  it('shows the selected option label on the trigger', () => {
    render(
      <Listbox label="Lawful basis" options={OPTIONS} value="consent" onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox', { name: 'Lawful basis' })).toBeDefined();
    expect(screen.getByText('Consent')).toBeDefined();
  });

  it('opens the popup and lists every option on trigger click', () => {
    render(
      <Listbox label="Lawful basis" options={OPTIONS} value={undefined} onValueChange={vi.fn()} />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Lawful basis' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('option', { name: 'Consent' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Legal obligation' })).toBeDefined();
  });

  it('calls onValueChange and closes when an option is picked', () => {
    const onValueChange = vi.fn();
    render(
      <Listbox
        label="Lawful basis"
        options={OPTIONS}
        value={undefined}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Lawful basis' }));
    fireEvent.click(screen.getByRole('option', { name: 'Consent' }));

    expect(onValueChange).toHaveBeenCalledWith('consent');
    expect(
      screen.getByRole('combobox', { name: 'Lawful basis' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('does not select a disabled option', () => {
    const onValueChange = vi.fn();
    render(
      <Listbox
        label="Lawful basis"
        options={OPTIONS}
        value={undefined}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Lawful basis' }));
    fireEvent.click(screen.getByRole('option', { name: 'Legal obligation' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    render(
      <Listbox label="Lawful basis" options={OPTIONS} value={undefined} onValueChange={vi.fn()} />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Lawful basis' });
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on an outside click', () => {
    render(
      <div>
        <Listbox label="Lawful basis" options={OPTIONS} value={undefined} onValueChange={vi.fn()} />
        <button type="button">Elsewhere</button>
      </div>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Lawful basis' });
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not open when disabled', () => {
    render(
      <Listbox
        label="Lawful basis"
        options={OPTIONS}
        value={undefined}
        onValueChange={vi.fn()}
        isDisabled
      />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Lawful basis' }));
    expect(
      screen.getByRole('combobox', { name: 'Lawful basis' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('shows the empty-options message when there is nothing to choose', () => {
    render(
      <Listbox
        label="Lawful basis"
        options={[]}
        value={undefined}
        onValueChange={vi.fn()}
        emptyOptionsLabel="No lawful bases configured yet"
      />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Lawful basis' }));
    expect(screen.getByText('No lawful bases configured yet')).toBeDefined();
  });

  it('shows the error message when invalid', () => {
    render(
      <Listbox
        label="Lawful basis"
        options={OPTIONS}
        value={undefined}
        onValueChange={vi.fn()}
        errorMessage="Choose a lawful basis before saving."
      />,
    );
    expect(screen.getByRole('alert').textContent).toBe('Choose a lawful basis before saving.');
  });
});
