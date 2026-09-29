import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '@atoms/Badge';
import { Tabs, tabPanelProps } from './Tabs';

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'records', label: 'Records', endSlot: <Badge size="xs">24</Badge> },
  {
    value: 'grievances',
    label: 'Grievances',
    endSlot: (
      <Badge size="xs" tone="danger">
        7
      </Badge>
    ),
  },
  { value: 'audit', label: 'Audit log', isDisabled: true },
];

const meta = {
  title: 'Molecules/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Workspace sections', items, value: 'overview', onValueChange: () => undefined },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Enclosed: Story = { args: { variant: 'soft' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Tabs {...args} size="sm" />
      <Tabs {...args} size="md" />
    </div>
  ),
};

export const FullWidth: Story = { args: { fullWidth: true } };

/**
 * The realistic use. The strip and the panel are wired with `tabPanelProps`, so
 * `aria-controls` and `aria-labelledby` point at each other — a tablist that
 * controls nothing is worse than plain links.
 */
export const WithPanel: Story = {
  render: (args) => {
    const [value, setValue] = useState('overview');
    return (
      <div>
        <Tabs {...args} idPrefix="demo" value={value} onValueChange={setValue} />
        <div {...tabPanelProps('demo', value)} className="text-fg-muted p-4 text-sm">
          {`Panel content for “${value}”. Arrow keys move between tabs; Tab leaves the strip.`}
        </div>
      </div>
    );
  },
};
