import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PasswordInput } from './PasswordInput';

const meta = {
  title: 'Molecules/PasswordInput',
  component: PasswordInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Password',
    value: '',
    onValueChange: () => undefined,
    autoComplete: 'new-password',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <PasswordInput {...args} value={value} onValueChange={setValue} />;
  },
};

export const Required: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <PasswordInput
        {...args}
        label="New password"
        isRequired
        description="At least 8 characters"
        value={value}
        onValueChange={setValue}
      />
    );
  },
};

export const WithError: Story = {
  args: { label: 'Confirm password', errorMessage: 'Passwords do not match.' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
