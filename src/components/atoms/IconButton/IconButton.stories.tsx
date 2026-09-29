import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IconButton } from './IconButton';

/** Stand-in glyph. Real usage passes an icon from whatever set the app adopts. */
const Trash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[1em]">
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" strokeLinecap="round" />
  </svg>
);

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { label: 'Delete record', children: <Trash /> },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} variant="solid" tone="brand" />
      <IconButton {...args} variant="soft" tone="brand" />
      <IconButton {...args} variant="outline" tone="brand" />
      <IconButton {...args} variant="ghost" tone="brand" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} size="xs" variant="outline" />
      <IconButton {...args} size="sm" variant="outline" />
      <IconButton {...args} size="md" variant="outline" />
      <IconButton {...args} size="lg" variant="outline" />
    </div>
  ),
};

export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} shape="rounded" variant="soft" />
      <IconButton {...args} shape="circle" variant="soft" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const).map(
        (tone) => (
          <IconButton key={tone} {...args} tone={tone} variant="soft" />
        ),
      )}
    </div>
  ),
};

export const Disabled: Story = { args: { isDisabled: true, variant: 'outline' } };
