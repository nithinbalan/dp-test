import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Switch } from './Switch';

const meta = {
  title: 'Atoms/Switch',
  component: Switch,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Notify the DPO on every new grievance' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = { args: { isSelected: true } };

export const Interactive: Story = {
  render: (args) => {
    const [on, setOn] = useState(false);
    return <Switch {...args} isSelected={on} onValueChange={setOn} />;
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Switch {...args} size="sm" isSelected />
      <Switch {...args} size="md" isSelected />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['brand', 'accent', 'success', 'danger'] as const).map((tone) => (
        <Switch key={tone} {...args} tone={tone} isSelected>
          {tone}
        </Switch>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Switch {...args} isDisabled />
      <Switch {...args} isDisabled isSelected />
    </div>
  ),
};

/** No caption: supply an `aria-label`, or the switch has no accessible name. */
export const TrackOnly: Story = {
  args: { children: undefined, isSelected: true, 'aria-label': 'Enable notifications' },
};
