import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as an h1', () => {
    render(<PageHeader label="Data Sources" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Data Sources' })).toBeDefined();
  });

  it('renders the ref tag, description and action slot when supplied', () => {
    render(
      <PageHeader
        label="RoPA"
        refTag="JDP-ROPA"
        description="Every processing activity."
        actionSlot={<button type="button">Add activity</button>}
      />,
    );
    expect(screen.getByText('JDP-ROPA')).toBeDefined();
    expect(screen.getByText('Every processing activity.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add activity' })).toBeDefined();
  });
});
