import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@atoms/Button';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Molecules/PageHeader',
  component: PageHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Data Sources',
    description: 'Every connected app, database and file store scanned for personal data.',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRefTag: Story = {
  args: { refTag: 'JDP-DASH' },
};

export const WithAction: Story = {
  args: {
    refTag: 'JDP-DAS · feeds RoPA & Consent Ledger',
    actionSlot: <Button tone="brand">Add source</Button>,
  },
};
