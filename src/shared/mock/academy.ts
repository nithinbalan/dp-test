/**
 * MOCK DATA — see the note in `workspace.ts`. The DPDP Awareness course
 * library. Per-person completion is approximated from `devices.ts`'s
 * `awarenessStatus` flag, joined against the course's target department.
 */
import { getDeviceFor } from './devices';
import { PEOPLE } from './people';

export type Course = {
  id: string;
  title: string;
  description: string;
  audience: string;
  durationMinutes: number;
  isRequired: boolean;
};

export const COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'DPDP Fundamentals',
    description: 'What the Act requires and how it shows up in daily work.',
    audience: 'All employees',
    durationMinutes: 25,
    isRequired: true,
  },
  {
    id: 'course-2',
    title: 'DSR Handling v2',
    description: 'Recognising and routing a data principal rights request.',
    audience: 'Support',
    durationMinutes: 20,
    isRequired: true,
  },
  {
    id: 'course-3',
    title: 'Personal Data in Logs',
    description: 'Keeping identifiers out of application and error logs.',
    audience: 'Engineering',
    durationMinutes: 15,
    isRequired: true,
  },
  {
    id: 'course-4',
    title: 'Children & Verifiable Consent',
    description: 'Age assurance and guardian consent under section 9.',
    audience: 'Marketing',
    durationMinutes: 18,
    isRequired: false,
  },
];

export function courseAudienceCount(course: Course): number {
  return course.audience === 'All employees'
    ? PEOPLE.length
    : PEOPLE.filter((person) => person.department === course.audience).length;
}

export function courseCompletion(course: Course): {
  completed: number;
  total: number;
  percent: number;
} {
  const targetPeople =
    course.audience === 'All employees'
      ? PEOPLE
      : PEOPLE.filter((person) => person.department === course.audience);
  const completed = targetPeople.filter(
    (person) => getDeviceFor(person.id)?.awarenessStatus === 'certified',
  ).length;
  const total = targetPeople.length;
  return { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export function getCourse(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}
