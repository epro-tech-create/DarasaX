/**
 * Hardcoded modules a lecturer can claim during onboarding.
 * Keep in sync with `modules` ids in mock.ts so uploads/topics resolve.
 */
export const LECTURER_MODULE_OPTIONS = [
  { id: "mod-numerical", code: "GSU 07516", name: "Numerical methods and matrices" },
  { id: "mod-sensor-networks", code: "ETU 07523", name: "Sensor networks" },
  { id: "mod-cyber", code: "COU 07501", name: "Cyber security" },
  {
    id: "mod-db-admin",
    code: "COU 07502",
    name: "Database programming and Administration",
  },
  { id: "mod-web", code: "COU 07503", name: "Web Application Development" },
  { id: "mod-dsa", code: "COU 07504", name: "Data structure and Algorithms" },
  { id: "mod-se", code: "COU 07505", name: "Software Engineering" },
  { id: "mod-dsp", code: "COU 07506", name: "Digital Signal Processing" },
  {
    id: "mod-electrical",
    code: "EEU 07518",
    name: "Principles of Electrical Machine",
  },
  {
    id: "mod-hci",
    code: "COU 07507",
    name: "Human computer interface and Interactive Devices Design",
  },
  {
    id: "mod-electronics",
    code: "ETU 07508",
    name: "Electronics design and digital fabrication",
  },
] as const;

export type LecturerModuleOptionId =
  (typeof LECTURER_MODULE_OPTIONS)[number]["id"];

export type StreamCountChoice = 1 | 2 | "more";
