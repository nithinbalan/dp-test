import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';

const MESSAGES = {
  inputLabel: 'Ask Jethur AI',
  inputPlaceholder: 'Ask a question…',
  sendLabel: 'Send',
  respondingLabel: 'Thinking…',
};

function setup(props: Partial<ComponentProps<typeof ChatPanel>> = {}) {
  return render(<ChatPanel history={[]} onSend={vi.fn()} messages={MESSAGES} {...props} />);
}

describe('ChatPanel', () => {
  it('renders the transcript', () => {
    setup({
      history: [
        { id: '1', role: 'user', text: 'What is a DPIA?' },
        { id: '2', role: 'assistant', text: 'A Data Protection Impact Assessment.' },
      ],
    });
    expect(screen.getByText('What is a DPIA?')).toBeDefined();
    expect(screen.getByText('A Data Protection Impact Assessment.')).toBeDefined();
  });

  it('calls onSend with the trimmed draft and clears the input', () => {
    const onSend = vi.fn();
    setup({ onSend });
    const input = screen.getByLabelText('Ask Jethur AI');
    fireEvent.change(input, { target: { value: '  How do I withdraw consent?  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('How do I withdraw consent?');
    expect(input).toHaveProperty('value', '');
  });

  it('does not send an empty or whitespace-only draft', () => {
    const onSend = vi.fn();
    setup({ onSend });
    const input = screen.getByLabelText('Ask Jethur AI');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', true);
  });

  it('calls onSend when a suggestion is clicked', () => {
    const onSend = vi.fn();
    setup({ onSend, suggestions: ['What counts as a breach?'] });
    fireEvent.click(screen.getByText('What counts as a breach?'));
    expect(onSend).toHaveBeenCalledWith('What counts as a breach?');
  });

  it('shows the responding indicator and disables the input', () => {
    setup({ isResponding: true });
    expect(screen.getByText('Thinking…')).toBeDefined();
    expect(screen.getByLabelText('Ask Jethur AI')).toHaveProperty('disabled', true);
  });
});
