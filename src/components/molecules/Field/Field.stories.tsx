import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '@atoms/Input';
import { Select } from '@atoms/Select';
import { Textarea } from '@atoms/Textarea';
import { Field } from './Field';

const meta = {
  title: 'Molecules/Field',
  component: Field,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    label: 'Purpose of processing',
    children: (control) => (
      <Input {...control} fullWidth placeholder="e.g. Identity verification" />
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = { args: { isRequired: true } };

export const WithDescription: Story = {
  args: { description: 'Shown to the data principal in the consent notice.' },
};

/** The message and the red styling come from the same prop, so they cannot diverge. */
export const Invalid: Story = {
  args: {
    description: 'Shown to the data principal in the consent notice.',
    errorMessage: 'A purpose is required before this record can be published.',
    isRequired: true,
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    children: (control) => <Input {...control} fullWidth isDisabled value="Locked" readOnly />,
  },
};

/** The same wiring drives any control, because the ids are handed over explicitly. */
export const AnyControl: Story = {
  render: (args) => (
    <div className="flex flex-col gap-5">
      <Field {...args} label="Lawful basis">
        {(control) => (
          <Select
            {...control}
            fullWidth
            defaultValue=""
            placeholder="Choose one"
            options={[
              { value: 'consent', label: 'Consent' },
              { value: 'contract', label: 'Performance of a contract' },
            ]}
          />
        )}
      </Field>
      <Field {...args} label="Retention rationale" description="Two or three sentences.">
        {(control) => <Textarea {...control} fullWidth rows={3} />}
      </Field>
    </div>
  ),
};

export const WithEndSlot: Story = {
  args: { endSlot: <span className="text-fg-subtle text-2xs">Optional</span> },
};
