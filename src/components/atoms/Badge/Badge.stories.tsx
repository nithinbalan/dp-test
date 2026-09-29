import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'Active' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const TONES = ['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['solid', 'soft', 'outline'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} {...args} variant={variant} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Badge {...args} size="xs" />
      <Badge {...args} size="sm" />
      <Badge {...args} size="md" />
    </div>
  ),
};

/** The dot carries the state for anyone who cannot separate the tones by colour. */
export const WithStatusDot: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Badge
        {...args}
        tone="success"
        startSlot={<span aria-hidden className="bg-success-solid rounded-pill size-1.5" />}
      >
        Resolved
      </Badge>
      <Badge
        {...args}
        tone="danger"
        startSlot={<span aria-hidden className="bg-danger-solid rounded-pill size-1.5" />}
      >
        Overdue
      </Badge>
    </div>
  ),
};

/** German runs ~30% longer than English; a badge must not wrap when it does. */
export const LongContent: Story = {
  render: (args) => (
    <div className="flex w-64 gap-2">
      <Badge {...args} tone="warning">
        Datenschutz-Folgenabschätzung
      </Badge>
    </div>
  ),
};
