import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { label: 'Loading records' },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Spinner {...args} size="xs" />
      <Spinner {...args} size="sm" />
      <Spinner {...args} size="md" />
      <Spinner {...args} size="lg" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Spinner {...args} tone="brand" />
      <Spinner {...args} tone="accent" />
      <Spinner {...args} tone="muted" />
      <span className="bg-bg-inverse rounded-control p-2">
        <Spinner {...args} tone="inverse" />
      </span>
    </div>
  ),
};

/** `tone="current"` inherits from the text it sits in — the usual inline case. */
export const InlineWithText: Story = {
  render: (args) => (
    <p className="text-brand-fg flex items-center gap-2 text-sm">
      <Spinner {...args} size="xs" />
      {'Scanning 1,204 records…'}
    </p>
  ),
};
