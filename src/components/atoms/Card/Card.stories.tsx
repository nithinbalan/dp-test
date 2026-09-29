import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from './Card';

const meta = {
  title: 'Atoms/Card',
  component: Card,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    children: (
      <div className="flex flex-col gap-1">
        <span className="text-md font-semibold">Records of processing</span>
        <span className="text-fg-muted text-sm">24 activities across 6 departments</span>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Card {...args} variant="outline" />
      <Card {...args} variant="soft" />
      <Card {...args} variant="ghost" />
    </div>
  ),
};

export const Padding: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Card {...args} size="sm" />
      <Card {...args} size="md" />
      <Card {...args} size="lg" />
    </div>
  ),
};

export const Elevation: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Card {...args} elevation="sm" />
      <Card {...args} elevation="md" />
      <Card {...args} elevation="lg" />
    </div>
  ),
};

/**
 * `isInteractive` is chrome only. The real control is nested inside, which is what
 * keeps the card reachable by keyboard.
 */
export const Interactive: Story = {
  render: (args) => (
    <Card {...args} isInteractive>
      <a href="#" className="flex flex-col gap-1 no-underline">
        <span className="text-md font-semibold">Records of processing</span>
        <span className="text-fg-muted text-sm">24 activities across 6 departments</span>
      </a>
    </Card>
  ),
};

/** `size="none"` for a card whose children own their own edges — a table, a list. */
export const NoPadding: Story = {
  render: (args) => (
    <Card {...args} size="none">
      <div className="border-border-default border-b p-4 text-sm font-semibold">Header</div>
      <div className="p-4 text-sm">Row</div>
    </Card>
  ),
};

export const Invalid: Story = { args: { isInvalid: true } };
