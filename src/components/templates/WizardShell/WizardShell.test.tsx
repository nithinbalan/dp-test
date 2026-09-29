import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WizardShell } from './WizardShell';

describe('WizardShell', () => {
  it('renders the stepper, content and footer slots', () => {
    render(
      <WizardShell stepperSlot={<span>Stepper</span>} footerSlot={<span>Footer</span>}>
        <span>Content</span>
      </WizardShell>,
    );
    expect(screen.getByText('Stepper')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
    expect(screen.getByText('Footer')).toBeDefined();
  });
});
