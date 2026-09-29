import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AppTopbar } from './AppTopbar';

const meta = {
  title: 'Organisms/AppTopbar',
  component: AppTopbar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    orgName: 'Your Company Pvt Ltd',
    workspaceAddress: 'yourco.jethurdpdp.com',
    enforcementDaysRemaining: 304,
    userName: 'Data Protection Lead',
    userInitials: 'DP',
    userRole: 'Admin',
    locale: 'en',
    onLocaleChange: () => undefined,
    onOpenMobileNav: () => undefined,
  },
} satisfies Meta<typeof AppTopbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
