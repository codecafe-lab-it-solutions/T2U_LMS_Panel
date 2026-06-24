import { create } from 'zustand';
import { 
  ActiveTab, UserProfile, Course, EarningSummary, Transaction, 
  KycDetails, KycFormValues, UploadedFile, KycStatus, 
  Quiz, TeamMember, Chapter, QuizQuestion,
  UserRole, KYCRecord, KYCVerificationStatus, PersonalDetails,
  IdentityDetails, BankDetails, KYCUploads, Assignment, LiveClass,
  Announcement, Notification, RewardPoints, WithdrawalRequest,
  EmailChangeAuditLog
} from '../types';

interface AppStore {
  // Authentication State & Roles
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (userIdOrEmail: string, password?: string) => boolean;
  logout: () => void;

  // Theme state
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;

  // Active section/page
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Active Course Workspace
  activeCourseId: string | null;
  setActiveCourseId: (id: string | null) => void;

  // User State
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  // Earnings & Withdrawals State
  earningSummary: EarningSummary;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  withdrawalRequests: WithdrawalRequest[];
  requestWithdrawal: (amount: number, bankAccount: string) => { success: boolean; message: string };

  // Learning & Course Details State
  courses: Course[];
  updateCourseProgress: (courseId: string, progress: number) => void;
  completeChapter: (courseId: string, chapterId: string) => void;
  submitCourseQuiz: (courseId: string, quizId: string, score: number) => void;

  // Live Classes Module (Student + Instructor)
  liveClasses: LiveClass[];
  createLiveClass: (classData: Omit<LiveClass, 'id' | 'status' | 'countdown'>) => void;
  startLiveClass: (id: string) => void;
  endLiveClass: (id: string, recordingLink: string) => void;
  deleteLiveClass: (id: string) => void;
  joinLiveClass: (id: string) => void;

  // Quizzes & Attempt States
  ongoingQuizzes: Quiz[];
  completeOngoingQuiz: (quizId: string, answers: number[]) => void;

  // Assignments Module (Student + Instructor)
  assignments: Assignment[];
  submitAssignment: (id: string, fileName: string) => void;
  gradeAssignment: (id: string, grade: string, feedback: string) => void;

  // Reward Points
  rewardPoints: RewardPoints;
  claimRewardPoints: (points: number, description: string) => void;

  // Announcements & Notifications
  announcements: Announcement[];
  notificationsList: Notification[];
  markNotificationRead: (id: string) => void;

  // Team & Referral Chronology State
  teamMembers: TeamMember[];
  toggleTeamMemberChronology: (memberId: string) => void;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joinDate' | 'commissionEarned'>) => void;
  leftTeamBV: number;
  rightTeamBV: number;
  addLeftBV: (bv: number) => void;
  addRightBV: (bv: number) => void;
  claimMatchingBonus: () => void;

  // Registered Users Roster Database
  registeredUsers: Array<UserProfile & { password?: string }>;
  registerUser: (userData: Omit<UserProfile, 'avatar' | 'memberSince' | 'hasAcceptedTerms' | 'firstLogin' | 'profileAuditLogs'> & { password?: string }) => void;
  acceptTerms: () => void;

  // Secure Email Change verification & logging
  pendingEmailChange: { newEmail: string; pin: string } | null;
  requestEmailChange: (newEmail: string) => void;
  verifyEmailChange: (pin: string) => boolean;

  // Course Management CRUD
  createCourse: (courseData: Omit<Course, 'id' | 'progress'>) => void;
  updateCourse: (updatedCourse: Course) => void;
  deleteCourse: (id: string) => void;

  // Quiz Management CRUD
  createQuiz: (courseId: string, quizData: Omit<Quiz, 'id' | 'completed' | 'attemptStatus'>) => void;
  updateQuiz: (courseId: string, updatedQuiz: Quiz) => void;
  deleteQuiz: (courseId: string, quizId: string) => void;

  // Live Class Update CRUD helper
  updateLiveClass: (updatedClass: LiveClass) => void;

  // ERPNext KYC Record
  kycRecord: KYCRecord;
  updateKycPersonal: (details: PersonalDetails) => void;
  updateKycIdentity: (details: IdentityDetails) => void;
  updateKycBank: (details: BankDetails) => void;
  uploadKycDoc: (field: keyof KYCUploads, fileName: string) => void;
  submitKycForVerification: () => void;
  setKycVerificationStatus: (status: KYCVerificationStatus) => void;
  resetKycRecord: () => void;
}

const initialUserProfileStudent: UserProfile = {
  name: 'Aarya Garg',
  email: 'gargiarya2006@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250&h=250',
  role: 'Student (Elite Learner)',
  memberSince: 'June 2026',
  username: 't2u1001',
  mobile: '+91 8302630776',
  address: 'Delhi, India',
  dob: '2006-08-15',
  hasAcceptedTerms: false,
  firstLogin: true,
  profileAuditLogs: []
};

const initialUserProfileInstructor: UserProfile = {
  name: 'Dr. Evelyn Carter',
  email: 'evelyn.carter@t2u.com',
  avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250&h=250',
  role: 'Lead AI & Automation Instructor',
  memberSince: 'January 2025',
  username: 't2u1002',
  mobile: '+91 9876543210',
  address: 'Mumbai, India',
  dob: '1985-05-24',
  hasAcceptedTerms: false,
  firstLogin: true,
  profileAuditLogs: []
};

const initialEarningSummary: EarningSummary = {
  total: 1450.75,
  today: 45.20,
  weekly: 310.50,
  monthly: 890.30,
  available: 1100.55,
  pending: 100.20,
  withdrawn: 250.00,
};

const initialTransactions: Transaction[] = [
  { id: 'TX1001', date: '2026-06-21', description: 'Referral Bonus: John Doe sign up', category: 'Referral', amount: 25.00, status: 'Success' },
  { id: 'TX1002', date: '2026-06-20', description: 'Web3 Basics Module 3 Competition', category: 'Course Bonus', amount: 15.00, status: 'Success' },
  { id: 'TX1003', date: '2026-06-19', description: 'Completed Social Media Survey #4', category: 'Task Completion', amount: 5.20, status: 'Success' },
  { id: 'TX1004', date: '2026-06-18', description: 'Z-Crypto Quest Bonus', category: 'Reward', amount: 40.00, status: 'Success' },
  { id: 'TX1005', date: '2026-06-15', description: 'Monthly Payout Request', category: 'Payout', amount: -250.00, status: 'Success' },
];

const mockChaptersC101: Chapter[] = [
  { id: 'CH101-1', level: 1, title: 'Introduction to Crowdwork Systems', content: 'Crowdsourced microtasks are small, independent digital items that require human intelligence to complete. Examples include photo categorization, audio transcription, and content tagging. Platforms dynamically route thousands of these tasks globally. Your earning speed depends on speed, target precision, and cognitive compliance.', duration: '15 Mins', completed: true },
  { id: 'CH101-2', level: 2, title: 'Maximizing Task Efficacy & Payout Tiers', content: 'Each platform tracks your accuracy index. Users with high scores (98%+) unlock premium tiers that pay up to 4x more per task. To hit these milestones, always read instructional details closely, complete training sandboxes first, and establish a distraction-free keyboard layout.', duration: '25 Mins', completed: false },
  { id: 'CH101-3', level: 3, title: 'Compliance & Identity Verification Rules', content: 'Because financial networks route thousands of small payments, global anti-money laundering (AML) laws require user verification. Keeping your profile form, phone number, and ID credentials synchronized prevents payment holds and lifts withdrawal limits.', duration: '20 Mins', completed: false },
];

const initialCourses: Course[] = [
  {
    id: 'C101',
    title: 'Foundations of Micro-Earning',
    description: 'Learn how to maximize your daily income using micro-task systems, content moderation, and high-payout crowd-testing platforms.',
    category: 'Gig Economy',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600',
    duration: '2.5 Hours',
    progress: 33,
    featured: true,
    instructor: 'David Miller',
    modulesCount: 3,
    courseStatus: 'enrolled',
    chapters: mockChaptersC101,
    lastActivity: '2026-06-22 14:00',
    quizzes: [
      {
        id: 'Q101',
        title: 'Micro-Earning Knowledge Check',
        description: 'Verify your understanding of micro-task platforms and accuracy scores.',
        questionsCount: 2,
        duration: '5 Mins',
        reward: 15.00,
        category: 'Gig Economy',
        completed: false,
        attemptStatus: 'Not Started',
        availableUntil: '2026-07-01',
        questions: [
          { id: 'Q101-1', questionText: 'What is the standard target accuracy score needed to unlock premium-tier microtasks?', options: ['75% accuracy', '90% accuracy', '98% accuracy or higher', '50% accuracy'], correctAnswerIndex: 2 },
          { id: 'Q101-2', questionText: 'Which legal process matches document records to verify withdrawal credentials?', options: ['OCR Scanning', 'AML Sweep', 'KYC Compliance Verification', 'Seed Phrase Check'], correctAnswerIndex: 2 },
        ]
      }
    ]
  },
  {
    id: 'C102',
    title: 'Web3 & Token Rewards Ecosystem',
    description: 'Navigate decentralized finances, set up your wallet safely, and unlock yield potentials through secure learn-and-earn coin drops.',
    category: 'Blockchain',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600',
    duration: '4 Hours',
    progress: 0,
    featured: true,
    instructor: 'Sarah Jenkins',
    modulesCount: 3,
    chapters: [],
    lastActivity: '--',
    courseStatus: 'enrolled',
    quizzes: [
      {
        id: 'Q102',
        title: 'Web3 Basics & Wallet Safety Quiz',
        description: 'Test your knowledge on keys, staking, and decentralized applications.',
        questionsCount: 2,
        duration: '6 Mins',
        reward: 15.00,
        category: 'Blockchain',
        completed: false,
        attemptStatus: 'Not Started',
        availableUntil: '2026-07-05',
        questions: [
          { id: 'Q102-1', questionText: 'Who should you share your 12-word wallet seed phrase with?', options: ['Platform support officers', 'Your team leads', 'Absolutely nobody (keep it offline)', 'Linked KYC inspectors'], correctAnswerIndex: 2 },
          { id: 'Q102-2', questionText: 'What does locking digital assets in smart contracts to earn passive block rewards represent?', options: ['Staking yield', 'Friction trading', 'Gas sweepstakes', 'Seed validation'], correctAnswerIndex: 0 },
        ]
      }
    ]
  },
  {
    id: 'C103',
    title: 'Spoken English Mastery',
    description: 'Master spoken English for interview preparation, job presentations, and professional communications.',
    category: 'Language',
    thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600',
    duration: '12 Weeks',
    progress: 0,
    featured: true,
    instructor: 'Robert Vance',
    modulesCount: 4,
    courseStatus: 'live',
    chapters: [],
    lastActivity: '--',
    quizzes: []
  },
  {
    id: 'C104',
    title: 'Office Ready Skills',
    description: 'Complete job-readiness preparation. Master Excel, Word, data entries, and basic corporate operations.',
    category: 'Professional Skills',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
    duration: '6 Months',
    progress: 0,
    featured: true,
    instructor: 'Michael Scott',
    modulesCount: 5,
    courseStatus: 'new',
    chapters: [],
    lastActivity: '--',
    quizzes: []
  },
  {
    id: 'C105',
    title: 'AI & Automation',
    description: 'Learn how to leverage ChatGPT, n8n, and automation workflow structures to multiply your daily office productivity.',
    category: 'AI Productivity',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600',
    duration: '10 Weeks',
    progress: 0,
    featured: true,
    instructor: 'Dr. Evelyn Carter',
    modulesCount: 4,
    courseStatus: 'upcoming',
    chapters: [],
    lastActivity: '--',
    quizzes: []
  },
  {
    id: 'C106',
    title: 'Digital Marketing',
    description: 'Elevate search visibility and run ads. Learn Google Ads, search engine optimization (SEO), and copywriting frameworks.',
    category: 'Digital Growth',
    thumbnail: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=600',
    duration: '6 Months',
    progress: 0,
    featured: true,
    instructor: 'Gary Vaynerchuk',
    modulesCount: 6,
    courseStatus: 'new',
    chapters: [],
    lastActivity: '--',
    quizzes: []
  }
];

const initialLiveClasses: LiveClass[] = [
  { id: 'LC1', title: 'Interactive Masterclass: LLM Prompt Engineering', course: 'AI Automation & Workflow Mastery', topic: 'RLHF human feedback loops', instructor: 'Dr. Evelyn Carter', date: '2026-06-23', time: '04:30 PM', duration: '90 Mins', countdown: '01:35:10', status: 'Upcoming', meetingLink: 'https://zoom.us/j/mock-llm-class' },
  { id: 'LC2', title: 'Yield Staking & Token Security Strategies', course: 'Web3 & Token Rewards Ecosystem', topic: 'Token security setups', instructor: 'Sarah Jenkins', date: '2026-06-24', time: '02:00 PM', duration: '120 Mins', countdown: '25:05:00', status: 'Upcoming', meetingLink: 'https://zoom.us/j/mock-web3-class' },
];

const initialOngoingQuizzes: Quiz[] = [
  {
    id: 'OQ1',
    title: 'Weekly AI Alignment Trivia',
    description: 'Validate your understanding of RLHF ethics and model guardrails to claim bonuses.',
    questionsCount: 3,
    duration: '5 Mins',
    reward: 5.00,
    category: 'Artificial Intelligence',
    completed: false,
    availableUntil: 'June 30, 2026',
    attemptStatus: 'Not Started',
    questions: [
      { id: 'OQ1-1', questionText: 'What is the core target of alignment checks in LLMs?', options: ['Improving prompt translation speeds', 'Ensuring answers are helpful, honest, and harmless', 'Enforcing file upload limits', 'Locking coin transaction sweeps'], correctAnswerIndex: 1 },
      { id: 'OQ1-2', questionText: 'Which human annotation method directly informs reinforcement tuning?', options: ['A/B prompt ranking', 'OCR scanning', 'Daily ledger exports', 'Database indexing'], correctAnswerIndex: 0 },
      { id: 'OQ1-3', questionText: 'What represents an adversarial prompt testing style?', options: ['Praising response quality', 'Intentionally trying to trigger model hallucinations or rule bypasses', 'Formatting output as a table', 'Closing window sessions'], correctAnswerIndex: 1 },
    ]
  },
  {
    id: 'OQ2',
    title: 'Aadhaar Compliance Quiz',
    description: 'Verify critical regulatory standards concerning digital security locker integrations.',
    questionsCount: 2,
    duration: '3 Mins',
    reward: 2.50,
    category: 'Compliance',
    completed: false,
    availableUntil: 'June 28, 2026',
    attemptStatus: 'Not Started',
    questions: [
      { id: 'OQ2-1', questionText: 'Is Aadhaar matching required by payment processors to sweeps payouts?', options: ['No, standard email is enough', 'Yes, legal identity matches are mandatory for fiat routing', 'Only for international wire orders', 'Only under light display modes'], correctAnswerIndex: 1 },
      { id: 'OQ2-2', questionText: 'What resolution scanning is suggested to prevent blurred identification flags?', options: ['Under 150 DPI', 'Legible with clear lettering, scan text elements readable', 'A simple sketch', 'Offline document code numbers'], correctAnswerIndex: 1 },
    ]
  },
];

const initialAssignments: Assignment[] = [
  { id: 'A1', title: 'Microtask Campaign Strategy Plan', course: 'Foundations of Micro-Earning', dueDate: '2026-06-27', description: 'Design a workflow template detailing how to audit RLHF prompt answers under 3 minutes accuracy.', status: 'Not Started', points: 100 },
  { id: 'A2', title: 'Token Smart Contract Audit', course: 'Web3 & Token Rewards Ecosystem', dueDate: '2026-06-29', description: 'Inspect a mock Solidity yield aggregator for signature vulnerabilities.', status: 'Submitted', submissionFile: 'smart_contract_audit_final.pdf', points: 100 },
];

const initialAnnouncements: Announcement[] = [
  { id: 'AN1', title: 'ERPNext LMS Core Database Upgraded', content: 'The underlying database cluster has been optimized for faster quiz updates and immediate referral sweeps tracking.', date: '2026-06-22' },
  { id: 'AN2', title: 'Season Earnings Bonus Event', content: 'Registering direct downlines matching the chronology tree yields a ₹500 milestone bonus from June 23 to June 30.', date: '2026-06-20' },
];

const initialNotifications: Notification[] = [
  { id: 'N1', text: 'Live Class "Interactive Masterclass: LLM Prompt Engineering" starts in 1.5 hours.', date: '10 mins ago', unread: true, category: 'Live Class' },
  { id: 'N2', text: 'Congratulations! You received a reward of 100 Points for passing Spoken English quiz.', date: '1 hour ago', unread: true, category: 'Reward' },
  { id: 'N3', text: 'Instructor Sarah Jenkins scheduled a new live DeFi session.', date: '1 day ago', unread: false, category: 'Course' },
];

const initialTeamMembers: TeamMember[] = [
  { id: 'M101', name: 'Rahul Sharma', role: 'Scholar', email: 'rahul.sharma@t2u.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', status: 'IN', joinDate: '2026-06-15', commissionEarned: 120.00 },
  { id: 'M102', name: 'Priya Patel', role: 'Scholar', email: 'priya.patel@t2u.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', status: 'IN', joinDate: '2026-06-18', commissionEarned: 45.00 },
  { id: 'M103', name: 'Amit Verma', role: 'Beginner', email: 'amit.verma@t2u.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', status: 'OUT', joinDate: '2026-06-20', commissionEarned: 0.00 },
];

const initialKYCRecord: KYCRecord = {
  status: 'Draft',
  personal: {
    fullName: 'Aarya Garg',
    mobile: '+91 8302630776',
    email: 'gargiarya2006@gmail.com'
  },
  identity: {
    aadhaarNumber: '',
    panNumber: ''
  },
  bank: {
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: ''
  },
  uploads: {}
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Roster database of registered users
  registeredUsers: [
    { ...initialUserProfileStudent, password: 'password' },
    { ...initialUserProfileInstructor, password: 'password' }
  ],

  registerUser: (userData) => set((state) => {
    const isInstructor = userData.role.toLowerCase().includes('instructor');
    const newUser: UserProfile & { password?: string } = {
      username: userData.username,
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile,
      address: userData.address,
      dob: userData.dob,
      avatar: isInstructor
        ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250&h=250'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250&h=250',
      role: isInstructor ? 'Lead AI & Automation Instructor' : 'Student (Elite Learner)',
      memberSince: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      password: userData.password || 'password',
      hasAcceptedTerms: false,
      firstLogin: true,
      profileAuditLogs: []
    };
    return {
      registeredUsers: [...state.registeredUsers, newUser]
    };
  }),

  acceptTerms: () => set((state) => {
    const updatedProfile = {
      ...state.userProfile,
      hasAcceptedTerms: true,
      firstLogin: false
    };
    const updatedUsers = state.registeredUsers.map(u =>
      u.username === state.userProfile.username ? { ...u, ...updatedProfile } : u
    );
    return {
      userProfile: updatedProfile,
      registeredUsers: updatedUsers
    };
  }),

  // Authentication & Role Routing
  isAuthenticated: false,
  userRole: 'student',

  login: (userIdOrEmail, password) => {
    const query = userIdOrEmail.toLowerCase().trim();
    const pass = password || 'password';
    const foundUser = get().registeredUsers.find(
      u => (u.username.toLowerCase() === query || u.email.toLowerCase() === query) && u.password === pass
    );
    if (foundUser) {
      set({ 
        isAuthenticated: true, 
        userRole: foundUser.role.toLowerCase().includes('instructor') ? 'instructor' : 'student', 
        activeTab: 'home',
        userProfile: foundUser
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, activeCourseId: null });
  },

  // Secure Email Change verification & logging
  pendingEmailChange: null,
  requestEmailChange: (newEmail) => set({
    pendingEmailChange: { newEmail, pin: '582103' }
  }),
  verifyEmailChange: (pin) => {
    const state = get();
    if (state.pendingEmailChange && state.pendingEmailChange.pin === pin) {
      const oldEmail = state.userProfile.email;
      const newEmail = state.pendingEmailChange.newEmail;
      
      const newLog: EmailChangeAuditLog = {
        timestamp: new Date().toLocaleString(),
        oldEmail,
        newEmail,
        status: 'Success: Verified'
      };

      const updatedProfile = {
        ...state.userProfile,
        email: newEmail,
        profileAuditLogs: [newLog, ...(state.userProfile.profileAuditLogs || [])]
      };

      const updatedUsers = state.registeredUsers.map(u => 
        u.username === state.userProfile.username ? { ...u, ...updatedProfile } : u
      );

      set({
        userProfile: updatedProfile,
        registeredUsers: updatedUsers,
        pendingEmailChange: null
      });
      return true;
    }
    return false;
  },

  // Course Management CRUD
  createCourse: (courseData) => set((state) => {
    const newId = `C${state.courses.length + 101}`;
    const newCourse: Course = { 
      ...courseData, 
      id: newId, 
      progress: 0, 
      chapters: courseData.chapters || [], 
      quizzes: courseData.quizzes || [] 
    };
    return { courses: [...state.courses, newCourse] };
  }),
  updateCourse: (updatedCourse) => set((state) => ({
    courses: state.courses.map(c => c.id === updatedCourse.id ? updatedCourse : c)
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter(c => c.id !== id)
  })),

  // Quiz Management CRUD
  createQuiz: (courseId, quizData) => set((state) => {
    const updatedCourses = state.courses.map(c => {
      if (c.id !== courseId) return c;
      const newId = `Q${(c.quizzes?.length || 0) + 101}`;
      const newQuiz: Quiz = { ...quizData, id: newId, completed: false, attemptStatus: 'Not Started' };
      return { ...c, quizzes: [...(c.quizzes || []), newQuiz] };
    });
    return { courses: updatedCourses };
  }),
  updateQuiz: (courseId, updatedQuiz) => set((state) => {
    const updatedCourses = state.courses.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, quizzes: c.quizzes?.map(q => q.id === updatedQuiz.id ? updatedQuiz : q) || [] };
    });
    return { courses: updatedCourses };
  }),
  deleteQuiz: (courseId, quizId) => set((state) => {
    const updatedCourses = state.courses.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, quizzes: c.quizzes?.filter(q => q.id !== quizId) || [] };
    });
    return { courses: updatedCourses };
  }),

  // Live Class CRUD helper
  updateLiveClass: (updatedClass) => set((state) => ({
    liveClasses: state.liveClasses.map(lc => lc.id === updatedClass.id ? updatedClass : lc)
  })),

  // Theme Settings
  darkMode: true,
  toggleDarkMode: () => set((state) => {
    const isDark = !state.darkMode;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { darkMode: isDark };
  }),
  setDarkMode: (dark) => {
    if (dark) {
       document.documentElement.classList.add('dark');
    } else {
       document.documentElement.classList.remove('dark');
    }
    set({ darkMode: dark });
  },

  // Active view routing
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab, activeCourseId: null }),

  activeCourseId: null,
  setActiveCourseId: (id) => set({ activeCourseId: id }),

  // User Profile
  userProfile: initialUserProfileStudent,
  updateUserProfile: (profile) => set((state) => ({
    userProfile: { ...state.userProfile, ...profile }
  })),

  // Earnings & Withdrawals
  earningSummary: initialEarningSummary,
  transactions: initialTransactions,
  withdrawalRequests: [
    { id: 'W1', date: '2026-06-15', amount: 250.00, status: 'Approved', bankAccount: 'HDFC Bank *2241' }
  ],

  addTransaction: (tx) => set((state) => ({
    transactions: [
      {
        ...tx,
        id: `TX${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
      },
      ...state.transactions,
    ],
    earningSummary: {
      ...state.earningSummary,
      total: Number((state.earningSummary.total + tx.amount).toFixed(2)),
      today: tx.amount > 0 ? Number((state.earningSummary.today + tx.amount).toFixed(2)) : state.earningSummary.today,
      weekly: tx.amount > 0 ? Number((state.earningSummary.weekly + tx.amount).toFixed(2)) : state.earningSummary.weekly,
      monthly: tx.amount > 0 ? Number((state.earningSummary.monthly + tx.amount).toFixed(2)) : state.earningSummary.monthly,
      available: Number((state.earningSummary.available + tx.amount).toFixed(2)),
    }
  })),

  requestWithdrawal: (amount, bankAccount) => {
    const state = get();
    // Rule: KYC verification check block
    if (state.kycRecord.status !== 'Verified') {
      return { 
        success: false, 
        message: 'Withdrawal requests are blocked. Your compliance KYC status must be fully verified.' 
      };
    }

    if (state.earningSummary.available < amount) {
      return { 
        success: false, 
        message: 'Insufficient balance available in vault.' 
      };
    }

    const newRequest: WithdrawalRequest = {
      id: `W${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      status: 'Pending',
      bankAccount
    };

    set((curr) => ({
      withdrawalRequests: [newRequest, ...curr.withdrawalRequests],
      earningSummary: {
        ...curr.earningSummary,
        available: Number((curr.earningSummary.available - amount).toFixed(2)),
        pending: Number((curr.earningSummary.pending + amount).toFixed(2)),
      }
    }));

    return { 
      success: true, 
      message: 'Withdrawal request has been registered in the audit queue.' 
    };
  },

  // Courses
  courses: initialCourses,
  updateCourseProgress: (courseId, progress) => set((state) => {
    const freshCourses = state.courses.map((course) => {
      if (course.id === courseId) {
        return { ...course, progress: Math.min(100, progress), lastActivity: new Date().toLocaleString() };
      }
      return course;
    });
    return { courses: freshCourses };
  }),

  completeChapter: (courseId, chapterId) => set((state) => {
    const updatedCourses = state.courses.map((course) => {
      if (course.id !== courseId) return course;

      const updatedChapters = course.chapters?.map((ch) => {
        if (ch.id === chapterId) {
          return { ...ch, completed: true };
        }
        return ch;
      }) || [];

      const completedCount = updatedChapters.filter(c => c.completed).length;
      const totalCount = updatedChapters.length || 1;
      const newProgress = Math.round((completedCount / totalCount) * 85);

      return {
        ...course,
        chapters: updatedChapters,
        progress: Math.min(85, Math.max(course.progress, newProgress)),
        lastActivity: new Date().toLocaleString()
      };
    });

    return { courses: updatedCourses };
  }),

  submitCourseQuiz: (courseId, quizId, score) => {
    const state = get();
    const targetCourse = state.courses.find(c => c.id === courseId);
    const targetQuiz = targetCourse?.quizzes?.find(q => q.id === quizId);

    if (targetQuiz && !targetQuiz.completed) {
      const reward = targetQuiz.reward;
      
      const updatedCourses = state.courses.map((course) => {
        if (course.id !== courseId) return course;

        const updatedQuizzes = course.quizzes?.map((qz) => {
          if (qz.id === quizId) {
            return { ...qz, completed: true, attemptStatus: 'Completed' as const };
          }
          return qz;
        }) || [];

        return {
          ...course,
          quizzes: updatedQuizzes,
          progress: 100,
          lastActivity: new Date().toLocaleString()
        };
      });

      state.addTransaction({
        description: `Academics: Passed "${targetQuiz.title}" (100% Score)`,
        category: 'Course Bonus',
        amount: reward,
        status: 'Success'
      });

      // Claim reward points too
      state.claimRewardPoints(150, `Completed quiz for ${targetCourse.title}`);

      set({ courses: updatedCourses });
    }
  },

  // Live Classes Management
  liveClasses: initialLiveClasses,

  createLiveClass: (classData) => set((state) => {
    const newId = `LC${state.liveClasses.length + 1}`;
    const newClass: LiveClass = {
      ...classData,
      id: newId,
      status: 'Upcoming',
      countdown: '02:00:00'
    };
    return {
      liveClasses: [...state.liveClasses, newClass]
    };
  }),

  startLiveClass: (id) => set((state) => {
    const updated = state.liveClasses.map((item) => {
      if (item.id === id) {
        return { ...item, status: 'LIVE' as const };
      }
      return item;
    });
    return { liveClasses: updated };
  }),

  endLiveClass: (id, recordingLink) => set((state) => {
    const updated = state.liveClasses.map((item) => {
      if (item.id === id) {
        return { ...item, status: 'Completed' as const, recordingLink };
      }
      return item;
    });
    return { liveClasses: updated };
  }),

  deleteLiveClass: (id) => set((state) => ({
    liveClasses: state.liveClasses.filter(c => c.id !== id)
  })),

  joinLiveClass: (id) => {
    console.log(`Joined live class session: ${id}`);
  },

  // Ongoing Quizzes
  ongoingQuizzes: initialOngoingQuizzes,

  completeOngoingQuiz: (quizId, answers) => {
    const state = get();
    const quiz = state.ongoingQuizzes.find(q => q.id === quizId);
    if (quiz && !quiz.completed) {
      const updatedQuizzes = state.ongoingQuizzes.map(q => {
        if (q.id === quizId) {
          return { ...q, completed: true, attemptStatus: 'Completed' as const };
        }
        return q;
      });

      state.addTransaction({
        description: `Bounty: Completed Ongoing Quiz "${quiz.title}"`,
        category: 'Reward',
        amount: quiz.reward,
        status: 'Success'
      });

      state.claimRewardPoints(50, `Passed ongoing quiz ${quiz.title}`);

      set({ ongoingQuizzes: updatedQuizzes });
    }
  },

  // Assignments
  assignments: initialAssignments,

  submitAssignment: (id, fileName) => set((state) => {
    const updated = state.assignments.map((as) => {
      if (as.id === id) {
        return { ...as, status: 'Submitted' as const, submissionFile: fileName, submittedAt: new Date().toLocaleString() };
      }
      return as;
    });
    return { assignments: updated };
  }),

  gradeAssignment: (id, grade, feedback) => set((state) => {
    const updated = state.assignments.map((as) => {
      if (as.id === id) {
        return { ...as, status: 'Graded' as const, grade, feedback };
      }
      return as;
    });
    return { assignments: updated };
  }),

  // Reward Points
  rewardPoints: {
    points: 1250,
    history: [
      { id: 'RH1', description: 'Passed Spoken English Quiz', points: 100, date: '2026-06-22' },
      { id: 'RH2', description: 'Signed in daily for 5 days', points: 50, date: '2026-06-21' }
    ]
  },

  claimRewardPoints: (points, description) => set((state) => ({
    rewardPoints: {
      points: state.rewardPoints.points + points,
      history: [
        {
          id: `RH${Math.floor(100 + Math.random() * 900)}`,
          description,
          points,
          date: new Date().toISOString().split('T')[0]
        },
        ...state.rewardPoints.history
      ]
    }
  })),

  // Announcements & Notifications
  announcements: initialAnnouncements,
  notificationsList: initialNotifications,

  markNotificationRead: (id) => set((state) => ({
    notificationsList: state.notificationsList.map(n => 
      n.id === id ? { ...n, unread: false } : n
    )
  })),

  // Team & Referrals
  teamMembers: initialTeamMembers,

  toggleTeamMemberChronology: (memberId) => set((state) => {
    const updatedMembers = state.teamMembers.map((member): TeamMember => {
      if (member.id === memberId) {
        const nextStatus: 'IN' | 'OUT' = member.status === 'IN' ? 'OUT' : 'IN';
        
        if (nextStatus === 'IN') {
          setTimeout(() => {
            state.addTransaction({
              description: `Chronology: ${member.name} activated portfolio`,
              category: 'Referral',
              amount: 25.00,
              status: 'Success'
            });
            
            set((nestedState) => ({
              teamMembers: nestedState.teamMembers.map((m): TeamMember => 
                m.id === memberId ? { ...m, commissionEarned: m.commissionEarned + 25 } : m
              )
            }));
          }, 300);
        }

        return { ...member, status: nextStatus };
      }
      return member;
    });

    return { teamMembers: updatedMembers };
  }),

  addTeamMember: (member) => set((state) => {
    const newId = `M${100 + state.teamMembers.length + 1}`;
    const newMember: TeamMember = {
      ...member,
      id: newId,
      joinDate: new Date().toISOString().split('T')[0],
      commissionEarned: member.status === 'IN' ? 25.00 : 0.00,
    };

    if (member.status === 'IN') {
      setTimeout(() => {
        state.addTransaction({
          description: `Chronology: Added new active referral ${member.name}`,
          category: 'Referral',
          amount: 25.00,
          status: 'Success'
        });
      }, 200);
    }

    return {
      teamMembers: [...state.teamMembers, newMember]
    };
  }),

  leftTeamBV: 11000,
  rightTeamBV: 14000,

  addLeftBV: (bv) => set((state) => ({ leftTeamBV: state.leftTeamBV + bv })),
  addRightBV: (bv) => set((state) => ({ rightTeamBV: state.rightTeamBV + bv })),

  claimMatchingBonus: () => {
    const state = get();
    const matchVal = Math.min(state.leftTeamBV, state.rightTeamBV);
    if (matchVal <= 0) return;
    
    const reward = (matchVal / 1000) * 120;
    const newLeft = state.leftTeamBV - matchVal;
    const newRight = state.rightTeamBV - matchVal;

    state.addTransaction({
      description: `Matching: Binary BV Matched ${matchVal} BV`,
      category: 'Referral',
      amount: reward,
      status: 'Success'
    });

    set({ leftTeamBV: newLeft, rightTeamBV: newRight });
  },

  // ERPNext KYC Record
  kycRecord: initialKYCRecord,

  updateKycPersonal: (personal) => set((state) => ({
    kycRecord: { ...state.kycRecord, personal }
  })),

  updateKycIdentity: (identity) => set((state) => ({
    kycRecord: { ...state.kycRecord, identity }
  })),

  updateKycBank: (bank) => set((state) => ({
    kycRecord: { ...state.kycRecord, bank }
  })),

  uploadKycDoc: (field, fileName) => set((state) => ({
    kycRecord: {
      ...state.kycRecord,
      uploads: {
        ...state.kycRecord.uploads,
        [field]: fileName
      }
    }
  })),

  submitKycForVerification: () => set((state) => {
    // Submitting updates status to Pending Verification
    setTimeout(() => {
      // Mock automatic verification success after 3 seconds
      get().setKycVerificationStatus('Verified');
    }, 3000);

    return {
      kycRecord: {
        ...state.kycRecord,
        status: 'Pending Verification'
      }
    };
  }),

  setKycVerificationStatus: (status) => set((state) => ({
    kycRecord: { ...state.kycRecord, status }
  })),

  resetKycRecord: () => set(() => ({
    kycRecord: {
      status: 'Draft',
      personal: { fullName: '', mobile: '', email: '' },
      identity: { aadhaarNumber: '', panNumber: '' },
      bank: { bankName: '', accountHolder: '', accountNumber: '', ifsc: '' },
      uploads: {}
    }
  })),
}));
