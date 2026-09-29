import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WorkspaceField } from './WorkspaceField';

const meta = {
  title: 'Molecules/WorkspaceField',
  component: WorkspaceField,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    value: '',
    onValueChange: () => undefined,
    domain: '.jethurdpdp.com',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkspaceField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <WorkspaceField {...args} value={value} onValueChange={setValue} />;
  },
};

export const Confirmed: Story = {
  render: (args) => {
    const [value, setValue] = useState('yourco');
    return <WorkspaceField {...args} value={value} onValueChange={setValue} />;
  },
};

export const WithError: Story = {
  args: { errorMessage: "We couldn't find that workspace." },
};
