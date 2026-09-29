import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { placeholder: 'Search records', fullWidth: true },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} size="sm" />
      <Input {...args} size="md" />
      <Input {...args} size="lg" />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} defaultValue="Acme Retail Pvt Ltd" />
      <Input {...args} isInvalid defaultValue="not-an-email" />
      <Input {...args} isReadOnly defaultValue="Read only" />
      <Input {...args} isDisabled defaultValue="Disabled" />
    </div>
  ),
};

/** Slots sit inside the border and follow `dir`, so the icon leads in Arabic too. */
export const WithSlots: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Input {...args} startSlot={<span>⌕</span>} />
      <Input {...args} endSlot={<span className="text-2xs font-mono">MB</span>} />
      <Input
        {...args}
        startSlot={<span>⌕</span>}
        endSlot={<span className="text-2xs font-mono">42</span>}
      />
    </div>
  ),
};
