import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OtpInput } from './OtpInput';

const meta = {
  title: 'Molecules/OtpInput',
  component: OtpInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    value: '',
    onValueChange: () => undefined,
  },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <OtpInput {...args} value={value} onValueChange={setValue} />;
  },
};

export const PartiallyFilled: Story = {
  args: { value: '123' },
};

export const WithError: Story = {
  args: { errorMessage: 'That code has expired.' },
};

export const Disabled: Story = {
  args: { isDisabled: true, value: '123' },
};

export const FourDigits: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <OtpInput {...args} length={4} value={value} onValueChange={setValue} />;
  },
};
