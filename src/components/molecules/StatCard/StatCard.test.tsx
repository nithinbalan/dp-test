import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders the value and what it measures', () => {
    render(<StatCard label="Processing records" value="124" />);
    expect(screen.getByText('124')).toBeDefined();
    expect(screen.getByText('Processing records')).toBeDefined();
  });

  /**
   * The value is a ReactNode so the caller can format it with `Intl` — digit
   * shapes and separators are locale decisions, not display ones.
   */
  it('renders an already-formatted value verbatim', () => {
    render(
      <StatCard label="Consent artefacts" value={new Intl.NumberFormat('de-DE').format(1204)} />,
    );
    expect(screen.getByText('1.204')).toBeDefined();
  });

  it('announces that it is busy while the number is loading', () => {
    render(<StatCard testId="stat" label="Records" value="124" isLoading />);
    expect(screen.getByTestId('stat').getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByText('124')).toBeNull();
  });

  it('takes the loading text from the caller, so it can be translated', () => {
    render(<StatCard label="Records" value="124" isLoading loadingLabel="Wird geladen" />);
    expect(screen.getByText('Wird geladen')).toBeDefined();
  });

  it('pins the trailing slot to the inline-end edge, not the right edge', () => {
    render(<StatCard testId="stat" label="Records" value="124" endSlot={<span>+15%</span>} />);
    expect(screen.getByTestId('stat').innerHTML).toContain('ms-auto');
  });
});
