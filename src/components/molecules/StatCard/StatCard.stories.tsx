import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '@atoms/Badge';
import { StatCard } from './StatCard';

const meta = {
  title: 'Molecules/StatCard',
  component: StatCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Processing records', value: '124' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Tone the value only when the number is itself good or bad news. */
export const Tones: Story = {
  render: (args) => (
    <div className="grid w-[52rem] grid-cols-4 gap-3">
      <StatCard {...args} tone="neutral" label="Total records" />
      <StatCard {...args} tone="success" label="Compliant" value="98" />
      <StatCard {...args} tone="warning" label="Due this week" value="12" />
      <StatCard {...args} tone="danger" label="Overdue" value="4" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <StatCard {...args} size="xs" />
      <StatCard {...args} size="sm" />
      <StatCard {...args} size="md" />
    </div>
  ),
};

export const WithDelta: Story = {
  args: {
    description: 'Up from 108 last quarter',
    endSlot: (
      <Badge tone="success" size="xs">
        +15%
      </Badge>
    ),
  },
};

export const Loading: Story = { args: { isLoading: true, loadingLabel: 'Loading record count' } };

/** The realistic use: the KPI row at the top of a dashboard. */
export const DashboardRow: Story = {
  render: () => (
    <div className="grid w-[52rem] grid-cols-4 gap-3">
      <StatCard label="Readiness" value="64%" tone="brand" description="Across 6 departments" />
      <StatCard label="Consent artefacts" value="1,204" />
      <StatCard label="Open grievances" value="7" tone="warning" />
      <StatCard label="Breaches (90d)" value="0" tone="success" />
    </div>
  ),
};
