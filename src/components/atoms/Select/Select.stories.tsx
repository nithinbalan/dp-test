import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select } from './Select';

const options = [
  { value: 'consent', label: 'Consent' },
  { value: 'contract', label: 'Performance of a contract' },
  { value: 'legal', label: 'Legal obligation' },
  { value: 'legitimate', label: 'Legitimate use', isDisabled: true },
];

const meta = {
  title: 'Atoms/Select',
  component: Select,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { options, placeholder: 'Choose a lawful basis', defaultValue: '', fullWidth: true },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Select {...args} size="sm" />
      <Select {...args} size="md" />
      <Select {...args} size="lg" />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Select {...args} defaultValue="consent" />
      <Select {...args} isInvalid />
      <Select {...args} isDisabled />
    </div>
  ),
};

export const WithStartSlot: Story = { args: { startSlot: <span>⚖</span> } };

/** No placeholder: for a select that always holds a value. */
export const AlwaysHasAValue: Story = {
  args: { placeholder: undefined, defaultValue: 'contract' },
};
