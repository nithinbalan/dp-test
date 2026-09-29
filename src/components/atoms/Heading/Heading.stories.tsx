import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading } from './Heading';

const meta = {
  title: 'Atoms/Heading',
  component: Heading,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'Processing activities' },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Each level ships with the size that suits its usual position in a page. */
export const Levels: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} {...args} level={level}>
          {`Level ${String(level)}`}
        </Heading>
      ))}
    </div>
  ),
};

/**
 * Size is independent of level: this stays an `<h2>` in the document outline
 * while looking like a small label.
 */
export const SizeIndependentOfLevel: Story = {
  args: { level: 2, size: 'sm' },
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      {(['neutral', 'muted', 'brand', 'accent', 'danger'] as const).map((tone) => (
        <Heading key={tone} {...args} level={3} tone={tone}>
          {tone}
        </Heading>
      ))}
    </div>
  ),
};

export const OnInverseBackground: Story = {
  render: (args) => (
    <div className="bg-bg-inverse rounded-surface p-4">
      <Heading {...args} level={3} tone="inverse">
        Heading on a permanently-dark surface
      </Heading>
    </div>
  ),
};

export const LongContent: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Heading {...args} level={1}>
        Verzeichnis von Verarbeitungstätigkeiten und Einwilligungsnachweisen
      </Heading>
    </div>
  ),
};
