import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

/**
 * Stories are the source of visual truth (docs/DESIGN_SYSTEM.md §6): they are what
 * the visual-regression diff runs against and what generators read as examples.
 * Required coverage: default, every variant, every state, long content.
 */
const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'Continue' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'link'] as const;
const TONES = ['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

/** The full grid. Every cell here is a token pair the contrast gate has checked. */
export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {TONES.map((tone) => (
            <Button key={tone} {...args} variant={variant} tone={tone}>
              {tone}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Button {...args} size="xs" />
      <Button {...args} size="sm" />
      <Button {...args} size="md" />
      <Button {...args} size="lg" />
      <Button {...args} size="xl" />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      <div className="flex gap-4">
        <Button {...args} tone="brand" isLoading />
        <Button {...args} tone="brand" isDisabled />
      </div>
      <Button {...args} tone="brand" fullWidth />
    </div>
  ),
};

/** Slots are ordered logically, so the arrow lands on the trailing edge in Arabic too. */
export const WithSlots: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <Button {...args} tone="brand" startSlot={<span aria-hidden>＋</span>} />
      <Button {...args} tone="brand" endSlot={<span aria-hidden>→</span>} />
    </div>
  ),
};

export const LongContent: Story = {
  args: { children: 'A deliberately long label that tests wrapping and truncation behaviour' },
};

/** `asChild` renders the child element (typically a router Link) styled as this button, instead of a nested `<button>`. */
export const AsChildLink: Story = {
  render: (args) => (
    <Button {...args} asChild tone="brand">
      <a href="#continue">Continue</a>
    </Button>
  ),
};
