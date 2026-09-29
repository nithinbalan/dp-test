import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from './Label';

const meta = {
  title: 'Atoms/Label',
  component: Label,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Purpose of processing', htmlFor: 'purpose' },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = { args: { isRequired: true } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Label {...args} size="xs" />
      <Label {...args} size="sm" />
      <Label {...args} size="md" />
    </div>
  ),
};

/** The trailing slot pins to the inline-END edge, so it flips in Arabic. */
export const WithEndSlot: Story = {
  render: (args) => (
    <div className="w-80">
      <Label {...args} endSlot={<span className="text-fg-subtle text-2xs">Optional</span>} />
    </div>
  ),
};

export const Disabled: Story = { args: { isDisabled: true } };

/** Clicking the caption focuses the control — the reason this is a real `<label>`. */
export const BoundToAControl: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label {...args} isRequired />
      <input
        id="purpose"
        className="border-border-default bg-bg-surface text-fg-default rounded-control h-9 border px-3 text-sm"
      />
    </div>
  ),
};
