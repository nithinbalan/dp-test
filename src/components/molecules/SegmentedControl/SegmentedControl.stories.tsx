import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SegmentedControl } from './SegmentedControl';

const items = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Assigned to me' },
  { value: 'overdue', label: 'Overdue' },
];

const meta = {
  title: 'Molecules/SegmentedControl',
  component: SegmentedControl,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Filter records by', items, value: 'all', onValueChange: () => undefined },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Arrow keys move between segments — behaviour the native radios give us free. */
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('all');
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />;
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl {...args} size="sm" />
      <SegmentedControl {...args} size="md" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl {...args} tone="brand" />
      <SegmentedControl {...args} tone="accent" />
      <SegmentedControl {...args} tone="neutral" />
    </div>
  ),
};

export const FullWidth: Story = {
  render: (args) => (
    <div className="w-96">
      <SegmentedControl {...args} fullWidth />
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    label: 'View as',
    value: 'grid',
    items: [
      { value: 'grid', label: 'Grid', startSlot: <span>▦</span> },
      { value: 'list', label: 'List', startSlot: <span>☰</span> },
    ],
  },
};

export const WithDisabledSegment: Story = {
  args: {
    items: [...items, { value: 'archived', label: 'Archived', isDisabled: true }],
  },
};

export const Disabled: Story = { args: { isDisabled: true } };
