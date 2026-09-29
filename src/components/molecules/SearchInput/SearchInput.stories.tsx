import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SearchInput } from './SearchInput';

const meta = {
  title: 'Molecules/SearchInput',
  component: SearchInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    value: '',
    onValueChange: () => undefined,
    fullWidth: true,
    messages: { label: 'Search records', placeholder: 'Search records' },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

/** The clear control exists only when there is something to clear. */
export const WithQuery: Story = { args: { value: 'payroll' } };

export const Interactive: Story = {
  render: (args) => {
    const [query, setQuery] = useState('payroll');
    return <SearchInput {...args} value={query} onValueChange={setQuery} />;
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <SearchInput {...args} value="payroll" size="sm" />
      <SearchInput {...args} value="payroll" size="md" />
      <SearchInput {...args} value="payroll" size="lg" />
    </div>
  ),
};

export const Disabled: Story = { args: { value: 'payroll', isDisabled: true } };

/** Every string is a prop, so the whole control localises. */
export const Localised: Story = {
  args: {
    value: 'Gehalt',
    messages: {
      label: 'Verarbeitungen durchsuchen',
      placeholder: 'Verarbeitungen durchsuchen',
      clear: 'Suche zurücksetzen',
    },
  },
};
