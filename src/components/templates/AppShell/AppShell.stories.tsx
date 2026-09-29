import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AppShell } from './AppShell';

const meta = {
  title: 'Templates/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sidebarSlot: <div className="bg-bg-inverse w-64 shrink-0" />,
    topbarSlot: <div className="border-border-default h-14 border-b" />,
    children: <div className="text-fg-default">Page content</div>,
  },
};
