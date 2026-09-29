import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Text } from './Text';

const meta = {
  title: 'Atoms/Text',
  component: Text,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Consent was withdrawn on 14 March 2026.' },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(['2xs', 'xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <Text key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(
        [
          'neutral',
          'muted',
          'subtle',
          'brand',
          'accent',
          'success',
          'warning',
          'danger',
          'info',
        ] as const
      ).map((tone) => (
        <Text key={tone} {...args} tone={tone}>
          {tone}
        </Text>
      ))}
    </div>
  ),
};

export const OnInverseBackground: Story = {
  render: (args) => (
    <div className="bg-bg-inverse rounded-surface flex flex-col gap-2 p-4">
      <Text {...args} tone="inverse">
        Text on a permanently-dark surface — a marketing panel, not the app's dark theme.
      </Text>
    </div>
  ),
};

export const Weights: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(['regular', 'medium', 'semibold', 'bold'] as const).map((weight) => (
        <Text key={weight} {...args} weight={weight} />
      ))}
    </div>
  ),
};

/** Machine values get the mono face so they stop reading as prose. */
export const Mono: Story = {
  args: { isMono: true, size: 'xs', tone: 'muted', children: 'DPDP-2026-00417 · 14:22 IST' },
};

export const Truncated: Story = {
  render: (args) => (
    <div className="border-border-default w-48 border p-2">
      <Text {...args} isTruncated>
        A deliberately long single line that has to be clipped by its container
      </Text>
    </div>
  ),
};
