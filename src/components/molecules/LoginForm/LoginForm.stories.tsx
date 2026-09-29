import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LoginForm } from './LoginForm';

const meta = {
  title: 'Molecules/LoginForm',
  component: LoginForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { isLoading: true },
};

export const WithError: Story = {
  args: { errorMessage: 'Invalid email or password. Please try again.' },
};

export const ForgotPasswordAsAction: Story = {
  args: { onForgotPasswordClick: () => undefined },
};
