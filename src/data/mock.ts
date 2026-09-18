import type {
  AIConversation,
  Announcement,
  Assignment,
  Institution,
  MissedDaySummary,
  Module,
  NotificationItem,
  PastPaper,
  Programme,
  Resource,
  StudySession,
  TimetableEntry,
  Topic,
  UpdateFeedItem,
  User,
} from "@/types";

export const institution: Institution = {
  id: "dit",
  name: "Dar es Salaam Institute of Technology",
  shortName: "DIT",
};

export const programme: Programme = {
  id: "bce",
  name: "Bachelor of Computer Engineering",
  institutionId: "dit",
};

export const institutions: Institution[] = [
  institution,
  {
    id: "udsm",
    name: "University of Dar es Salaam",
    shortName: "UDSM",
  },
  {
    id: "mzumbe",
    name: "Mzumbe University",
    shortName: "MU",
  },
  {
    id: "aru",
    name: "Ardhi University",
    shortName: "ARU",
  },
];

export const programmes: Programme[] = [
  programme,
  {
    id: "bse",
    name: "Bachelor of Software Engineering",
    institutionId: "dit",
  },
  {
    id: "bee",
    name: "Bachelor of Electrical Engineering",
    institutionId: "dit",
  },
  {
    id: "bcs",
    name: "Bachelor of Computer Science",
    institutionId: "udsm",
  },
];

export const currentUser: User = {
  id: "user-1",
  name: "Ezekiel",
  email: "ezekiel@student.dit.ac.tz",
  institutionId: "dit",
  programmeId: "bce",
  year: 3,
  semester: 1,
  className: "COE Year 3A",
  studyStreak: 5,
  modulesJoined: 11,
  resourcesViewed: 48,
};

export const modules: Module[] = [
  {
    id: "mod-numerical",
    name: "Numerical methods and matrices",
    code: "GSU 07516",
    description:
      "Numerical techniques, matrix algebra, and computational methods for engineering problems.",
    lecturer: "Dr. Grace Kimaro",
    semester: 1,
    year: 3,
    category: "fundamentals",
    credits: 6,
    accent: "#64748b",
    progress: 38,
    icon: "Calculator",
    topicsCompleted: 2,
    topicsTotal: 8,
    notesCount: 5,
    assignmentsCount: 1,
    pastPapersCount: 2,
  },
  {
    id: "mod-sensor-networks",
    name: "Sensor networks",
    code: "ETU 07523",
    description:
      "Wireless sensor networks, sensing nodes, routing, data aggregation, and IoT applications.",
    lecturer: "Dr. John Smith",
    semester: 1,
    year: 3,
    category: "fundamentals",
    credits: 9,
    accent: "#1E88E5",
    progress: 72,
    icon: "Network",
    topicsCompleted: 6,
    topicsTotal: 10,
    notesCount: 12,
    assignmentsCount: 3,
    pastPapersCount: 5,
  },
  {
    id: "mod-cyber",
    name: "Cyber security",
    code: "COU 07501",
    description:
      "Threats, cryptography basics, network security, secure coding, and incident response.",
    lecturer: "Eng. Sarah Nkomo",
    semester: 1,
    year: 3,
    category: "core",
    credits: 9,
    accent: "#EF4444",
    progress: 45,
    icon: "Shield",
    topicsCompleted: 3,
    topicsTotal: 9,
    notesCount: 8,
    assignmentsCount: 2,
    pastPapersCount: 3,
  },
  {
    id: "mod-db-admin",
    name: "Database programming and Administration",
    code: "COU 07502",
    description:
      "Advanced SQL, database programming, administration, backup, recovery, and performance tuning.",
    lecturer: "Prof. Amina Hassan",
    semester: 1,
    year: 3,
    category: "core",
    credits: 9,
    accent: "#4FC3F7",
    progress: 54,
    icon: "Database",
    topicsCompleted: 5,
    topicsTotal: 9,
    notesCount: 10,
    assignmentsCount: 2,
    pastPapersCount: 4,
  },
  {
    id: "mod-web",
    name: "Web Application Development",
    code: "COU 07503",
    description:
      "Modern web architectures, frontend and backend development, APIs, and deployment.",
    lecturer: "Mr. David Okello",
    semester: 1,
    year: 3,
    category: "core",
    credits: 9,
    accent: "#7C4DFF",
    progress: 60,
    icon: "Globe",
    topicsCompleted: 4,
    topicsTotal: 10,
    notesCount: 11,
    assignmentsCount: 2,
    pastPapersCount: 3,
  },
  {
    id: "mod-dsa",
    name: "Data structure and Algorithms",
    code: "COU 07504",
    description:
      "Core data structures, algorithm design, complexity analysis, and problem-solving techniques.",
    lecturer: "Dr. Peter Mwangi",
    semester: 1,
    year: 3,
    category: "core",
    credits: 9,
    accent: "#F59E0B",
    progress: 61,
    icon: "Binary",
    topicsCompleted: 5,
    topicsTotal: 10,
    notesCount: 9,
    assignmentsCount: 2,
    pastPapersCount: 3,
  },
  {
    id: "mod-se",
    name: "Software Engineering",
    code: "COU 07505",
    description:
      "Software development lifecycles, requirements, design patterns, testing, and agile practices.",
    lecturer: "Mr. David Okello",
    semester: 1,
    year: 3,
    category: "core",
    credits: 9,
    accent: "#22C55E",
    progress: 67,
    icon: "Code2",
    topicsCompleted: 6,
    topicsTotal: 9,
    notesCount: 14,
    assignmentsCount: 3,
    pastPapersCount: 2,
  },
  {
    id: "mod-dsp",
    name: "Digital Signal Processing",
    code: "COU 07506",
    description:
      "Discrete-time signals, transforms, filtering, and DSP applications in engineering systems.",
    lecturer: "Dr. Fatima Juma",
    semester: 1,
    year: 3,
    category: "core",
    credits: 6,
    accent: "#EC4899",
    progress: 40,
    icon: "AudioWaveform",
    topicsCompleted: 3,
    topicsTotal: 8,
    notesCount: 6,
    assignmentsCount: 1,
    pastPapersCount: 2,
  },
  {
    id: "mod-electrical",
    name: "Principles of Electrical Machine",
    code: "EEU 07518",
    description:
      "Operating principles of transformers, DC and AC machines, and electromechanical energy conversion.",
    lecturer: "Eng. James Mwita",
    semester: 1,
    year: 3,
    category: "elective",
    credits: 6,
    accent: "#0EA5E9",
    progress: 28,
    icon: "Cpu",
    topicsCompleted: 2,
    topicsTotal: 7,
    notesCount: 4,
    assignmentsCount: 1,
    pastPapersCount: 1,
  },
  {
    id: "mod-hci",
    name: "Human computer interface and Interactive Devices Design",
    code: "COU 07507",
    description:
      "HCI principles, usability, interaction design, and interactive device prototyping.",
    lecturer: "Dr. Fatima Juma",
    semester: 1,
    year: 3,
    category: "elective",
    credits: 6,
    accent: "#A855F7",
    progress: 43,
    icon: "Monitor",
    topicsCompleted: 3,
    topicsTotal: 8,
    notesCount: 7,
    assignmentsCount: 1,
    pastPapersCount: 2,
  },
  {
    id: "mod-electronics",
    name: "Electronics design and digital fabrication",
    code: "ETU 07508",
    description:
      "Electronic circuit design, PCB workflows, prototyping, and digital fabrication techniques.",
    lecturer: "Eng. Sarah Nkomo",
    semester: 1,
    year: 3,
    category: "elective",
    credits: 6,
    accent: "#A3E635",
    progress: 81,
    icon: "CircuitBoard",
    topicsCompleted: 7,
    topicsTotal: 9,
    notesCount: 11,
    assignmentsCount: 1,
    pastPapersCount: 3,
  },
];

export const topics: Topic[] = [
  {
    id: "topic-net-1",
    moduleId: "mod-sensor-networks",
    number: 1,
    title: "Introduction to Sensor Networks",
    durationMinutes: 18,
    completed: true,
    resourceIds: ["res-net-1"],
    summary:
      "What networks are, why they matter, and the basic building blocks you’ll use all semester — hosts, links, packets, and protocols.",
  },
  {
    id: "topic-net-2",
    moduleId: "mod-sensor-networks",
    number: 2,
    title: "OSI Model",
    durationMinutes: 22,
    completed: true,
    resourceIds: ["res-net-2"],
    summary:
      "Walk through the seven OSI layers and how each one solves a different networking problem, from bits on the wire to the apps you use.",
  },
  {
    id: "topic-net-3",
    moduleId: "mod-sensor-networks",
    number: 3,
    title: "TCP/IP",
    durationMinutes: 25,
    completed: true,
    resourceIds: ["res-net-3"],
    summary:
      "Map the practical TCP/IP stack to OSI, and learn how addressing, ports, and reliable delivery work together.",
  },
  {
    id: "topic-net-4",
    moduleId: "mod-sensor-networks",
    number: 4,
    title: "Network Devices",
    durationMinutes: 20,
    completed: true,
    resourceIds: ["res-net-4"],
    summary:
      "Compare hubs, switches, routers, and access points — when to use each, and how they forward traffic.",
  },
  {
    id: "topic-net-5",
    moduleId: "mod-sensor-networks",
    number: 5,
    title: "Routing",
    durationMinutes: 28,
    completed: true,
    resourceIds: ["res-net-5"],
    summary:
      "Static vs dynamic routes, the role of routing tables, and how packets find a path across networks.",
  },
  {
    id: "topic-net-6",
    moduleId: "mod-sensor-networks",
    number: 6,
    title: "Routing Protocols",
    durationMinutes: 24,
    completed: false,
    resourceIds: ["res-net-6", "res-net-7"],
    summary:
      "RIP, OSPF, and BGP at a glance — metrics, convergence, and where each protocol fits in campus and internet routing.",
  },
  {
    id: "topic-net-7",
    moduleId: "mod-sensor-networks",
    number: 7,
    title: "Switching",
    durationMinutes: 21,
    completed: false,
    resourceIds: [],
    summary:
      "Frame forwarding, MAC learning, VLANs, and how Layer 2 switching keeps local traffic efficient.",
  },
  {
    id: "topic-db-1",
    moduleId: "mod-db-admin",
    number: 1,
    title: "Introduction to Databases",
    durationMinutes: 16,
    completed: true,
    resourceIds: ["res-db-1"],
    summary:
      "Why databases exist, the difference between files and DBMSs, and the core vocabulary of tables, rows, and keys.",
  },
  {
    id: "topic-db-2",
    moduleId: "mod-db-admin",
    number: 2,
    title: "Relational Model",
    durationMinutes: 20,
    completed: true,
    resourceIds: ["res-db-2"],
    summary:
      "Relations, attributes, keys, and integrity constraints that keep data consistent.",
  },
  {
    id: "topic-db-3",
    moduleId: "mod-db-admin",
    number: 3,
    title: "SQL Fundamentals",
    durationMinutes: 30,
    completed: true,
    resourceIds: ["res-db-3"],
    summary:
      "SELECT, JOIN, GROUP BY, and writing queries you can reuse for labs and assignments.",
  },
  {
    id: "topic-db-4",
    moduleId: "mod-db-admin",
    number: 4,
    title: "Database Normalization",
    durationMinutes: 26,
    completed: false,
    resourceIds: ["res-db-4"],
    summary:
      "Functional dependencies and normalizing schemas to 1NF, 2NF, and 3NF without losing meaning.",
  },
];

export const resources: Resource[] = [
  {
    id: "res-net-1",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-1",
    type: "pdf",
    title: "Introduction to Sensor Networks Notes",
    uploadedAt: "2026-09-01T10:00:00",
    size: "2.1 MB",
    uploader: "Dr. John Smith",
    content: `# Introduction to Sensor Networks

## Learning outcomes
- Define a computer network and explain why organisations use them
- Identify hosts, links, packets, and protocols
- Contrast LAN, WAN, and the internet

## Core ideas
A **network** connects devices so they can share data and resources. Traffic moves in **packets** — small chunks of data that travel independently and are reassembled at the destination.

### Common topologies
1. Star — devices connect to a central switch
2. Bus — shared backbone (mostly historical)
3. Mesh — redundant paths for reliability

### Quick check
1. What problem do protocols solve?
2. Why do we prefer packet switching over circuit switching for the internet?
`,
  },
  {
    id: "res-net-2",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-2",
    type: "slides",
    title: "OSI Model Lecture Slides",
    uploadedAt: "2026-09-03T09:30:00",
    size: "4.8 MB",
    uploader: "Dr. John Smith",
    content: `# OSI Model — Lecture Slides (notes export)

## The 7 layers
7. Application
6. Presentation
5. Session
4. Transport
3. Network
2. Data Link
1. Physical

## Mnemonics
**Please Do Not Throw Sausage Pizza Away** (bottom → top)

## Exam tip
Be ready to place devices and protocols into the correct layer (e.g. switch ≈ L2, router ≈ L3, TCP ≈ L4).
`,
  },
  {
    id: "res-net-3",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-3",
    type: "pdf",
    title: "TCP/IP Protocol Suite",
    uploadedAt: "2026-09-05T11:00:00",
    size: "3.2 MB",
    uploader: "Class Rep",
    content: `# TCP/IP Protocol Suite

## Layers (practical model)
- Application (HTTP, DNS, SMTP)
- Transport (TCP, UDP)
- Internet (IP, ICMP)
- Network Access (Ethernet, Wi‑Fi)

## TCP vs UDP
| | TCP | UDP |
|---|---|---|
| Reliability | Guaranteed delivery | Best effort |
| Ordering | Ordered | No order guarantee |
| Use cases | Web, email, file transfer | Video, DNS, VoIP |

## Ports
Well-known ports map services to processes (80/443 web, 53 DNS, 22 SSH).
`,
  },
  {
    id: "res-net-4",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-4",
    type: "pdf",
    title: "Routers, Switches and Hubs",
    uploadedAt: "2026-09-08T14:00:00",
    size: "1.9 MB",
    uploader: "Dr. John Smith",
    content: `# Network Devices

## Hub
Broadcasts frames to every port. Collision domain spans the whole hub.

## Switch
Learns MAC addresses and forwards frames only where needed. Each port is usually its own collision domain.

## Router
Routes packets between networks using IP addresses. Separates broadcast domains.

## Access point
Bridges wireless clients onto a wired LAN.
`,
  },
  {
    id: "res-net-5",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-5",
    type: "notes",
    title: "Static and Dynamic Routing Notes",
    uploadedAt: "2026-09-10T08:45:00",
    size: "1.4 MB",
    uploader: "Dr. John Smith",
    content: `# Static and Dynamic Routing

## Routing table essentials
- Destination network / prefix
- Next hop
- Outgoing interface
- Metric / administrative distance

## Static routing
Manually configured. Simple and predictable on small networks; does not adapt when links fail unless you add backups.

## Dynamic routing
Routers exchange information with protocols so paths update automatically.
`,
  },
  {
    id: "res-net-6",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-6",
    type: "pdf",
    title: "Routing Protocols Lecture Notes",
    uploadedAt: "2026-09-15T16:20:00",
    size: "3.4 MB",
    uploader: "Dr. John Smith",
    content: `# Routing Protocols

## RIP
Distance-vector. Metric = hop count (max 15). Easy to configure; slow convergence on larger nets.

## OSPF
Link-state. Builds a topology map and elects a Designated Router on multi-access segments. Preferred on campus networks.

## BGP
Path-vector used between autonomous systems on the internet. Policy-driven rather than pure shortest-path.
`,
  },
  {
    id: "res-net-7",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-6",
    type: "slides",
    title: "RIP, OSPF and BGP Overview",
    uploadedAt: "2026-09-15T16:25:00",
    size: "5.1 MB",
    uploader: "Dr. John Smith",
    content: `# RIP · OSPF · BGP — Overview slides

## Comparison cheat sheet
- **RIP** — hop count, small networks
- **OSPF** — link state, enterprise / campus
- **BGP** — internet-scale policy routing

## Study prompt
Explain how OSPF elects a DR/BDR and why RIP’s hop limit of 15 hurts scalability.
`,
  },
  {
    id: "res-db-1",
    moduleId: "mod-db-admin",
    topicId: "topic-db-1",
    type: "pdf",
    title: "Database Concepts Overview",
    uploadedAt: "2026-09-02T10:00:00",
    size: "2.4 MB",
    uploader: "Prof. Amina Hassan",
    content: `# Database Concepts Overview

## Why databases?
Files alone struggle with concurrency, integrity, and querying. A DBMS manages storage, access control, and transactions.

## Key terms
- Table / relation
- Row / tuple
- Column / attribute
- Primary key & foreign key
`,
  },
  {
    id: "res-db-2",
    moduleId: "mod-db-admin",
    topicId: "topic-db-2",
    type: "slides",
    title: "Relational Model Slides",
    uploadedAt: "2026-09-04T09:00:00",
    size: "3.6 MB",
    uploader: "Prof. Amina Hassan",
    content: `# Relational Model

## Integrity
- Entity integrity — primary keys are unique and not null
- Referential integrity — foreign keys must match or be null
- Domain integrity — values fit the attribute’s type/domain
`,
  },
  {
    id: "res-db-3",
    moduleId: "mod-db-admin",
    topicId: "topic-db-3",
    type: "pdf",
    title: "SQL Queries Workbook",
    uploadedAt: "2026-09-07T13:00:00",
    size: "2.8 MB",
    uploader: "Prof. Amina Hassan",
    content: `# SQL Queries Workbook

## Practice set
\`\`\`sql
SELECT student_id, full_name
FROM students
WHERE year = 3
ORDER BY full_name;

SELECT m.name, COUNT(a.id) AS pending
FROM modules m
LEFT JOIN assignments a ON a.module_id = m.id AND a.status = 'upcoming'
GROUP BY m.name;
\`\`\`

## Tip
Write the English question first, then translate into SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY.
`,
  },
  {
    id: "res-db-4",
    moduleId: "mod-db-admin",
    topicId: "topic-db-4",
    type: "pdf",
    title: "Normalization to 3NF Guide",
    uploadedAt: "2026-09-14T15:30:00",
    size: "2.2 MB",
    uploader: "Prof. Amina Hassan",
    content: `# Normalization to 3NF

## Steps
1. **1NF** — atomic values, no repeating groups
2. **2NF** — no partial dependency on a composite key
3. **3NF** — no transitive dependency on non-key attributes

## Assignment reminder
Document functional dependencies before splitting tables so you can justify each normal form.
`,
  },
];

export const assignments: Assignment[] = [
  {
    id: "asg-1",
    moduleId: "mod-db-admin",
    title: "Database Normalization Assignment",
    description:
      "Normalize the provided university registration schema to Third Normal Form and justify each step.",
    lecturer: "Prof. Amina Hassan",
    deadline: "2026-09-18T23:59:00",
    priority: "high",
    status: "upcoming",
    instructions:
      "Submit a PDF report with ER diagrams, functional dependencies, and the final normalized tables. Include SQL CREATE statements.",
    attachedFiles: [
      {
        name: "schema-brief.pdf",
        size: "420 KB",
        type: "pdf",
        url: "/assignments/schema-brief.pdf",
      },
      {
        name: "sample-data.csv",
        size: "88 KB",
        type: "csv",
        url: "/assignments/sample-data.csv",
      },
    ],
    relatedResourceIds: ["res-db-4"],
  },
  {
    id: "asg-2",
    moduleId: "mod-dsa",
    title: "Data Structures CAT",
    description: "Continuous assessment test covering pipelining and memory hierarchy.",
    lecturer: "Dr. Peter Mwangi",
    deadline: "2026-09-19T10:00:00",
    priority: "high",
    status: "upcoming",
    instructions: "Bring your student ID. Closed book. Duration: 90 minutes.",
    attachedFiles: [],
    relatedResourceIds: [],
  },
  {
    id: "asg-3",
    moduleId: "mod-sensor-networks",
    title: "Networking Presentation",
    description: "Group presentation on a modern routing protocol and its use in campus networks.",
    lecturer: "Dr. John Smith",
    deadline: "2026-09-22T14:00:00",
    priority: "medium",
    status: "upcoming",
    instructions: "15-minute presentation plus 5 minutes Q&A. Submit slides before Monday 8:00 AM.",
    attachedFiles: [
      {
        name: "presentation-rubric.pdf",
        size: "210 KB",
        type: "pdf",
        url: "/assignments/presentation-rubric.pdf",
      },
    ],
    relatedResourceIds: ["res-net-6"],
  },
  {
    id: "asg-4",
    moduleId: "mod-se",
    title: "Software Requirements Spec",
    description: "Write a complete SRS document for a student attendance system.",
    lecturer: "Mr. David Okello",
    deadline: "2026-09-25T23:59:00",
    priority: "medium",
    status: "upcoming",
    instructions: "Use IEEE 830 format. Maximum 12 pages.",
    attachedFiles: [
      {
        name: "srs-template.txt",
        size: "56 KB",
        type: "txt",
        url: "/assignments/srs-template.txt",
      },
    ],
    relatedResourceIds: [],
  },
  {
    id: "asg-5",
    moduleId: "mod-electronics",
    title: "Sensor Interfacing Lab Report",
    description: "Document your DHT11 and ultrasonic sensor experiments on Arduino.",
    lecturer: "Eng. Sarah Nkomo",
    deadline: "2026-09-10T23:59:00",
    priority: "low",
    status: "completed",
    instructions: "Include wiring diagrams, code snippets, and observed readings.",
    attachedFiles: [],
    relatedResourceIds: [],
  },
];

export const pastPapers: PastPaper[] = [
  {
    id: "pp-1",
    moduleId: "mod-sensor-networks",
    title: "Sensor Networks Final Examination",
    year: 2025,
    type: "final",
    fileType: "pdf",
    size: "1.8 MB",
    fileUrl: "/past-papers/pp-1.pdf",
  },
  {
    id: "pp-2",
    moduleId: "mod-sensor-networks",
    title: "Sensor Networks CAT 1",
    year: 2025,
    type: "cat",
    fileType: "pdf",
    size: "640 KB",
    fileUrl: "/past-papers/pp-2.pdf",
  },
  {
    id: "pp-3",
    moduleId: "mod-sensor-networks",
    title: "Sensor Networks Mid-Semester Test",
    year: 2024,
    type: "test",
    fileType: "pdf",
    size: "720 KB",
    fileUrl: "/past-papers/pp-3.pdf",
  },
  {
    id: "pp-4",
    moduleId: "mod-db-admin",
    title: "Database Programming Final Examination",
    year: 2025,
    type: "final",
    fileType: "pdf",
    size: "2.0 MB",
    fileUrl: "/past-papers/pp-4.pdf",
  },
  {
    id: "pp-5",
    moduleId: "mod-db-admin",
    title: "Database Programming CAT 2",
    year: 2025,
    type: "cat",
    fileType: "pdf",
    size: "580 KB",
    fileUrl: "/past-papers/pp-5.pdf",
  },
  {
    id: "pp-6",
    moduleId: "mod-dsa",
    title: "Data Structures Final Examination",
    year: 2024,
    type: "final",
    fileType: "pdf",
    size: "1.5 MB",
    fileUrl: "/past-papers/pp-6.pdf",
  },
  {
    id: "pp-7",
    moduleId: "mod-dsp",
    title: "Digital Signal Processing Final Examination",
    year: 2025,
    type: "final",
    fileType: "pdf",
    size: "1.7 MB",
    fileUrl: "/past-papers/pp-7.pdf",
  },
  {
    id: "pp-8",
    moduleId: "mod-hci",
    title: "HCI CAT 1",
    year: 2025,
    type: "cat",
    fileType: "pdf",
    size: "510 KB",
    fileUrl: "/past-papers/pp-8.pdf",
  },
];

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Sensor Networks CAT Rescheduled",
    body: "The CAT previously scheduled for Wednesday will now be held on Friday at 10:00 AM in Lab 03.",
    category: "exams",
    pinned: true,
    postedAt: "2026-09-17T10:50:00",
    moduleId: "mod-sensor-networks",
  },
  {
    id: "ann-2",
    title: "New Database Programming notes uploaded",
    body: "Normalization lecture notes and practice exercises are now available in the module resources.",
    category: "class",
    pinned: false,
    postedAt: "2026-09-16T18:20:00",
    moduleId: "mod-db-admin",
  },
  {
    id: "ann-3",
    title: "Software Engineering assignment added",
    body: "SRS document assignment has been posted. Deadline is September 25.",
    category: "assignments",
    pinned: false,
    postedAt: "2026-09-16T09:15:00",
    moduleId: "mod-se",
  },
  {
    id: "ann-4",
    title: "Timetable update: Lab venue change",
    body: "Electronics design lab moves from Lab 01 to Lab 05 starting next week.",
    category: "timetable",
    pinned: false,
    postedAt: "2026-09-15T14:00:00",
    moduleId: "mod-electronics",
  },
  {
    id: "ann-5",
    title: "Library extended hours during CAT week",
    body: "Main library will remain open until 10:00 PM from Monday to Friday next week.",
    category: "general",
    pinned: true,
    postedAt: "2026-09-14T11:30:00",
  },
];

export const timetable: TimetableEntry[] = [
  {
    id: "tt-1",
    moduleId: "mod-sensor-networks",
    day: 4, // Thursday
    startTime: "10:00",
    endTime: "12:00",
    room: "Lab 03",
    lecturer: "Dr. John Smith",
  },
  {
    id: "tt-2",
    moduleId: "mod-db-admin",
    day: 4,
    startTime: "14:00",
    endTime: "16:00",
    room: "LT 2",
    lecturer: "Prof. Amina Hassan",
  },
  {
    id: "tt-3",
    moduleId: "mod-dsa",
    day: 5,
    startTime: "10:00",
    endTime: "11:30",
    room: "Hall B",
    lecturer: "Dr. Peter Mwangi",
  },
  {
    id: "tt-4",
    moduleId: "mod-se",
    day: 1,
    startTime: "08:00",
    endTime: "10:00",
    room: "LT 1",
    lecturer: "Mr. David Okello",
  },
  {
    id: "tt-5",
    moduleId: "mod-electronics",
    day: 2,
    startTime: "13:00",
    endTime: "15:00",
    room: "Lab 05",
    lecturer: "Eng. Sarah Nkomo",
  },
  {
    id: "tt-6",
    moduleId: "mod-dsp",
    day: 3,
    startTime: "09:00",
    endTime: "11:00",
    room: "LT 3",
    lecturer: "Dr. Grace Kimaro",
  },
  {
    id: "tt-7",
    moduleId: "mod-hci",
    day: 5,
    startTime: "14:00",
    endTime: "16:00",
    room: "Lab 02",
    lecturer: "Dr. Fatima Juma",
  },
  {
    id: "tt-8",
    moduleId: "mod-sensor-networks",
    day: 1,
    startTime: "11:00",
    endTime: "13:00",
    room: "Lab 03",
    lecturer: "Dr. John Smith",
  },
];

export const studySessions: StudySession[] = [
  {
    id: "ss-1",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-6",
    title: "Routing Protocols deep dive",
    date: "2026-09-18",
    durationMinutes: 90,
    completed: false,
    goal: "Finish Topic 06 notes and practice 10 quiz questions",
  },
  {
    id: "ss-2",
    moduleId: "mod-db-admin",
    topicId: "topic-db-4",
    title: "Normalization practice",
    date: "2026-09-18",
    durationMinutes: 60,
    completed: false,
    goal: "Complete assignment draft",
  },
  {
    id: "ss-3",
    moduleId: "mod-dsa",
    title: "Pipelining revision",
    date: "2026-09-19",
    durationMinutes: 75,
    completed: false,
    goal: "Prepare for Friday CAT",
  },
  {
    id: "ss-4",
    moduleId: "mod-electronics",
    title: "Interrupt handling review",
    date: "2026-09-16",
    durationMinutes: 45,
    completed: true,
  },
  {
    id: "ss-5",
    moduleId: "mod-dsp",
    title: "Process scheduling summary",
    date: "2026-09-20",
    durationMinutes: 60,
    completed: false,
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Assignment due tomorrow",
    body: "Database Normalization Assignment is due tomorrow at 11:59 PM.",
    type: "assignment",
    createdAt: "2026-09-17T08:00:00",
    read: false,
    href: "/assignments/asg-1",
  },
  {
    id: "n-2",
    title: "New notes uploaded",
    body: "Routing Protocols Lecture Notes added to Sensor Networks.",
    type: "notes",
    createdAt: "2026-09-15T16:20:00",
    read: false,
    href: "/modules/mod-sensor-networks",
  },
  {
    id: "n-3",
    title: "Classroom changed",
    body: "Electronics design lab moves to Lab 05.",
    type: "timetable",
    createdAt: "2026-09-15T14:00:00",
    read: true,
    href: "/timetable",
  },
  {
    id: "n-4",
    title: "CAT scheduled",
    body: "Data Structures CAT is on Friday at 10:00 AM.",
    type: "exam",
    createdAt: "2026-09-14T12:00:00",
    read: true,
    href: "/assignments/asg-2",
  },
  {
    id: "n-5",
    title: "New announcement",
    body: "Library extended hours during CAT week.",
    type: "announcement",
    createdAt: "2026-09-14T11:30:00",
    read: true,
    href: "/announcements",
  },
];

export const updateFeed: UpdateFeedItem[] = [
  {
    id: "uf-1",
    title: "New Database Programming notes uploaded",
    category: "Notes",
    createdAt: "2026-09-16T18:20:00",
    icon: "FileText",
  },
  {
    id: "uf-2",
    title: "Sensor Networks CAT moved to Friday",
    category: "Exams",
    createdAt: "2026-09-17T10:50:00",
    icon: "CalendarClock",
  },
  {
    id: "uf-3",
    title: "Software Engineering assignment added",
    category: "Assignments",
    createdAt: "2026-09-16T09:15:00",
    icon: "ClipboardList",
  },
  {
    id: "uf-4",
    title: "New past paper uploaded",
    category: "Past Papers",
    createdAt: "2026-09-13T17:00:00",
    icon: "Archive",
  },
];

export const aiConversations: AIConversation[] = [
  {
    id: "ai-1",
    title: "Routing protocols explained",
    moduleId: "mod-sensor-networks",
    topicId: "topic-net-6",
    updatedAt: "2026-09-16T20:10:00",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Explain routing protocols in simple terms.",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Routing protocols are rules routers use to decide the best path for data across a network.\n\n**In simple terms:**\n- Routers are like traffic directors for packets.\n- Routing protocols help them share map updates with each other.\n- Common ones you will meet in ETU 07523: **RIP**, **OSPF**, and **BGP**.\n\n**Quick comparison**\n1. **RIP** — simple, uses hop count, good for small networks.\n2. **OSPF** — faster and smarter, uses link state, preferred in larger campus networks.\n3. **BGP** — used between large networks and the internet.\n\nBased on your Routing Protocols lecture notes, focus first on how OSPF elects a designated router and how RIP’s hop limit of 15 affects scalability.",
        citations: [
          "Routing Protocols Lecture Notes",
          "RIP, OSPF and BGP Overview",
        ],
        suggestedQuestions: [
          "What is the difference between RIP and OSPF?",
          "Give me 5 quiz questions on routing protocols",
          "Create flashcards for OSPF terms",
        ],
      },
    ],
  },
  {
    id: "ai-2",
    title: "Normalization walkthrough",
    moduleId: "mod-db-admin",
    topicId: "topic-db-4",
    updatedAt: "2026-09-15T19:00:00",
    messages: [],
  },
];

export const missedSummary: MissedDaySummary = {
  date: "2026-09-15",
  classesMissed: 2,
  items: [
    {
      moduleId: "mod-sensor-networks",
      topic: "Routing Algorithms",
      newNotes: 2,
      assignment: "Routing Exercise",
      deadline: "Friday",
    },
    {
      moduleId: "mod-db-admin",
      topic: "Database Normalization",
      newNotes: 1,
      announcement: "CAT next Monday",
    },
  ],
};

export const examCountdownDays = 21;

export function getModule(id: string) {
  return modules.find((m) => m.id === id);
}

export function getAssignment(id: string) {
  return assignments.find((a) => a.id === id);
}

export function getTopicsForModule(moduleId: string) {
  return topics
    .filter((t) => t.moduleId === moduleId)
    .sort((a, b) => a.number - b.number);
}

export function getTopic(id: string) {
  return topics.find((t) => t.id === id);
}

export function getResourcesForModule(moduleId: string) {
  return resources.filter((r) => r.moduleId === moduleId);
}

export function getResourcesForTopic(topicId: string) {
  const topic = getTopic(topicId);
  if (!topic) return [];
  const byIds = topic.resourceIds
    .map((id) => resources.find((r) => r.id === id))
    .filter(Boolean) as typeof resources;
  if (byIds.length) return byIds;
  return resources.filter((r) => r.topicId === topicId);
}

export function getResource(id: string) {
  return resources.find((r) => r.id === id);
}

export function getAssignmentsForModule(moduleId: string) {
  return assignments.filter((a) => a.moduleId === moduleId);
}

export function getPastPapersForModule(moduleId: string) {
  return pastPapers.filter((p) => p.moduleId === moduleId);
}
