import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TagPicker } from './TagPicker';

const OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone number' },
  { value: 'aadhaar', label: 'Aadhaar number', isSensitive: true },
  { value: 'pan', label: 'PAN', isSensitive: true },
  { value: 'health', label: 'Health data', isSensitive: true },
];

const meta = {
  title: 'Molecules/TagPicker',
  component: TagPicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Identifier types',
    options: OPTIONS,
    value: [],
    onValueChange: () => undefined,
  },
} satisfies Meta<typeof TagPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>([]);
    return <TagPicker {...args} value={value} onValueChange={setValue} />;
  },
};

export const WithSelection: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(['name', 'email', 'aadhaar']);
    return <TagPicker {...args} value={value} onValueChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { value: ['name', 'aadhaar'], isDisabled: true },
};
