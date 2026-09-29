import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AuthShell } from './AuthShell';

const meta = {
  title: 'Templates/AuthShell',
  component: AuthShell,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    leftSlot: <div className="text-2xl font-semibold">Brand panel</div>,
    rightSlot: (
      <div className="border-border-default bg-bg-surface rounded-surface w-full max-w-sm border p-8">
        Card slot
      </div>
    ),
  },
};
