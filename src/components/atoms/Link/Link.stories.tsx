import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Link } from './Link';

const meta = {
  title: 'Atoms/Link',
  component: Link,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { children: 'View the consent record', href: '#' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Underline: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <Link {...args} underline="always" />
      <Link {...args} underline="hover" />
      <Link {...args} underline="none" />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      {(['brand', 'accent', 'neutral', 'muted', 'danger'] as const).map((tone) => (
        <Link key={tone} {...args} tone={tone}>
          {tone}
        </Link>
      ))}
    </div>
  ),
};

/** The new tab is announced, and `rel` closes the `window.opener` hole. */
export const External: Story = {
  args: { isExternal: true, href: 'https://example.gov.in', endSlot: <span aria-hidden>↗</span> },
};

export const InAParagraph: Story = {
  render: (args) => (
    <p className="text-fg-muted max-w-md text-sm">
      {'Personal data was shared with three processors. '}
      <Link {...args} size="sm" />
      {' for the full list.'}
    </p>
  ),
};
