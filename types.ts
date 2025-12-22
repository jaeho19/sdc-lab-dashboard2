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
  researchInterests?: string; 
  currentProjects?: string; 
  phoneNumber?: string;
}

export enum ResearchType {
  NewResearch = '신진연구',     
  Individual = '개별연구',      
  Thesis = '학위논문',          
  Modification = '논문수정',    
  Submission = '논문투고'       
}

export enum ResearchStatus {
  Preparing = 'Preparing',       // 준비 중
  Submitting = 'Submitting',     // 투고 중
  UnderReview = 'Under Review',  // 심사 중
  Accepted = 'Accepted'          // 게재 확정
}

export type ResearchStatusTag = 'On Track' | 'At Risk' | 'Delayed' | 'On Hold' | 'Under Review' | 'Completed';

// --- NEW PAPER MODEL ---
export interface PaperAuthor {
  id: string;
  name: string;
  role: '1저자' | '교신저자' | '공저자';
  responsibilities: string[]; // e.g. "Data Collection", "Analysis"
  order: number;
}

export interface PaperStage {
  id: string;
  stageType: string; // e.g., "문헌조사", "방법론설계"
  weight: number; // 0-100 (percentage)
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD
  order: number;
  checklist: { id: string; text: string; completed: boolean }[];
  memo?: string;
}

export interface Paper {
  id: string;
  studentId: string; // Linked to Member ID
  title: string;
  targetJournal?: string;
  deadline?: string; // YYYY-MM-DD
  progress: number; // 0-100 (Auto-calculated)
  
  stages: PaperStage[];
  authors: PaperAuthor[];
  
  statusTag?: ResearchStatusTag; // For color coding (On Track, etc.)
  createdAt?: string;
  updatedAt?: string;
}
// -----------------------

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  weight: number; // Percentage contribution to total progress
  order: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // URL or fake path
  type: 'file' | 'link';
  date: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: 'First Author' | 'Corresponding Author' | 'Co-Author';
  isExternal?: boolean;
}

export interface ActivityLog {
  id: string;
  date: string; // ISO String
  content: string;
  authorId?: string; // Optional if automated
  type?: 'log' | 'milestone' | 'status_change';
}

// Keeping for backward compatibility or migration
export interface ResearchRecord extends Paper {
  // Alias or Extend Paper to satisfy existing code if needed
  // However, we will try to move to 'Paper' where possible.
  // For now, let's keep ResearchRecord as a legacy type but map it to Paper if we can.
  // Or simpler: Just keep ResearchRecord as is for now and let the new module use Paper.
  // But wait, ResearchRecord IS used in App.tsx. 
  // Let's redefine ResearchRecord to compatible with Paper or just separate them?
  // The system uses ResearchRecord[] in App.tsx. 
  // Let's make ResearchRecord include Paper fields.
  type: ResearchType;
  status: ResearchStatus; 
  assignedMemberId: string;
  statusTag?: ResearchStatusTag;
  
  description?: string;
  startDate?: string;
  
  activityLog?: ActivityLog[];
  attachments?: Attachment[];
  collaborators?: Collaborator[];
  
  milestones?: Milestone[]; // Legacy milestones
  
  // Extended Meta
  fundingAgency?: string;
  grantNumber?: string;
  submissionDate?: string; 
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
