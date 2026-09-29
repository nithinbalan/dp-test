import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@atoms/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'No processing records yet',
    description:
      'A processing record describes one thing you do with personal data. Most organisations start with payroll.',
    startSlot: <span>🗂</span>,
    actionSlot: <Button tone="brand">Create the first record</Button>,
  },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing created yet: offer the action. */
export const NothingYet: Story = {};

/** Nothing matched: offer to clear the filter, not to create. */
export const NoResults: Story = {
  args: {
    tone: 'neutral',
    label: 'No records match these filters',
    description: 'Try widening the date range, or clear the department filter.',
    startSlot: <span>⌕</span>,
    actionSlot: <Button variant="outline">Clear filters</Button>,
  },
};

/** Nothing loaded: offer to retry. */
export const FailedToLoad: Story = {
  args: {
    tone: 'danger',
    label: 'Could not load records',
    description: 'The request timed out. Your data is unaffected.',
    startSlot: <span>⚠</span>,
    actionSlot: (
      <Button variant="outline" tone="danger">
        Try again
      </Button>
    ),
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <EmptyState {...args} size="sm" />
      <EmptyState {...args} size="md" />
    </div>
  ),
};

/** `ghost` for the body of a table that already draws its own border. */
export const InsideATable: Story = {
  render: (args) => (
    <div className="border-border-default bg-bg-surface rounded-surface border">
      <div className="border-border-default text-fg-subtle text-2xs border-b p-3 font-mono tracking-widest uppercase">
        Records
      </div>
      <EmptyState {...args} variant="ghost" size="sm" />
    </div>
  ),
};

export const TwoActions: Story = {
  args: {
    actionSlot: (
      <>
        <Button tone="brand">Create the first record</Button>
        <Button variant="ghost">Import from a spreadsheet</Button>
      </>
    ),
  },
};
