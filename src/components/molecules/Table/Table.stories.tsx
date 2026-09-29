import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar } from '@atoms/Avatar';
import { Badge } from '@atoms/Badge';
import { Card } from '@atoms/Card';
import { Checkbox } from '@atoms/Checkbox';
import { IconButton } from '@atoms/IconButton';
import { Table } from './Table';

const rows = [
  {
    id: 'RPA-001',
    name: 'Payroll processing',
    owner: 'AF',
    dept: 'Finance',
    status: 'Active',
    tone: 'success' as const,
  },
  {
    id: 'RPA-002',
    name: 'CCTV retention',
    owner: 'RK',
    dept: 'Facilities',
    status: 'Review',
    tone: 'warning' as const,
  },
  {
    id: 'RPA-003',
    name: 'Marketing consent',
    owner: 'SM',
    dept: 'Growth',
    status: 'Overdue',
    tone: 'danger' as const,
  },
  {
    id: 'RPA-004',
    name: 'Vendor due diligence',
    owner: 'AF',
    dept: 'Legal',
    status: 'Draft',
    tone: 'neutral' as const,
  },
];

const meta = {
  title: 'Molecules/Table',
  component: Table,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { label: 'Processing records' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const Basic = (args: React.ComponentProps<typeof Table>) => (
  <Table {...args}>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Record</Table.HeaderCell>
        <Table.HeaderCell>Department</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell align="end">Artefacts</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {rows.map((row) => (
        <Table.Row key={row.id}>
          <Table.Cell isTruncated>{row.name}</Table.Cell>
          <Table.Cell>{row.dept}</Table.Cell>
          <Table.Cell>
            <Badge tone={row.tone}>{row.status}</Badge>
          </Table.Cell>
          <Table.Cell align="end" className="font-mono text-xs">
            12
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
);

/** A table almost always sits inside a Card with `size="none"`. */
export const Default: Story = {
  render: (args) => (
    <Card size="none" className="overflow-hidden">
      <Basic {...args} />
    </Card>
  ),
};

export const Density: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Card key={size} size="none" className="overflow-hidden">
          <Basic {...args} size={size} />
        </Card>
      ))}
    </div>
  ),
};

export const VisibleCaption: Story = {
  render: (args) => (
    <Card size="none" className="overflow-hidden">
      <Basic {...args} isLabelVisible />
    </Card>
  ),
};

/** Selection and sort state are attributes, not just colours — see the tests. */
export const SelectionAndSorting: Story = {
  render: (args) => (
    <Card size="none" className="overflow-hidden">
      <Table {...args}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell className="w-10">
              <Checkbox isIndeterminate aria-label="Select all rows" />
            </Table.HeaderCell>
            <Table.HeaderCell sortDirection="ascending">Record</Table.HeaderCell>
            <Table.HeaderCell sortDirection="none">Owner</Table.HeaderCell>
            <Table.HeaderCell className="w-16" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, index) => (
            <Table.Row key={row.id} isSelected={index === 1} isDisabled={index === 3}>
              <Table.Cell>
                <Checkbox defaultChecked={index === 1} aria-label={`Select ${row.name}`} />
              </Table.Cell>
              <Table.Cell isTruncated>{row.name}</Table.Cell>
              <Table.Cell>
                <span className="flex items-center gap-2">
                  <Avatar size="xs" shape="circle" label={row.owner} initials={row.owner} />
                  <span className="text-fg-muted text-xs">{row.dept}</span>
                </span>
              </Table.Cell>
              <Table.Cell align="end">
                <IconButton size="xs" label={`Open ${row.name}`}>
                  <span>›</span>
                </IconButton>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  ),
};

/** Sticky needs a bounded scroll container around the table. */
export const StickyHeader: Story = {
  render: (args) => (
    <Card size="none" className="max-h-64 overflow-auto">
      <Table {...args} isHeaderSticky>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Record</Table.HeaderCell>
            <Table.HeaderCell>Department</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: 20 }, (_, index) => (
            <Table.Row key={index}>
              <Table.Cell isTruncated>{`Processing record ${String(index + 1)}`}</Table.Cell>
              <Table.Cell>Finance</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: (args) => (
    <Card size="none" className="overflow-hidden">
      <Table {...args}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Department</Table.HeaderCell>
            <Table.HeaderCell align="end">Records</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Finance</Table.Cell>
            <Table.Cell align="end" className="font-mono">
              42
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Legal</Table.Cell>
            <Table.Cell align="end" className="font-mono">
              18
            </Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell className="font-semibold">Total</Table.Cell>
            <Table.Cell align="end" className="font-mono font-semibold">
              60
            </Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Card>
  ),
};
