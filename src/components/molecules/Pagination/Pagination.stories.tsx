import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'Molecules/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { page: 1, pageCount: 8, onValueChange: () => undefined },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [page, setPage] = useState(4);
    return <Pagination {...args} page={page} pageCount={24} onValueChange={setPage} />;
  },
};

/** A thousand pages emit a windowed range, not a thousand controls. */
export const ManyPages: Story = { args: { page: 500, pageCount: 1000 } };

export const AtTheEnds: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Pagination {...args} page={1} pageCount={24} />
      <Pagination {...args} page={24} pageCount={24} />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Pagination {...args} page={4} pageCount={24} size="sm" />
      <Pagination {...args} page={4} pageCount={24} size="md" />
    </div>
  ),
};

export const Disabled: Story = { args: { page: 4, pageCount: 24, isDisabled: true } };

/** One page needs no navigation, so nothing renders at all. */
export const SinglePage: Story = { args: { pageCount: 1 } };

export const Localised: Story = {
  args: {
    page: 3,
    pageCount: 12,
    messages: {
      label: 'Seitennavigation',
      previous: 'Vorherige Seite',
      next: 'Nächste Seite',
      page: 'Seite {page}',
      currentPage: 'Seite {page}, aktuelle Seite',
    },
  },
};
