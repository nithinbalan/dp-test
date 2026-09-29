import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PeoplePicker } from './PeoplePicker';

const PEOPLE = [
  { id: 'p1', name: 'Priya Krishnan', initials: 'PK', detail: 'COO' },
  { id: 'p2', name: 'Arjun Mehta', initials: 'AM', detail: 'Data Protection Lead' },
  { id: 'p3', name: 'Fatima Sheikh', initials: 'FS', detail: 'Engineering Manager' },
];

const GROUPED_PEOPLE = [
  {
    id: 'p1',
    name: 'Priya Krishnan',
    initials: 'PK',
    detail: 'COO · Management',
    group: 'Management',
  },
  {
    id: 'p2',
    name: 'Arjun Mehta',
    initials: 'AM',
    detail: 'Data Protection Lead · Development',
    group: 'Development',
  },
  {
    id: 'p3',
    name: 'Fatima Sheikh',
    initials: 'FS',
    detail: 'Engineering Manager · Development',
    group: 'Development',
  },
  {
    id: 'p4',
    name: 'Rohan Nair',
    initials: 'RN',
    detail: 'ML Engineer · Artificial Intelligence',
    group: 'Artificial Intelligence',
  },
];

const meta = {
  title: 'Molecules/PeoplePicker',
  component: PeoplePicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Owner',
    people: PEOPLE,
    value: undefined,
    onValueChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PeoplePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return <PeoplePicker {...args} value={value} onValueChange={setValue} />;
  },
};

export const Selected: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>('p2');
    return <PeoplePicker {...args} value={value} onValueChange={setValue} />;
  },
};

export const WithError: Story = {
  args: { errorMessage: 'Choose an owner before saving.', isRequired: true },
};

export const TriggerVariant: Story = {
  args: {
    label: 'Data Protection Officer',
    people: GROUPED_PEOPLE,
    variant: 'trigger',
    employeeRegisterHref: '/employees',
  },
  render: (args) => {
    const [value, setValue] = useState<string | undefined>('p1');
    return <PeoplePicker {...args} value={value} onValueChange={setValue} />;
  },
};
