import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Progress } from './Progress';

const meta = {
  title: 'Atoms/Progress',
  component: Progress,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { value: 64, label: 'Readiness score' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Progress {...args} size="sm" />
      <Progress {...args} size="md" />
      <Progress {...args} size="lg" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['brand', 'accent', 'success', 'warning', 'danger', 'info'] as const).map((tone) => (
        <Progress key={tone} {...args} tone={tone} />
      ))}
    </div>
  ),
};

/** Out-of-range data is clamped, so it cannot render a fill wider than its track. */
export const OutOfRangeIsClamped: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Progress {...args} value={-20} />
      <Progress {...args} value={220} />
    </div>
  ),
};

/** When the percentage is not the point, announce the count instead. */
export const WithValueLabel: Story = {
  args: { value: 18, max: 24, valueLabel: '18 of 24 records mapped' },
};
