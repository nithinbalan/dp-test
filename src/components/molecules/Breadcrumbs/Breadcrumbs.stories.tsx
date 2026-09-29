import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'Acme Retail', href: '#' },
  { label: 'Processing records', href: '#' },
  { label: 'Payroll processing' },
];

const meta = {
  title: 'Molecules/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { items },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Breadcrumbs {...args} size="2xs" />
      <Breadcrumbs {...args} size="xs" />
      <Breadcrumbs {...args} size="sm" />
    </div>
  ),
};

export const CustomSeparator: Story = { args: { separator: <span>/</span> } };

export const TwoLevels: Story = {
  args: { items: [{ label: 'Acme Retail', href: '#' }, { label: 'Settings' }] },
};

/** German runs long; the trail wraps rather than pushing the page sideways. */
export const LongContent: Story = {
  render: (args) => (
    <div className="w-72">
      <Breadcrumbs
        {...args}
        items={[
          { label: 'Acme Einzelhandel GmbH', href: '#' },
          { label: 'Verzeichnis von Verarbeitungstätigkeiten', href: '#' },
          { label: 'Gehaltsabrechnung' },
        ]}
      />
    </div>
  ),
};

export const Localised: Story = {
  args: {
    label: 'Brotkrumennavigation',
    items: [{ label: 'Acme Einzelhandel', href: '#' }, { label: 'Einstellungen' }],
  },
};
