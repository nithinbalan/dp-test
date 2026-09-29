'use client';

/** Owns reminder-sending state for the populated DPDP Awareness view. */
import { Bell } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { IconButton } from '@atoms/IconButton';
import { Progress } from '@atoms/Progress';
import { Text } from '@atoms/Text';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import { Table } from '@molecules/Table';
import { useToast } from '@shared/hooks';
import type { Course } from '@shared/mock/academy';
import type { AcademyMessages } from './AcademyMessages';

type CourseRow = Course & { completed: number; total: number; percent: number };

function CoursesTable({
  t,
  rows,
  onRemind,
}: {
  t: AcademyMessages;
  rows: readonly CourseRow[];
  onRemind: (course: CourseRow) => void;
}) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableCourse}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableAudience}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableDuration}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableRequired}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableCompletion}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((course) => (
          <Table.Row key={course.id}>
            <Table.Cell isTruncated>
              <Text as="span" weight="medium">
                {course.title}
              </Text>
            </Table.Cell>
            <Table.Cell>{course.audience}</Table.Cell>
            <Table.Cell isNowrap>
              <Text as="span" size="xs" tone="muted">
                {t.durationLabel.replace('{minutes}', String(course.durationMinutes))}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={course.isRequired ? 'brand' : 'neutral'} variant="outline">
                {course.isRequired ? t.requiredYes : t.requiredNo}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <div className="flex items-center gap-2">
                <Progress
                  value={course.percent}
                  label={t.tableCompletion}
                  tone={
                    course.percent >= 80 ? 'success' : course.percent >= 40 ? 'warning' : 'danger'
                  }
                  className="w-24"
                />
                <Text as="span" size="xs" tone="muted" isMono>
                  {course.percent}%
                </Text>
              </div>
            </Table.Cell>
            <Table.Cell align="end">
              <IconButton
                label={t.reminderLabel}
                variant="ghost"
                size="sm"
                isDisabled={course.completed === course.total}
                onClick={() => {
                  onRemind(course);
                }}
              >
                <Bell className="size-4" />
              </IconButton>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export function AcademyList({
  courses,
  pageLabel,
  pageRefTag,
  pageDescription,
  avgCompletion,
  overdueCount,
  requiredCount,
  t,
}: {
  courses: readonly CourseRow[];
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  avgCompletion: number;
  overdueCount: number;
  requiredCount: number;
  t: AcademyMessages;
}) {
  const toast = useToast();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        label={pageLabel}
        refTag={pageRefTag}
        description={pageDescription}
        actionSlot={
          <Button
            variant="outline"
            onClick={() => {
              toast.show({ label: t.toastCampaignSent, tone: 'success' });
            }}
          >
            {t.campaignCta}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.kpiCourses} value={courses.length} />
        <StatCard label={t.kpiAvgCompletion} value={`${String(avgCompletion)}%`} tone="brand" />
        <StatCard label={t.kpiOverdue} value={overdueCount} tone="danger" />
        <StatCard label={t.kpiRequired} value={requiredCount} tone="warning" />
      </div>

      <CoursesTable
        t={t}
        rows={courses}
        onRemind={(course) => {
          const missing = course.total - course.completed;
          toast.show({
            label: t.toastReminderSent
              .replace('{count}', String(missing))
              .replace('{title}', course.title),
            tone: 'success',
          });
        }}
      />
    </div>
  );
}
