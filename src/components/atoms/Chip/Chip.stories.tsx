import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chip } from './Chip';

const meta = {
  title: 'Atoms/Chip',
  component: Chip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'Overdue' },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

const TONES = ['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const;

export const Default: Story = {};

export const Selected: Story = { args: { isSelected: true, tone: 'brand' } };

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => (
          <Chip key={tone} {...args} tone={tone}>
            {tone}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TONES.map((tone) => (
          <Chip key={tone} {...args} tone={tone} isSelected>
            {tone}
          </Chip>
        ))}
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex gap-3">
      <Chip {...args} variant="outline" />
      <Chip {...args} variant="ghost" />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Chip {...args} size="sm" />
      <Chip {...args} size="md" />
    </div>
  ),
};

/** The realistic use: a filter bar where the counts live in the trailing slot. */
export const FilterBar: Story = {
  render: () => {
    const facets = [
      { id: 'open', label: 'Open', count: 12, tone: 'danger' as const },
      { id: 'review', label: 'In review', count: 4, tone: 'warning' as const },
      { id: 'resolved', label: 'Resolved', count: 87, tone: 'success' as const },
    ];
    const [on, setOn] = useState<string[]>(['open']);

    return (
      <div className="flex flex-wrap gap-2">
        {facets.map((facet) => (
          <Chip
            key={facet.id}
            tone={facet.tone}
            isSelected={on.includes(facet.id)}
            onValueChange={(next) => {
              setOn((prev) => (next ? [...prev, facet.id] : prev.filter((id) => id !== facet.id)));
            }}
            endSlot={<span className="text-2xs font-mono opacity-70">{facet.count}</span>}
          >
            {facet.label}
          </Chip>
        ))}
      </div>
    );
  },
};

export const Disabled: Story = { args: { isDisabled: true } };
