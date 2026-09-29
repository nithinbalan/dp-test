import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from '@atoms/Card';
import { Stepper } from './Stepper';

const steps = [
  { value: 'scope', label: 'Scope', description: 'Which departments are in scope' },
  { value: 'data', label: 'Data map', description: 'What personal data you hold' },
  { value: 'basis', label: 'Lawful basis', description: 'Why you may hold it' },
  { value: 'notice', label: 'Notice', description: 'What you tell data principals' },
  { value: 'publish', label: 'Publish', description: 'Make the notice live' },
];

const meta = {
  title: 'Molecules/Stepper',
  component: Stepper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { steps, activeIndex: 2 },
  decorators: [
    (Story) => (
      <div className="w-[44rem] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = {
  render: (args) => (
    <div className="w-72">
      <Stepper {...args} orientation="vertical" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Stepper {...args} size="sm" />
      <Stepper {...args} size="md" />
    </div>
  ),
};

export const AtTheStart: Story = { args: { activeIndex: 0 } };
export const AtTheEnd: Story = { args: { activeIndex: steps.length - 1 } };

/** Completed steps become buttons. Steps ahead never do. */
export const Navigable: Story = {
  render: (args) => {
    const [index, setIndex] = useState(3);
    return (
      <Card>
        <Stepper
          {...args}
          activeIndex={index}
          onValueChange={(value) => {
            setIndex(steps.findIndex((step) => step.value === value));
          }}
        />
      </Card>
    );
  },
};

export const Localised: Story = {
  args: {
    messages: { label: 'Fortschritt', completed: 'abgeschlossen', current: 'aktueller Schritt' },
  },
};
