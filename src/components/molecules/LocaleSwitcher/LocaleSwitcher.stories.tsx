import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LocaleSwitcher } from './LocaleSwitcher';

const meta = {
  title: 'Molecules/LocaleSwitcher',
  component: LocaleSwitcher,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { current: 'en', label: 'Change language' },
} satisfies Meta<typeof LocaleSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Arabic: Story = { args: { current: 'ar', label: 'تغيير اللغة' } };
export const German: Story = { args: { current: 'de', label: 'Sprache ändern' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <LocaleSwitcher {...args} size="sm" />
      <LocaleSwitcher {...args} size="md" />
      <LocaleSwitcher {...args} size="lg" />
    </div>
  ),
};
