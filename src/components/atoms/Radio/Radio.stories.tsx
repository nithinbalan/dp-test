import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Radio } from './Radio';

const meta = {
  title: 'Atoms/Radio',
  component: Radio,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { name: 'basis', children: 'Consent' },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { defaultChecked: true } };

/**
 * The realistic use. Arrow keys move between these because they share a `name` —
 * behaviour the browser gives us and a custom widget would have to rebuild.
 */
export const Group: Story = {
  render: (args) => (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-fg-muted mb-2 text-xs">Lawful basis</legend>
      <Radio {...args} value="consent" defaultChecked>
        Consent
      </Radio>
      <Radio {...args} value="contract">
        Performance of a contract
      </Radio>
      <Radio {...args} value="legal">
        Legal obligation
      </Radio>
    </fieldset>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Radio {...args} name="sm" size="sm" defaultChecked />
      <Radio {...args} name="md" size="md" defaultChecked />
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Radio {...args} name="t1" tone="brand" defaultChecked />
      <Radio {...args} name="t2" tone="accent" defaultChecked />
      <Radio {...args} name="t3" tone="danger" defaultChecked />
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Radio {...args} name="s1" isInvalid />
      <Radio {...args} name="s2" isDisabled />
      <Radio {...args} name="s3" isDisabled defaultChecked />
    </div>
  ),
};
