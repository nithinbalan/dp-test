import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Molecules/ThemeToggle',
  component: ThemeToggle,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <ThemeToggle {...args} size="sm" />
      <ThemeToggle {...args} size="md" />
      <ThemeToggle {...args} size="lg" />
    </div>
  ),
};

/** Every semantic role, so a theme change can be reviewed at a glance. */
export const TokensInBothThemes: Story = {
  render: () => (
    <div className="rounded-surface bg-bg-surface flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="text-fg-muted text-sm">Toggle to check both themes</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['brand', 'success', 'warning', 'danger', 'info'] as const).map((tone) => (
          <span
            key={tone}
            className={`rounded-control px-3 py-1 text-sm bg-${tone}-subtle text-${tone}-fg`}
          >
            {tone}
          </span>
        ))}
      </div>
      <p className="text-fg-default">Default foreground on surface</p>
      <p className="text-fg-muted">Muted foreground</p>
      <p className="text-fg-subtle">Subtle foreground</p>
    </div>
  ),
};
