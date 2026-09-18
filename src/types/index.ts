export type Priority = "low" | "medium" | "high";
export type AssignmentStatus = "upcoming" | "completed" | "overdue";
export type AnnouncementCategory =
  | "general"
  | "class"
  | "exams"
  | "assignments"
  | "timetable";
export type PastPaperType = "cat" | "test" | "final";
export type ResourceType =
  | "pdf"
  | "slides"
  | "video"
  | "link"
  | "notes"
  | "questions";
export type NotificationType =
  | "assignment"
  | "notes"
  | "timetable"
  | "exam"
  | "announcement";

export interface Institution {
  id: string;
  name: string;
  shortName: string;
}

export interface Programme {
  id: string;
  name: string;
  institutionId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  institutionId: string;
  programmeId: string;
  year: 1 | 2 | 3 | 4;
  semester: 1 | 2;
  className: string;
  studyStreak: number;
  modulesJoined: number;
  resourcesViewed: number;
}

export interface Topic {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  durationMinutes: number;
  completed: boolean;
  resourceIds: string[];
  summary?: string;
}

export interface Resource {
  id: string;
  moduleId: string;
  topicId?: string;
  type: ResourceType;
  title: string;
  uploadedAt: string;
  size: string;
  uploader: string;
  url?: string;
  /** Plain-text / markdown body used for in-app preview & download */
  content?: string;
}

export interface Assignment {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  lecturer: string;
  deadline: string;
  priority: Priority;
  status: AssignmentStatus;
  instructions: string;
  attachedFiles: { name: string; size: string; type: string; url: string }[];
  relatedResourceIds: string[];
}

export interface PastPaper {
  id: string;
  moduleId: string;
  title: string;
  year: number;
  type: PastPaperType;
  fileType: "pdf";
  size: string;
  /** Admin-uploaded PDF path under /public */
  fileUrl: string;
}

export interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  lecturer: string;
  semester: 1 | 2;
  year?: 1 | 2 | 3 | 4;
  category?: "fundamentals" | "core" | "elective";
  credits?: number;
  accent: string;
  progress: number;
  icon: string;
  topicsCompleted: number;
  topicsTotal: number;
  notesCount: number;
  assignmentsCount: number;
  pastPapersCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  postedAt: string;
  moduleId?: string;
}

export type ClassStreamId =
  | "BENG24COE-1"
  | "BENG24COE-2"
  | "BENG24COE-3"
  | "BENG24COE-4";

export interface ClassStream {
  id: ClassStreamId;
  label: string;
  description: string;
  isEvening?: boolean;
}

export interface TimetableEntry {
  id: string;
  moduleId: string;
  streamId: ClassStreamId;
  day: number; // 0 = Sunday, 1 = Monday ...
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
}

export interface StudySession {
  id: string;
  moduleId: string;
  topicId?: string;
  title: string;
  date: string;
  durationMinutes: number;
  completed: boolean;
  goal?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  href?: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  suggestedQuestions?: string[];
}

export interface AIConversation {
  id: string;
  title: string;
  moduleId?: string;
  topicId?: string;
  updatedAt: string;
  messages: AIMessage[];
}

export interface MissedDaySummary {
  date: string;
  classesMissed: number;
  items: {
    moduleId: string;
    topic?: string;
    newNotes: number;
    assignment?: string;
    deadline?: string;
    announcement?: string;
  }[];
}

export interface UpdateFeedItem {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  icon: string;
}

export type StaffRole = "admin" | "class_rep";

export type IssueStatus = "open" | "in_progress" | "resolved";
export type IssueSeverity = "low" | "medium" | "high";
export type IssueCategory =
  | "materials"
  | "timetable"
  | "assignment"
  | "attendance"
  | "technical"
  | "other";

export type UploadKind =
  | "notes"
  | "slides"
  | "past_paper"
  | "assignment"
  | "announcement"
  | "timetable";

export type UploadStatus = "pending" | "processing" | "published" | "rejected";

export interface StaffIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  streamId?: ClassStreamId;
  moduleId?: string;
  reportedBy: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialUpload {
  id: string;
  title: string;
  kind: UploadKind;
  moduleId?: string;
  streamId?: ClassStreamId;
  status: UploadStatus;
  uploadedBy: string;
  role: StaffRole;
  size: string;
  createdAt: string;
  downloads: number;
}

export interface StudentMonitor {
  id: string;
  name: string;
  email: string;
  streamId: ClassStreamId;
  year: number;
  attendancePct: number;
  assignmentsDone: number;
  assignmentsTotal: number;
  lastActive: string;
  risk: "low" | "medium" | "high";
}

export interface AnalyticsPoint {
  label: string;
  uploads: number;
  views: number;
  issues: number;
}

export interface StaffActivity {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  role: StaffRole;
}
