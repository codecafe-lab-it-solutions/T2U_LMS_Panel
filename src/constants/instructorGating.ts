import type { ActiveTab } from '../types';

// Tabs that let an instructor actually "handle" instructor duties (create/manage courses,
// live classes, quizzes, assignments, batches). Locked until admin approval — everything
// else (KYC, profile, notifications, browsing, MLM/referral tabs) stays open.
export const INSTRUCTOR_MANAGEMENT_TABS = new Set<ActiveTab>([
  'course-management', 'quiz-management', 'assignment-management', 'student-analytics',
  'instructor-courses', 'live-class-analytics', 'instructor-course-detail',
  'instructor-batch-create', 'instructor-batch-manage', 'instructor-withdrawals',
  'instructor-quiz-create', 'instructor-quiz-edit', 'instructor-course-create', 'live-class-management',
]);
