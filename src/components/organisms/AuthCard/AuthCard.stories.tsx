import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AuthCard } from './AuthCard';

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });
}

const meta = {
  title: 'Organisms/AuthCard',
  component: AuthCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    workspaceDomain: '.jethurdpdp.com',
    workspaceValue: '',
    onWorkspaceValueChange: () => undefined,
    onSignIn: () => delay({}),
    onSendCode: () => delay({}),
    onVerifyCode: () => delay({}),
    onResetPassword: () => delay({}),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [workspaceValue, setWorkspaceValue] = useState('');
    return (
      <AuthCard
        {...args}
        workspaceValue={workspaceValue}
        onWorkspaceValueChange={setWorkspaceValue}
      />
    );
  },
};

export const SignInFails: Story = {
  render: (args) => {
    const [workspaceValue, setWorkspaceValue] = useState('');
    return (
      <AuthCard
        {...args}
        workspaceValue={workspaceValue}
        onWorkspaceValueChange={setWorkspaceValue}
        onSignIn={() => delay({ errorMessage: 'Those credentials did not match.' })}
      />
    );
  },
};

export const WithWorkspacePreset: Story = {
  render: (args) => {
    const [workspaceValue, setWorkspaceValue] = useState('yourco');
    return (
      <AuthCard
        {...args}
        workspaceValue={workspaceValue}
        onWorkspaceValueChange={setWorkspaceValue}
      />
    );
  },
};
