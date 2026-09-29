import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkspaceField } from './WorkspaceField';

describe('WorkspaceField', () => {
  it('renders an editable field when empty', () => {
    render(<WorkspaceField value="" onValueChange={vi.fn()} domain=".jethurdpdp.com" />);
    expect(screen.getByLabelText('Workspace')).toBeDefined();
  });

  it('lowercases and strips invalid characters', () => {
    const onValueChange = vi.fn();
    render(<WorkspaceField value="" onValueChange={onValueChange} domain=".jethurdpdp.com" />);
    fireEvent.change(screen.getByLabelText('Workspace'), { target: { value: 'Your Co!' } });
    expect(onValueChange).toHaveBeenCalledWith('yourco');
  });

  it('collapses to a pill on blur once a value is set, and reopens on Change', () => {
    render(<WorkspaceField value="yourco" onValueChange={vi.fn()} domain=".jethurdpdp.com" />);
    // Starts collapsed because the initial value is already non-empty.
    expect(screen.getByText('yourco.jethurdpdp.com')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByLabelText('Workspace')).toBeDefined();
  });

  it('shows an error message', () => {
    render(
      <WorkspaceField
        value=""
        onValueChange={vi.fn()}
        domain=".jethurdpdp.com"
        errorMessage="We couldn't find that workspace."
      />,
    );
    expect(screen.getByRole('alert').textContent).toBe("We couldn't find that workspace.");
  });
});
