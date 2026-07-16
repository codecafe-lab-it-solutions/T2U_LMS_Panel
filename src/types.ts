export type UserRole = 'student' | 'instructor' | 'admin';

export type KYCVerificationStatus = 'Draft' | 'Pending Verification' | 'Verified' | 'Rejected';

export interface PersonalDetails {
  fullName: string;
  mobile: string;
  email: string;
}

export interface IdentityDetails {
  aadhaarNumber: string;
  panNumber: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
}

export interface KYCUploads {
  panCard?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  cancelledCheque?: string;
  selfie?: string;
}

export interface KYCRecord {
  status: KYCVerificationStatus;
  personal: PersonalDetails;
  identity: IdentityDetails;
  bank: BankDetails;
  uploads: KYCUploads;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  description: string;
  status: 'Not Started' | 'Submitted' | 'Graded';
  submissionFile?: string;
  grade?: string;
  feedback?: string;
  points?: number;
  studentName?: string;
  submittedAt?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  course: string;
  topic: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  countdown: string;
  status: 'Upcoming' | 'LIVE' | 'Completed';
  meetingLink: string;
  recordingLink?: string;
  studentCount?: number;
  description?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface Notification {
  id: string;
  text: string;
  date: string;
  unread: boolean;
  category: 'Course' | 'Quiz' | 'Live Class' | 'Certificate' | 'Reward' | 'General';
}

export type KycStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface EmailChangeAuditLog {
  timestamp: string;
  oldEmail: string;
  newEmail: string;
  status: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  memberSince: string;
  username: string;
  mobile: string;
  address: string;
  dob: string;
  hasAcceptedTerms: boolean;
  firstLogin: boolean;
  profileAuditLogs: EmailChangeAuditLog[];
  referralCode?: string;
  apiUserId?: string;
}

export interface EarningSummary {
  total: number;
  today: number;
  weekly: number;
  monthly: number;
  available: number;
  pending: number;
  withdrawn: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: 'Referral' | 'Course Bonus' | 'Task Completion' | 'Reward' | 'Payout';
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
}

export interface EarningDataPoint {
  date: string;
  earnings: number;
  referrals: number;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  duration: string;
  reward: number;
  category: string;
  questions?: QuizQuestion[];
  completed?: boolean;
  availableUntil?: string;
  attemptStatus?: 'Not Started' | 'In Progress' | 'Completed';
}

export interface Chapter {
  id: string;
  level: number;
  title: string;
  content: string;
  videoUrl?: string;
  duration: string;
  completed: boolean;
}

export type CourseStatus = 'enrolled' | 'live' | 'new' | 'upcoming';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  duration: string;
  progress: number;
  featured: boolean;
  instructor: string;
  modulesCount: number;
  courseStatus: CourseStatus;
  chapters?: Chapter[];
  quizzes?: Quiz[];
  lastActivity?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'IN' | 'OUT';
  joinDate: string;
  email: string;
  commissionEarned: number;
}

export interface KycFormValues {
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface UploadedFile {
  name: string;
  size: string;
  type: string;
  previewUrl: string;
  fileBytes?: string;
}

export interface KycDetails {
  status: KycStatus;
  phone: string;
  formSubmitted?: KycFormValues;
  uploadedDocuments: {
    aadhaar?: UploadedFile;
    pan?: UploadedFile;
    passport?: UploadedFile;
    drivingLicense?: UploadedFile;
  };
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
}

export interface RewardPoints {
  points: number;
  history: Array<{
    id: string;
    description: string;
    points: number;
    date: string;
  }>;
}

export interface WithdrawalRequest {
  id: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  bankAccount: string;
}

export interface AdminWithdrawalEntry {
  id: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  bankAccount: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  kycStatus: KYCVerificationStatus;
  notes?: string;
}

export interface NetworkNode {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  level: number;
  parentId?: string;
  position?: 'left' | 'right';
  status: 'IN' | 'OUT';
  joinDate: string;
  bv: number;
  totalEarnings: number;
  directReferrals: number;
  referralCode: string;
  kycStatus: KYCVerificationStatus;
}

export type ActiveTab =
  | 'home'
  | 'courses'
  | 'live-classes'
  | 'quizzes'
  | 'assignments'
  | 'certificates'
  | 'rewards'
  | 'referral-dashboard'
  | 'my-team'
  | 'genealogy'
  | 'mlm-dashboard'
  | 'income-dashboard'
  | 'commission-history'
  | 'withdrawals'
  | 'kyc'
  | 'notifications'
  | 'settings'
  // Instructor-specific
  | 'course-management'
  | 'live-class-management'
  | 'quiz-management'
  | 'assignment-management'
  | 'student-analytics'
  | 'instructor-earnings'
  | 'instructor-courses'
  | 'instructor-products'
  | 'live-class-analytics'
  // Instructor quiz/batch create + course detail + withdrawals
  | 'instructor-course-create'
  | 'instructor-quiz-create'
  | 'instructor-quiz-edit'
  | 'quiz-taking'
  | 'instructor-batch-create'
  | 'instructor-batch-manage'
  | 'instructor-course-detail'
  | 'instructor-withdrawals'
  // Admin panel — separate role
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-courses'
  | 'admin-course-create'
  | 'admin-course-detail'
  | 'admin-quiz-create'
  | 'admin-batch-create'
  | 'admin-batch-manage'
  | 'admin-live-classes'
  | 'admin-live-class-analytics'
  | 'admin-assignments'
  | 'admin-kyc'
  | 'admin-withdrawals'
  | 'admin-mlm'
  | 'admin-cms'
  | 'admin-crm'
  | 'admin-reports'
  | 'admin-settings'
  | 'admin-zoom-accounts'
  | 'admin-team-management'
  | 'admin-enrollments'
  | 'admin-rewards'
  | 'admin-instructor-applications'
  | 'admin-tax-report'
  | 'admin-mlm-criteria'
  | 'admin-packages'
  | 'admin-notification-templates'
  | 'admin-income-sources'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-queries'
  | 'admin-invoices'
  | 'student-products'
  | 'support'
  | 'invoices'
  | 'bv-ledger';
