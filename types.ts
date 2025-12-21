
export enum MemberRole {
  PostDoc = 'Post-doc',
  PhD = 'PhD',
  Researcher = 'Researcher',
  MS = 'MS'
}

export enum MemberStatus {
  Active = 'Active',
  Alumni = 'Alumni'
}

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  email: string;
  photoUrl: string;
  admissionDate: string;
  expectedGraduation: string;
  status: MemberStatus;
  label?: string; // e.g., "Part-time", "Integrated"
  researchInterests?: string; // Added from image context
}

export enum ResearchType {
  NewResearch = '신진연구',     // Changed from 'New Research'
  Individual = '개별연구',      // Changed from 'Individual'
  Thesis = '학위논문',          // Changed from 'Thesis' for consistency
  Modification = '논문수정',    // Changed from 'Modification' for consistency
  Submission = '논문투고'       // Changed from 'Submission' for consistency
}

export enum ResearchStatus {
  Preparing = 'Preparing',       // 준비 중
  Submitting = 'Submitting',     // 투고 중
  UnderReview = 'Under Review',  // 심사 중
  Accepted = 'Accepted'          // 게재 확정
}

export interface ResearchRecord {
  id: string;
  title: string;
  type: ResearchType;
  status: ResearchStatus;
  assignedMemberId: string;
  targetJournal?: string;
  deadline?: string;
  description?: string;
  fileAttachment?: string; // Filename or fake URL
  progress: number; // 0-100
  checklist?: string[]; // IDs of completed writing steps
  reviewChecklist?: string[]; // IDs of completed review steps
}

export interface LabProject {
  id: string;
  title: string;
  period: string;
  fundingSource: string;
  description?: string;
  status: 'Active' | 'Completed';
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  date: string;
}

export interface MeetingLog {
  id: string;
  date: string;
  attendeeIds: string[];
  content: string;
  actionItems: string;
  relatedResearchId?: string;
  fileAttachment?: string;
  // New Community Features
  authorId: string; // The person who wrote the log (usually student)
  likes: string[]; // List of user IDs who liked
  comments: Comment[];
  shareUrl?: string;
  nextMeetingDate?: string; // ISO String
}

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string; // Optional
  role: 'admin' | 'user'; // 'admin' = Prof/Manager, 'user' = Student
  status: 'pending' | 'active' | 'rejected';
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  categoryId: string;
  description?: string;
  participantIds: string[];
  isMajorEvent?: boolean; // Show on dashboard if true
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

// Helper to get color by role
export const getRoleColor = (role: MemberRole) => {
  switch (role) {
    case MemberRole.MS: return 'bg-blue-50 text-blue-700 border-blue-200';
    case MemberRole.PhD: return 'bg-teal-50 text-teal-700 border-teal-200';
    case MemberRole.PostDoc: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case MemberRole.Researcher: return 'bg-orange-50 text-orange-700 border-orange-200';
    default: return 'bg-slate-50 text-slate-700';
  }
};

export const getStatusColor = (status: ResearchStatus) => {
  switch (status) {
    case ResearchStatus.Preparing: return 'bg-slate-100 text-slate-600';
    case ResearchStatus.Submitting: return 'bg-coral-bg text-coral'; // Coral for urgency/action
    case ResearchStatus.UnderReview: return 'bg-blue-50 text-blue-600';
    case ResearchStatus.Accepted: return 'bg-sage-bg text-sage font-bold'; // Sage for success
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getProgressColor = (progress: number) => {
  if (progress >= 90) return 'bg-sage'; // Complete/Success
  if (progress >= 50) return 'bg-blue-500'; // Steady
  return 'bg-slate-400'; // Early stage
};
