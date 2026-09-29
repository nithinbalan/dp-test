import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { Dialog } from './Dialog';

const meta = {
  title: 'Organisms/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    isOpen: false,
    onClose: () => undefined,
    label: 'Add a dataset by hand',
    description: 'For a store that a connector cannot reach yet.',
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(args: Partial<React.ComponentProps<typeof Dialog>>) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open dialog
      </Button>
      <Dialog
        {...args}
        label={args.label ?? 'Add a dataset by hand'}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <Text size="sm">Dialog body content goes here.</Text>
      </Dialog>
    </>
  );
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
};

export const WithFooter: Story = {
  render: (args) => (
    <Controlled {...args} footerSlot={<Button tone="brand">Add to Data Map</Button>} />
  ),
};

export const Small: Story = {
  render: (args) => <Controlled {...args} size="sm" description={undefined} />,
};
