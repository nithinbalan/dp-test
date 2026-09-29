import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { label: 'Ajmal Faiz', initials: 'AF' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} size="xs" />
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
      <Avatar {...args} size="xl" />
    </div>
  ),
};

/** `rounded` reads as a workspace, `circle` as a person. Keep that split consistent. */
export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} shape="rounded" />
      <Avatar {...args} shape="circle" />
      <Avatar {...args} shape="square" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const).map(
        (tone) => (
          <Avatar key={tone} {...args} tone={tone} />
        ),
      )}
    </div>
  ),
};

/**
 * The caller owns the image element, so `next/image`, a plain tag and a
 * placeholder all drop into the same slot.
 */
export const WithImage: Story = {
  args: {
    imageSlot: (
      <svg viewBox="0 0 32 32" className="size-full" aria-hidden>
        <rect width="32" height="32" fill="#2F6B4F" />
        <circle cx="16" cy="12" r="5" fill="#B5D334" />
        <path d="M4 32c0-7 5.4-11 12-11s12 4 12 11z" fill="#B5D334" />
      </svg>
    ),
  },
};

export const Stack: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Avatar {...args} shape="circle" tone="brand" initials="AF" label="Ajmal Faiz" />
      <Avatar {...args} shape="circle" tone="info" initials="RK" label="Ravi Kumar" />
      <Avatar {...args} shape="circle" tone="warning" initials="SM" label="Sara Mehta" />
    </div>
  ),
};
