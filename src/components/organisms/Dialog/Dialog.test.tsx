import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(
      <Dialog isOpen={false} onClose={vi.fn()} label="Add a dataset">
        Body
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the label, description and body when open', () => {
    render(
      <Dialog isOpen onClose={vi.fn()} label="Add a dataset" description="By hand">
        Body content
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Add a dataset' })).toBeDefined();
    expect(screen.getByText('By hand')).toBeDefined();
    expect(screen.getByText('Body content')).toBeDefined();
  });

  it('calls onClose from the close button', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen onClose={onClose} label="Add a dataset">
        Body
      </Dialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen onClose={onClose} label="Add a dataset">
        Body
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click but not on panel click', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen onClose={onClose} label="Add a dataset">
        Body
      </Dialog>,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
