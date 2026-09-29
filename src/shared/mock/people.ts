/**
 * MOCK DATA — see the note in `workspace.ts`. A shared org roster used
 * wherever a person needs to be assigned or listed — RoPA/DPIA/Risk owners,
 * Endpoints, Academy, Actions. One roster, not one per module, so the same
 * person shows up consistently everywhere.
 *
 * The Employees page (`(app)/employees/`) no longer reads from here — it is
 * wired to the real `employee` table via `/api/employees` (see
 * `src/app/api/employees/`), the same table Settings' DPO picker already
 * sources its roster from. This file still backs every other consumer above
 * until each of those gets its own real data source.
 */

export type Person = {
  id: string;
  name: string;
  initials: string;
  department: string;
  role: string;
  email: string;
};

const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'HR',
  'Sales',
  'Support',
  'Marketing',
  'Operations',
  'Legal',
] as const;

const FIRST_NAMES = [
  'Priya',
  'Arjun',
  'Fatima',
  'Rohan',
  'Ananya',
  'Vikram',
  'Sneha',
  'Karthik',
  'Divya',
  'Aditya',
  'Meera',
  'Rajesh',
  'Pooja',
  'Sanjay',
  'Kavya',
  'Nikhil',
  'Ishita',
  'Varun',
  'Riya',
  'Aman',
  'Neha',
  'Suresh',
  'Anjali',
  'Kiran',
  'Deepa',
  'Manoj',
  'Swati',
  'Rahul',
  'Preeti',
  'Vivek',
  'Shreya',
  'Ashok',
  'Nisha',
  'Gaurav',
  'Lakshmi',
  'Harish',
  'Radha',
  'Naveen',
  'Sunita',
  'Prakash',
  'Geeta',
  'Ravi',
  'Anita',
  'Mohan',
  'Kavita',
];

const LAST_NAMES = [
  'Krishnan',
  'Mehta',
  'Sheikh',
  'Nair',
  'Rao',
  'Iyer',
  'Sharma',
  'Reddy',
  'Gupta',
  'Kapoor',
  'Joshi',
  'Verma',
  'Singh',
  'Kumar',
  'Menon',
  'Pillai',
  'Chatterjee',
  'Bose',
  'Malhotra',
  'Bhatia',
];

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function buildRoster(): Person[] {
  return FIRST_NAMES.map((first, i) => {
    const last = LAST_NAMES[i % LAST_NAMES.length] ?? 'Kumar';
    const department = DEPARTMENTS[i % DEPARTMENTS.length] ?? 'Operations';
    const name = `${first} ${last}`;
    return {
      id: `person-${String(i + 1)}`,
      name,
      initials: initialsOf(name),
      department,
      role: `${department} associate`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@yourco.com`,
    };
  });
}

/**
 * Named ahead of the generated roster so it always sorts first in a picker —
 * the default Data Protection Officer / contact person Configuration Studio
 * ships with, matching the prototype's default mock data.
 */
const DPO_PERSON: Person = {
  id: 'person-dpo',
  name: 'Muhammed Shihabuddeen F',
  initials: 'MF',
  department: 'Management',
  role: 'Chief Technical Officer',
  email: 'muhammed.shihabuddeen@yourco.com',
};

export const PEOPLE: Person[] = [DPO_PERSON, ...buildRoster()];

export function getPerson(id: string): Person | undefined {
  return PEOPLE.find((person) => person.id === id);
}
