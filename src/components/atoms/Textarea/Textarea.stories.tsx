import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Describe the purpose of processing', fullWidth: true },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Textarea {...args} size="sm" />
      <Textarea {...args} size="md" />
      <Textarea {...args} size="lg" />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Textarea {...args} isInvalid defaultValue="Too short" />
      <Textarea {...args} isReadOnly defaultValue="Read only" />
      <Textarea {...args} isDisabled defaultValue="Disabled" />
    </div>
  ),
};

export const Fixed: Story = { args: { isResizable: false, rows: 5 } };

export const LongContent: Story = {
  args: {
    rows: 4,
    defaultValue:
      'Personal data is collected to verify identity at onboarding, to meet the record-keeping obligation, and to contact the data principal about material changes to this notice.',
  },
};
