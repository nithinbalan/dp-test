import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@atoms/Input';
import { Field } from './Field';

const renderField = (props: Partial<Parameters<typeof Field>[0]> = {}) =>
  render(
    <Field label="Purpose of processing" {...props}>
      {(control) => <Input {...control} testId="control" />}
    </Field>,
  );

describe('Field', () => {
  it('names the control from the label', () => {
    renderField();
    expect(screen.getByLabelText('Purpose of processing')).toBeDefined();
  });

  it('points the control at its description', () => {
    renderField({ description: 'Shown in the consent notice.' });
    const describedBy = screen.getByTestId('control').getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(screen.getByText('Shown in the consent notice.').id).toBe(describedBy);
  });

  /**
   * The message and the invalid styling come from ONE prop. Separate props let a
   * field turn red with no explanation, or explain with no visual cue.
   */
  it('derives the invalid state from the error message itself', () => {
    renderField({ errorMessage: 'A purpose is required.' });
    expect(screen.getByTestId('control').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toBe('A purpose is required.');
  });

  it('describes the control by BOTH the description and the error when it has both', () => {
    renderField({ description: 'Helper', errorMessage: 'Broken' });
    const describedBy = screen.getByTestId('control').getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toHaveLength(2);
  });

  it('leaves aria-describedby off entirely when there is nothing to describe', () => {
    renderField();
    expect(screen.getByTestId('control').hasAttribute('aria-describedby')).toBe(false);
  });

  it('marks required on the control, not only on the label', () => {
    renderField({ isRequired: true });
    expect(screen.getByTestId('control').hasAttribute('required')).toBe(true);
    expect(screen.getByText('required')).toBeDefined();
  });
});
