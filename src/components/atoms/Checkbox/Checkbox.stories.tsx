import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Send a copy of this notice to the data principal' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

/** The select-all state of a table header. */
export const Indeterminate: Story = { args: { isIndeterminate: true, children: 'Select all' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} size="sm" defaultChecked />
      <Checkbox {...args} size="md" defaultChecked />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} tone="brand" defaultChecked />
      <Checkbox {...args} tone="accent" defaultChecked />
      <Checkbox {...args} tone="danger" defaultChecked />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} isInvalid />
      <Checkbox {...args} isDisabled />
      <Checkbox {...args} isDisabled defaultChecked />
    </div>
  ),
};

/** No caption: for a checkbox in a table row, where the row is the label. */
export const BoxOnly: Story = { args: { children: undefined, 'aria-label': 'Select row' } };

export const LongContent: Story = {
  render: (args) => (
    <div className="w-72">
      <Checkbox {...args}>
        Ich stimme der Verarbeitung meiner personenbezogenen Daten zu den oben genannten Zwecken zu
      </Checkbox>
    </div>
  ),
};
