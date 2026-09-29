import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from './Select';

const options = [
  { value: 'consent', label: 'Consent' },
  { value: 'contract', label: 'Performance of a contract' },
];

describe('Select', () => {
  it('renders every option in the order given', () => {
    render(<Select testId="select" options={options} defaultValue="consent" />);
    const rendered = [...screen.getByTestId('select').querySelectorAll('option')];
    expect(rendered.map((o) => o.value)).toEqual(['consent', 'contract']);
  });

  it('reports the selected value, so the caller never reads event.target', () => {
    const onValueChange = vi.fn();
    render(
      <Select
        testId="select"
        options={options}
        defaultValue="consent"
        onValueChange={onValueChange}
      />,
    );
    fireEvent.change(screen.getByTestId('select'), { target: { value: 'contract' } });
    expect(onValueChange).toHaveBeenCalledWith('contract');
  });

  /**
   * The placeholder must not be submittable, or a required select can be
   * satisfied by "Choose one…".
   */
  it('renders the placeholder as a disabled empty option', () => {
    render(<Select testId="select" options={options} placeholder="Choose one" defaultValue="" />);
    const placeholder = screen.getByTestId('select').querySelector('option');
    expect(placeholder?.value).toBe('');
    expect(placeholder?.disabled).toBe(true);
  });

  it('honours a per-option disabled flag', () => {
    render(
      <Select
        testId="select"
        options={[...options, { value: 'legal', label: 'Legal', isDisabled: true }]}
        defaultValue="consent"
      />,
    );
    const legal = screen
      .getByTestId('select')
      .querySelector<HTMLOptionElement>('option[value="legal"]');
    expect(legal?.disabled).toBe(true);
  });
});
