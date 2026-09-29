import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@atoms/Button';
import { Alert } from './Alert';

const meta = {
  title: 'Molecules/Alert',
  component: Alert,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Three processing records are missing a lawful basis',
    description: 'They will not appear in the published notice until one is chosen.',
  },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Tone is semantic: `danger` and `warning` also interrupt a screen reader. */
export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['info', 'success', 'warning', 'danger', 'brand', 'neutral'] as const).map((tone) => (
        <Alert key={tone} {...args} tone={tone} label={`${tone} alert`} />
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Alert {...args} variant="soft" tone="warning" />
      <Alert {...args} variant="outline" tone="warning" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Alert {...args} size="sm" />
      <Alert {...args} size="md" />
    </div>
  ),
};

export const WithAction: Story = {
  args: {
    tone: 'danger',
    startSlot: <span>⚠</span>,
    endSlot: (
      <Button size="sm" variant="solid" tone="danger">
        Review
      </Button>
    ),
  },
};

export const Dismissible: Story = {
  args: { tone: 'success', onDismiss: () => undefined, dismissLabel: 'Dismiss this message' },
};

export const WithRichBody: Story = {
  args: {
    tone: 'danger',
    description: undefined,
    children: (
      <ul className="mt-1 list-disc space-y-1 ps-4 text-xs">
        <li>Payroll export — no lawful basis</li>
        <li>CCTV retention — no retention period</li>
        <li>Vendor list — no processor agreement on file</li>
      </ul>
    ),
  },
};
