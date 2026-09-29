import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ScoreRing } from './ScoreRing';

const meta = {
  title: 'Molecules/ScoreRing',
  component: ScoreRing,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    value: 62,
    label: 'Overall readiness score',
  },
} satisfies Meta<typeof ScoreRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { value: 62, description: 'Developing', tone: 'warning', size: 'xl' },
};

export const Strong: Story = {
  args: { value: 88, description: 'Strong', tone: 'success' },
};

export const AtRisk: Story = {
  args: { value: 28, description: 'At risk', tone: 'danger' },
};

export const Empty: Story = {
  args: { value: 0, description: 'Not started', tone: 'neutral', size: 'md' },
};
