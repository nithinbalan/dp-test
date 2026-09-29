import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Listbox } from './Listbox';
import type { ListboxOption } from './Listbox.types';

const OPTIONS: ListboxOption[] = [
  { value: 'consent', label: 'Consent' },
  { value: 'contract', label: 'Performance of a contract' },
  { value: 'legal', label: 'Legal obligation' },
  { value: 'legitimate', label: 'Legitimate use', isDisabled: true },
];

const meta = {
  title: 'Molecules/Listbox',
  component: Listbox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Lawful basis',
    options: OPTIONS,
    value: undefined,
    onValueChange: () => undefined,
    placeholder: 'Choose a lawful basis',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Listbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return <Listbox {...args} value={value} onValueChange={setValue} />;
  },
};

export const Selected: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>('consent');
    return <Listbox {...args} value={value} onValueChange={setValue} />;
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Listbox {...args} size="sm" />
      <Listbox {...args} size="md" />
      <Listbox {...args} size="lg" />
    </div>
  ),
};

export const WithError: Story = {
  args: { errorMessage: 'Choose a lawful basis before saving.', isRequired: true },
};

export const EmptyOptions: Story = {
  args: { options: [], emptyOptionsLabel: 'No lawful bases configured yet' },
};
