import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PeoplePicker } from './PeoplePicker';

const PEOPLE = [
  { id: 'p1', name: 'Priya Krishnan', initials: 'PK' },
  { id: 'p2', name: 'Arjun Mehta', initials: 'AM' },
];

const GROUPED_PEOPLE = [
  { id: 'p1', name: 'Priya Krishnan', initials: 'PK', detail: 'COO', group: 'Management' },
  {
    id: 'p2',
    name: 'Arjun Mehta',
    initials: 'AM',
    detail: 'Engineer',
    group: 'Development',
  },
];

describe('PeoplePicker', () => {
  it('shows the search field when nothing is selected', () => {
    render(
      <PeoplePicker label="Owner" people={PEOPLE} value={undefined} onValueChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox', { name: 'Owner' })).toBeDefined();
  });

  it('shows the selected person as a pill', () => {
    render(<PeoplePicker label="Owner" people={PEOPLE} value="p1" onValueChange={vi.fn()} />);
    expect(screen.getByText('Priya Krishnan')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Change' })).toBeDefined();
  });

  it('filters the list as the query changes', () => {
    render(
      <PeoplePicker label="Owner" people={PEOPLE} value={undefined} onValueChange={vi.fn()} />,
    );
    const input = screen.getByRole('combobox', { name: 'Owner' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Arjun' } });
    expect(screen.getByRole('option', { name: 'Arjun Mehta' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Priya Krishnan' })).toBeNull();
  });

  it('calls onValueChange when an option is picked', () => {
    const onValueChange = vi.fn();
    render(
      <PeoplePicker
        label="Owner"
        people={PEOPLE}
        value={undefined}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Owner' });
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole('option', { name: 'Arjun Mehta' }));
    expect(onValueChange).toHaveBeenCalledWith('p2');
  });

  it('reopens the picker from the pill Change button', () => {
    render(<PeoplePicker label="Owner" people={PEOPLE} value="p1" onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByRole('combobox', { name: 'Owner' })).toBeDefined();
  });

  describe('trigger variant', () => {
    it('renders a combobox trigger with the selected person and opens a popover on click', () => {
      render(
        <PeoplePicker
          label="Data Protection Officer"
          people={GROUPED_PEOPLE}
          value="p1"
          onValueChange={vi.fn()}
          variant="trigger"
        />,
      );
      const trigger = screen.getByRole('combobox', { name: 'Data Protection Officer' });
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(screen.getByText('Priya Krishnan')).toBeDefined();

      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(screen.getByPlaceholderText('Search name, role or team…')).toBeDefined();
    });

    it('groups options by department and filters live as you type', () => {
      render(
        <PeoplePicker
          label="Data Protection Officer"
          people={GROUPED_PEOPLE}
          value={undefined}
          onValueChange={vi.fn()}
          variant="trigger"
        />,
      );
      fireEvent.click(screen.getByRole('combobox', { name: 'Data Protection Officer' }));
      expect(screen.getByText('Management')).toBeDefined();
      expect(screen.getByText('Development')).toBeDefined();

      const search = screen.getByPlaceholderText('Search name, role or team…');
      fireEvent.change(search, { target: { value: 'Arjun' } });
      expect(screen.getByRole('option', { name: /Arjun Mehta/ })).toBeDefined();
      expect(screen.queryByRole('option', { name: /Priya Krishnan/ })).toBeNull();
    });

    it('selects an option and closes the popover', () => {
      const onValueChange = vi.fn();
      render(
        <PeoplePicker
          label="Data Protection Officer"
          people={GROUPED_PEOPLE}
          value={undefined}
          onValueChange={onValueChange}
          variant="trigger"
        />,
      );
      fireEvent.click(screen.getByRole('combobox', { name: 'Data Protection Officer' }));
      fireEvent.click(screen.getByRole('option', { name: /Arjun Mehta/ }));
      expect(onValueChange).toHaveBeenCalledWith('p2');
      expect(
        screen
          .getByRole('combobox', { name: 'Data Protection Officer' })
          .getAttribute('aria-expanded'),
      ).toBe('false');
    });

    it('closes on Escape', () => {
      render(
        <PeoplePicker
          label="Data Protection Officer"
          people={GROUPED_PEOPLE}
          value={undefined}
          onValueChange={vi.fn()}
          variant="trigger"
        />,
      );
      const trigger = screen.getByRole('combobox', { name: 'Data Protection Officer' });
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      fireEvent.keyDown(screen.getByPlaceholderText('Search name, role or team…'), {
        key: 'Escape',
      });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('shows the footer count and a Manage link to the employee register', () => {
      render(
        <PeoplePicker
          label="Data Protection Officer"
          people={GROUPED_PEOPLE}
          value={undefined}
          onValueChange={vi.fn()}
          variant="trigger"
          employeeRegisterHref="/employees"
        />,
      );
      fireEvent.click(screen.getByRole('combobox', { name: 'Data Protection Officer' }));
      expect(screen.getByText('2 of 2 from the Employee register')).toBeDefined();
      expect(screen.getByRole('link', { name: 'Manage' }).getAttribute('href')).toBe('/employees');
    });
  });

  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('still lets the trigger variant open, search and select in Arabic', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const onValueChange = vi.fn();
      render(
        <PeoplePicker
          label="مسؤول حماية البيانات"
          people={GROUPED_PEOPLE}
          value={undefined}
          onValueChange={onValueChange}
          variant="trigger"
        />,
      );
      const trigger = screen.getByRole('combobox', { name: 'مسؤول حماية البيانات' });
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole('option', { name: /Priya Krishnan/ }));
      expect(onValueChange).toHaveBeenCalledWith('p1');
    });
  });
});
