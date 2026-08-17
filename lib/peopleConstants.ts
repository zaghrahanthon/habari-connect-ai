export const PEOPLE_DEPARTMENTS = [
  "Editorial",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
  "Production",
  "Design",
  "Digital",
  "Technology / IT",
  "Management",
  "Operations",
  "Other",
] as const;

export const PEOPLE_OFFICES = [
  "Cape Town",
  "Johannesburg",
  "Remote",
  "Other",
] as const;

export type PeopleDepartment = (typeof PEOPLE_DEPARTMENTS)[number];
export type PeopleOffice = (typeof PEOPLE_OFFICES)[number];
