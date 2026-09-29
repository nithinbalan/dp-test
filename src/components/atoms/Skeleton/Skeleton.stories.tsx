import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { className: 'h-4 w-48' } };

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton shape="circle" className="size-10" />
      <Skeleton shape="rounded" className="h-10 w-24" />
      <Skeleton shape="square" className="size-10" />
    </div>
  ),
};

/** A ragged last line is what makes a block read as a paragraph. */
export const Paragraph: Story = { args: { lines: 3, className: 'w-80' } };

export const Static: Story = { args: { isAnimated: false, className: 'h-4 w-48' } };

/**
 * The realistic use: a skeleton that matches the real row exactly, so nothing
 * shifts when the data lands.
 */
export const MatchingATableRow: Story = {
  render: () => (
    <div className="border-border-default bg-bg-surface rounded-surface w-full max-w-xl border">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="border-border-default flex items-center gap-4 border-b p-4 last:border-b-0"
        >
          <Skeleton shape="circle" className="size-8" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton shape="circle" className="h-6 w-16" />
        </div>
      ))}
    </div>
  ),
};
