import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage } from './ChatPanel.types';

const MESSAGES = {
  inputLabel: 'Ask Jethur AI',
  inputPlaceholder: 'Ask a question about the DPDP Act…',
  sendLabel: 'Send',
  respondingLabel: 'Jethur AI is answering…',
};

const meta = {
  title: 'Organisms/ChatPanel',
  component: ChatPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    history: [],
    onSend: () => undefined,
    messages: MESSAGES,
    assistantName: 'Jethur AI',
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(args: Partial<React.ComponentProps<typeof ChatPanel>>) {
  const [history, setHistory] = useState<ChatMessage[]>([
    { id: '1', role: 'user', text: 'How long do we have to notify the Board after a breach?' },
    {
      id: '2',
      role: 'assistant',
      text: 'An immediate description goes to the Board right away, followed by a detailed report within 72 hours (Rule 7(2)).',
    },
  ]);
  return (
    <div className="h-96">
      <ChatPanel
        {...args}
        messages={args.messages ?? MESSAGES}
        history={history}
        onSend={(text) => {
          setHistory((current) => [
            ...current,
            { id: String(current.length + 1), role: 'user', text },
          ]);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
};

export const Empty: Story = {
  args: {
    history: [],
    suggestions: ['What counts as a personal data breach?', 'How do I withdraw consent?'],
  },
};

export const Responding: Story = {
  args: {
    history: [{ id: '1', role: 'user', text: 'What is a DPIA?' }],
    isResponding: true,
  },
};
