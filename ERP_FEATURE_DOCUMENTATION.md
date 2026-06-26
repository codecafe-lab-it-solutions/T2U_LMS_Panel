# T2U LMS – ERP Feature Documentation

## 1. Project Overview
T2U LMS is a React + TypeScript-based learning and engagement dashboard designed for a multi-role education and referral platform. The application provides two main user panels:

- Student Panel
- Instructor Panel

The project currently uses a mock-data-driven UI with Zustand for state management and React Query for data handling.

## 2. Objective
The application simulates an LMS experience where users can:

- access a personalized dashboard,
- enroll in and continue courses,
- attempt quizzes,
- submit assignments,
- participate in a referral and genealogy system,
- complete KYC verification,
- and interact with instructor-managed learning modules.

This documentation is prepared for ERP testing and feature validation.

---

## 3. User Roles

### 3.1 Student Panel
Used for learners who can:
- view their personal dashboard,
- manage course progress,
- take quizzes,
- submit assignments,
- access referral and team data,
- complete KYC verification.

### 3.2 Instructor Panel
Used for educators who can:
- manage courses,
- create and edit quizzes,
- review assignments,
- grade submissions,
- monitor course-related activity.

---

## 4. Core Application Structure

### Main Application Shell
Implemented in [src/App.tsx](src/App.tsx)

Provides:
- authentication-aware layout,
- sidebar and header navigation,
- tab-based routing for different modules,
- role-based rendering for student and instructor views.

### State Management
Implemented in [src/store/useAppStore.ts](src/store/useAppStore.ts)

Handles:
- authentication state,
- user profile,
- course data,
- quiz data,
- assignment data,
- referral/team data,
- KYC state,
- live classes.

### Mock Data Layer
Implemented in [src/services/mockApi.ts](src/services/mockApi.ts)

Used to simulate:
- course fetches,
- learning progress,
- quiz content,
- assignment records,
- referral and team activity.

---

## 5. Student Panel Features

### 5.1 Personal Dashboard
Implemented in [src/components/HomeDashboard.tsx](src/components/HomeDashboard.tsx)

#### Purpose
The personal dashboard acts as the student landing page and provides a centralized view of learning progress and activity.

#### Implemented Features
- welcome section with user identity,
- summary cards for enrolled courses and learning activity,
- quick access to courses,
- live class highlights,
- upcoming learning-related actions,
- quiz and assignment previews,
- role-based UI for student experience.

#### ERP Test Points
- Verify the dashboard loads successfully after login.
- Confirm cards and sections render correctly.
- Check that course and quiz previews display expected details.
- Validate navigation buttons redirect to the correct modules.

---

### 5.2 Courses Module
Implemented in [src/components/LearningSection.tsx](src/components/LearningSection.tsx)

#### Purpose
Provides the student learning experience and course browsing interface.

#### Implemented Features
- My Courses view with tabs:
  - Enrolled
  - Live
  - New
  - Upcoming
- course cards with progress indicators,
- course selection and continue-learning action,
- chapter-based learning workspace,
- progress tracking,
- course detail page experience.

#### ERP Test Points
- Verify the Courses page opens without blank state.
- Confirm tab switching filters course cards correctly.
- Validate course cards show correct titles, categories, progress, and status.
- Check that selecting a course opens the learning workspace.

---

### 5.3 Quizzes Module
Implemented in [src/components/LearningSection.tsx](src/components/LearningSection.tsx)

#### Purpose
Lets students test knowledge within the course flow.

#### Implemented Features
- quiz entry from the course workspace,
- multiple-choice question display,
- answer selection,
- progression to next question,
- quiz completion state,
- reward/credit-style completion feedback.

#### ERP Test Points
- Verify a quiz can be started from a course.
- Confirm answer selection works.
- Validate next-question flow behaves correctly.
- Check that completion state updates and shows success feedback.

---

### 5.4 Assignments Module
Implemented in [src/components/StudentModules.tsx](src/components/StudentModules.tsx)

#### Purpose
Allows students to manage academic submissions and view grading outcomes.

#### Implemented Features
- assignment list view,
- assignment status display,
- submission upload modal,
- mock file upload flow,
- graded assignment result display,
- feedback and score presentation.

#### ERP Test Points
- Verify assignment cards render correctly.
- Confirm “Not Started” assignments can be submitted.
- Check that submission modal opens and accepts input.
- Validate grading and feedback appear after submission.

---

### 5.5 Referral Dashboard System
Implemented in [src/components/StudentModules.tsx](src/components/StudentModules.tsx)

#### Purpose
Shows the student’s referral and invite experience.

#### Implemented Features
- referral code generation,
- copy-to-clipboard referral link action,
- referral-based reward and engagement context,
- user profile and settings management,
- notification and team-related UI sections.

#### ERP Test Points
- Verify the referral code is displayed.
- Check that the copy action works.
- Confirm referral-related UI renders correctly.

---

### 5.6 Genealogy Module
Implemented in [src/components/GenealogyTree.tsx](src/components/GenealogyTree.tsx)

#### Purpose
Represents a binary team/downline structure with matching bonus logic.

#### Implemented Features
- left and right team BV summary cards,
- matching bonus estimation,
- claim bonus action,
- search and filter for users by name/username,
- BV and sales threshold filtering,
- downline node display with visual grouping.

#### ERP Test Points
- Verify left and right team statistics render.
- Confirm adding BV updates the totals.
- Check that matching bonus is calculated correctly.
- Validate claim bonus is disabled when no matched BV exists.
- Confirm filtering/search behavior works.

---

### 5.7 KYC Module
Implemented in [src/components/KYCVerification.tsx](src/components/KYCVerification.tsx)

#### Purpose
Provides the identity verification flow for users to unlock payout and compliance actions.

#### Implemented Features
- multi-step KYC wizard with four sections:
  - Personal details
  - Identity credentials
  - Banking settings
  - Document uploads
- form input handling,
- mock document upload flow,
- submission status handling,
- verification status UI for Draft, Pending, Verified, and Rejected states.

#### ERP Test Points
- Verify the KYC wizard opens and displays steps correctly.
- Confirm form inputs can be filled and saved.
- Check that document upload actions trigger the expected state.
- Validate form completeness and submission behavior.
- Ensure status states are visually reflected.

---

## 6. Instructor Panel Features

### 6.1 Personal Dashboard
Implemented in [src/components/HomeDashboard.tsx](src/components/HomeDashboard.tsx)

#### Purpose
Provides an instructor overview of platform activity and administrative priorities.

#### Implemented Features
- instructor welcome section,
- summary cards for total courses, students, live classes, pending assignments, and earnings,
- live class schedule management overview,
- assignment review preview.

#### ERP Test Points
- Verify the instructor dashboard loads when the instructor role is active.
- Confirm stats and summary cards render correctly.
- Check that navigation actions lead to relevant instructor modules.

---

### 6.2 Course Management
Implemented in [src/components/InstructorModules.tsx](src/components/InstructorModules.tsx)

#### Purpose
Allows instructors to manage the course catalog.

#### Implemented Features
- view all assigned courses,
- create new course,
- edit existing course,
- delete course,
- manage course metadata such as title, description, category, thumbnail, and duration.

#### ERP Test Points
- Verify course cards appear for the instructor view.
- Confirm add/edit/delete actions work.
- Check that course changes are reflected in the UI.

---

### 6.3 Quiz Management
Implemented in [src/components/InstructorModules.tsx](src/components/InstructorModules.tsx)

#### Purpose
Allows instructors to create or update quizzes and link them to courses.

#### Implemented Features
- view existing quizzes,
- create new quiz,
- edit quiz details,
- delete quiz,
- assign quiz to a course.

#### ERP Test Points
- Verify quizzes appear in the instructor module.
- Confirm quiz form works for create and edit operations.
- Check that quiz deletion updates the view.

---

### 6.4 Assignment Review and Grading
Implemented in [src/components/InstructorModules.tsx](src/components/InstructorModules.tsx)

#### Purpose
Enables instructors to review and grade student submissions.

#### Implemented Features
- assignment review list,
- grade submission modal,
- feedback input,
- grade update action,
- assignment status update.

#### ERP Test Points
- Verify assignment review entries render.
- Confirm grading form opens and accepts input.
- Check that grade and feedback update the assignment state.

---

## 7. Shared UI Components
Implemented in the following files:
- [components/ui/button.tsx](components/ui/button.tsx)
- [components/ui/card.tsx](components/ui/card.tsx)
- [components/ui/dialog.tsx](components/ui/dialog.tsx)
- [components/ui/input.tsx](components/ui/input.tsx)
- [components/ui/label.tsx](components/ui/label.tsx)
- [components/ui/progress.tsx](components/ui/progress.tsx)

These components support consistent styling across student and instructor experiences.

---

## 8. Current Implementation Notes
The current build is a polished UI-based prototype and demo experience. Most features are implemented using mock data and local app state rather than a connected backend.

### Current Scope
- frontend UI and interaction flows,
- mock learning and engagement scenarios,
- role-based navigation and screen rendering,
- interactive state changes for progress, quiz completion, assignment submission, and KYC flow.

### Notable Limitation
- Data persistence is not backed by a real database or API service in the current implementation.

---

## 9. ERP Acceptance Checklist

### Student Panel
- [ ] Dashboard loads correctly
- [ ] Courses page renders without error
- [ ] Course tabs filter content correctly
- [ ] Quiz flow works end-to-end
- [ ] Assignment submission flow works
- [ ] Referral dashboard is visible and usable
- [ ] Genealogy view renders and updates correctly
- [ ] KYC wizard completes expected steps

### Instructor Panel
- [ ] Instructor dashboard renders correctly
- [ ] Course management actions work
- [ ] Quiz management actions work
- [ ] Assignment grading flow works

---

## 10. Recommended Testing Summary for ERP
For ERP testing, the main validation focus should be:

1. Screen rendering correctness
2. Role-based access and visibility
3. Interaction flow for course, quiz, assignment, referral, genealogy, and KYC modules
4. State updates after user actions
5. UI consistency across student and instructor panels

---

## 11. Summary
The implemented system covers a complete student and instructor learning experience with:
- personal dashboard,
- course learning,
- quizzes,
- assignments,
- referral dashboard,
- genealogy and matching logic,
- KYC verification,
- instructor course and quiz management.

This is ready for UI-focused ERP validation and feature review.
