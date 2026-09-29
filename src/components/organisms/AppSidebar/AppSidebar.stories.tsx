import { Database, LayoutDashboard, Sparkles } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AppSidebar } from './AppSidebar';

const meta = {
  title: 'Organisms/AppSidebar',
  component: AppSidebar,
  parameters: { layout: 'fullscreen', nextjs: { navigation: { pathname: '/dashboard' } } },
  tags: ['autodocs'],
  args: {
    aiItem: { href: '/ai', label: 'Jethur AI', icon: <Sparkles className="size-4" /> },
    groups: [
      {
        label: 'Overview',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
        ],
      },
      {
        label: 'Data Discovery',
        items: [
          {
            href: '/data-sources',
            label: 'Data Sources',
            icon: <Database className="size-4" />,
            badge: '11',
          },
        ],
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MobileOpen: Story = {
  args: { isMobileOpen: true, onCloseMobile: () => undefined },
};
