import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Divider } from './Divider';

const meta = {
  title: 'Atoms/Divider',
  component: Divider,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <Divider {...args} />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Divider {...args} tone="subtle" />
      <Divider {...args} tone="neutral" />
      <Divider {...args} tone="strong" />
    </div>
  ),
};

export const Vertical: Story = {
  render: (args) => (
    <div className="text-fg-muted flex h-8 items-center gap-4 text-sm">
      {'Records'}
      <Divider {...args} orientation="vertical" />
      {'Consent'}
      <Divider {...args} orientation="vertical" />
      {'Grievances'}
    </div>
  ),
};

/** With a caption it becomes a section kicker — the prototype's dominant use. */
export const WithLabel: Story = {
  render: (args) => (
    <div className="w-96">
      <Divider {...args}>Retention</Divider>
    </div>
  ),
};
