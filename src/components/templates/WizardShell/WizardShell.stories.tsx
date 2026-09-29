import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { Stepper } from '@molecules/Stepper';
import { WizardShell } from './WizardShell';

const STEPS = [
  { value: 'connector', label: 'Choose connector' },
  { value: 'credentials', label: 'Connect' },
  { value: 'scan', label: 'Scan settings' },
  { value: 'review', label: 'Review' },
];

const meta = {
  title: 'Templates/WizardShell',
  component: WizardShell,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    stepperSlot: <Stepper steps={STEPS} activeIndex={1} />,
    children: <Text>Step content goes here.</Text>,
    footerSlot: (
      <>
        <Button variant="outline">Back</Button>
        <Button tone="brand">Next</Button>
      </>
    ),
  },
} satisfies Meta<typeof WizardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
