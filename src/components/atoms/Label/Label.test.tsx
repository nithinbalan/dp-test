import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './Label';

describe('Label', () => {
  it('names the control it points at', () => {
    render(
      <>
        <Label htmlFor="purpose">Purpose of processing</Label>
        <input id="purpose" />
      </>,
    );
    expect(screen.getByLabelText('Purpose of processing')).toBeDefined();
  });

  it('announces the required marker in words, not as a bare asterisk', () => {
    render(
      <Label htmlFor="purpose" isRequired requiredLabel="Pflichtfeld">
        Zweck
      </Label>,
    );
    expect(screen.getByText('Pflichtfeld')).toBeDefined();
  });

  it('omits the marker when the field is optional', () => {
    render(<Label htmlFor="purpose">Purpose</Label>);
    expect(screen.queryByText('required')).toBeNull();
  });

  it('pins the trailing slot to the inline-end edge, not the right edge', () => {
    render(
      <Label htmlFor="purpose" testId="label" endSlot={<span>Optional</span>}>
        Purpose
      </Label>,
    );
    // `ms-auto` resolves against `dir`; `ml-auto` would strand the hint on the
    // wrong side of every Arabic form.
    expect(screen.getByTestId('label').innerHTML).toContain('ms-auto');
  });
});
