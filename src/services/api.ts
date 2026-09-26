const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:3040/api`;
  }
  return 'http://localhost:3040/api';
};

const BASE_URL = getApiBaseUrl();

// ── Media URL helper ─────────────────────────────────────────────────────────
// Uploaded files are stored as relative paths like /api/upload/filename.jpg
// Convert them to absolute URLs pointing at the API server.
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Only API-hosted uploads (/api/upload/...) live on the API origin; other relative paths such as
  // /images/english.png are static assets served by the frontend itself.
  if (!url.startsWith('/api/')) return url;
  return `${SERVER_ORIGIN}${url}`;
}

// ── Token helpers ────────────────────────────────────────────────────────────
export const TOKEN_KEY = 't2u-jwt';
export const EMPLOYEE_TOKEN_KEY = 't2u-employee-jwt';

// Employees reuse the exact same Admin*.tsx components (and therefore the exact same
// api.* calls) as real admins, gated purely by backend permission checks — so this falls
// back to the employee token when no User token is present, letting every existing call
// site work unmodified for an employee session. Only one of the two is ever populated at
// once (each login flow clears the other), so this fallback is unambiguous.
export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(EMPLOYEE_TOKEN_KEY); } catch { return null; }
}
export function storeToken(t: string): void {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ }
}
export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// ── Error handling utility ───────────────────────────────────────────────────
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || String(err);
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.msg === 'string') return obj.msg;
    if (typeof obj.detail === 'string') return obj.detail;
  }
  return 'An unknown error occurred';
}

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API response types ───────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  referral_code: string;
  kyc_status: string;
  profile_photo_url: string | null;
  bio: string | null;
  created_at?: string;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  bank_holder_name: string | null;
  course_upload_approved?: boolean;
  father_name?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dob?: string | null;
  address?: string | null;
  nominee_name?: string | null;
  nominee_dob?: string | null;
  nominee_mobile?: string | null;
  nominee_relationship?: string | null;
}

export interface ApiIntegrationSettings {
  smtp_host: string;
  smtp_port: number | null;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_from: string;
  smtp_pass_configured: boolean;
  meta_whatsapp_phone_number_id: string;
  meta_whatsapp_api_version: string;
  meta_whatsapp_token_configured: boolean;
  support_whatsapp_number: string;
  env_fallback_available: { email: boolean; whatsapp: boolean };
}

export interface ApiNotificationTemplate {
  event_type: string;
  label: string;
  description: string;
  variables: string[];
  email_enabled: boolean;
  email_subject: string;
  email_body: string;
  whatsapp_enabled: boolean;
  whatsapp_template_name: string;
  whatsapp_language_code: string;
  whatsapp_param_order: string[];
  whatsapp_fallback_body: string;
}

export interface ApiEnrolledCourse {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  completion_status: string;
  course: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail_url: string | null;
    duration_hrs: number | null;
    status: string;
    instructor: { full_name: string; profile_photo_url: string | null };
    modules: Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        type: string;
        content_url: string | null;
        duration_mins: number | null;
        is_free_preview: boolean;
      }>;
    }>;
    quizzes: Array<{ id: string; title: string; passing_score: number; time_limit_mins: number | null; deadline: string | null }>;
    assignments: Array<{ id: string; title: string; due_date: string; description: string; max_score: number }>;
    _count: { modules: number };
  };
  lesson_progress: Array<{ id: string; lesson_id: string; completed: boolean }>;
  completion_percentage: number;
}

export interface ApiAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  course: { id: string; title: string };
  instructor: { full_name: string };
  my_submission: {
    id: string;
    file_url: string;
    submitted_at: string;
    grade: string | null;
    feedback: string | null;
  } | null;
}

export interface ApiCertificate {
  id: string;
  certificate_no: string;
  issued_at: string;
  pdf_url: string | null;
  course: { title: string; thumbnail_url: string | null; category: string };
}

export interface ApiKyc {
  id: string;
  user_id: string;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  pan_url: string | null;
  selfie_url: string | null;
  status: 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
}

export interface ApiWithdrawal {
  id: string;
  amount: number;
  bank_account_no: string;
  bank_ifsc: string;
  bank_name: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  utr_number: string | null;
  created_at: string;
  notes: string | null;
}

export interface ApiCommission {
  id: string;
  type: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  note: string | null;
}

export interface ApiMlmNode {
  id: string;
  full_name: string;
  referral_code: string;
  total_bv: number;
  left_bv: number;
  right_bv: number;
  matched_bv_left: number;
  matched_bv_right: number;
  kyc_status: string;
  profile_photo_url: string | null;
  is_active: boolean;
  package: { name: string } | null;
  left: ApiMlmNode | null;
  right: ApiMlmNode | null;
}

export interface ApiPackage {
  id: string;
  name: string;
  price: number;
  bv: number;
  dsi_reward: number;
  description: string | null;
  features: Record<string, unknown> | null;
  is_active: boolean;
}

export interface ApiIncomeSummary {
  today: number;
  weekly: number;
  monthly: number;
  lifetime: number;
  available: number;
  pending: number;
  withdrawn: number;
  by_type: {
    dsi: number;
    gen2: number;
    gen3: number;
    binary: number;
    car_fund: number;
    house_fund: number;
    royalty: number;
    instructor_commission: number;
  };
  by_generation: Array<{ level: number; code: string; name: string; rate: number | null; amount: number }>;
  generational_total: number;
}

export interface ApiBvSummary {
  left_bv: number;
  right_bv: number;
  total_personal_bv: number;
  matched_bv_left: number;
  matched_bv_right: number;
  carry_forward_left: number;
  carry_forward_right: number;
  available_left: number;
  available_right: number;
  today_bv: number;
  weekly_bv: number;
  monthly_bv: number;
  lifetime_matched_bv: number;
  lifetime_binary_bonus: number;
  match_logs: Array<{ id: string; matched_bv: number; bonus_amount: number; capped: boolean; matching_date: string }>;
}

export interface ApiMilestone {
  id: string;
  name: string;
  required_bv: number;
  required_left_bv: number | null;
  required_right_bv: number | null;
  reward_desc: string;
  cash_value: number;
  order_index: number;
  is_active: boolean;
  user_left_bv: number;
  user_right_bv: number;
  left_progress: number;
  right_progress: number;
  overall_progress: number;
  achieved: boolean;
  achieved_at: string | null;
  claim_request: {
    id: string;
    status: string;
    cash_opted: boolean;
    claim_date: string;
    admin_note: string | null;
    delivery_info: string | null;
  } | null;
}

export interface ApiTeam {
  direct_team: Array<{
    id: string;
    full_name: string;
    email: string;
    referral_code: string;
    profile_photo_url: string | null;
    kyc_status: string;
    is_active: boolean;
    total_bv: number;
    left_bv: number;
    right_bv: number;
    binary_position: string | null;
    created_at: string;
    total_earnings: number;
    package: { name: string } | null;
  }>;
  direct_count: number;
  active_count: number;
  inactive_count: number;
  left_count: number;
  right_count: number;
  left_bv: number;
  right_bv: number;
  total_bv: number;
  referral_code: string;
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface ApiLiveClass {
  id: string;
  title: string;
  description: string | null;
  zoom_meeting_id: string | null;
  scheduled_at: string;
  status: string;
  recording_url: string | null;
  course: { id: string; title: string };
  instructor: { full_name: string };
}

export interface ApiBundleCourse {
  id: string;
  title: string;
  slug: string | null;
  thumbnail_url: string | null;
  short_desc: string | null;
  category: string | null;
  duration_hrs: number | null;
  price: number | string | null;
  status: string;
  deleted_at: string | null;
  order_index: number;
  available: boolean;
  instructor: { full_name: string } | null;
  _count: { modules: number; enrollments: number };
  enrollment_status?: string | null;
}

export interface ApiCourseBundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_desc: string | null;
  thumbnail_url: string | null;
  price: number | string | null;
  bv_credit?: number | string | null;
  distributor_price?: number | string | null;
  referral_discount_percent?: number | string | null;
  makes_distributor?: boolean;
  is_active: boolean;
  is_featured: boolean;
  gst_category_id: string | null;
  gst_category: { id: string; name: string; gst_rate: number | string } | null;
  courses: ApiBundleCourse[];
  course_count: number;
  courses_total_value: number;
  enrollment_count?: number;
  my_enrollment?: { id: string; payment_status: string; enrolled_at: string; payment_note: string | null } | null;
  owned_course_ids?: string[];
}

export interface ApiMyBundleEnrollment {
  id: string;
  bundle_id: string;
  payment_status: 'pending' | 'approved' | 'rejected';
  payment_note: string | null;
  enrolled_at: string;
  price_charged: number | string | null;
  bundle: Omit<ApiCourseBundle, 'courses'>;
  courses: ApiBundleCourse[];
}

export interface ApiBundleInput {
  name?: string;
  description?: string | null;
  short_desc?: string | null;
  thumbnail_url?: string | null;
  price?: number | string | null;
  bv_credit?: number | string | null;
  distributor_price?: number | string | null;
  referral_discount_percent?: number | string | null;
  makes_distributor?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  gst_category_id?: string | null;
  course_ids?: string[];
}

// ── Named API surface ────────────────────────────────────────────────────────
export const api = {
  courseBundles: {
    list: () => call<{ bundles: ApiCourseBundle[]; total: number }>('GET', '/course-bundles').then(r => r.bundles),
    get: (idOrSlug: string) => call<ApiCourseBundle>('GET', `/course-bundles/${encodeURIComponent(idOrSlug)}`),
    mine: () => call<ApiMyBundleEnrollment[]>('GET', '/course-bundles/my/enrollments'),
    pricing: (id: string, referralCode?: string) =>
      call<{ base_price: number; mrp: number; discount_amount: number; final_price: number; is_distributor: boolean; distributor_price_applied: boolean; referral_valid: boolean }>(
        'GET', `/course-bundles/${id}/pricing${referralCode ? `?referral_code=${encodeURIComponent(referralCode)}` : ''}`),
    enroll: (id: string, data: { transaction_id?: string; screenshot_url?: string; referral_code?: string }) =>
      call<any>('POST', `/course-bundles/${id}/enroll`, data),
    adminList: () => call<{ bundles: ApiCourseBundle[]; total: number }>('GET', '/course-bundles/admin/all').then(r => r.bundles),
    create: (data: ApiBundleInput) => call<ApiCourseBundle>('POST', '/course-bundles', data),
    update: (id: string, data: ApiBundleInput) => call<ApiCourseBundle>('PUT', `/course-bundles/${id}`, data),
    remove: (id: string) => call<{ success: boolean }>('DELETE', `/course-bundles/${id}`),
    courses: (id: string) => call<ApiBundleCourse[]>('GET', `/course-bundles/${id}/courses`),
    addCourse: (id: string, course_id: string) => call<ApiBundleCourse[]>('POST', `/course-bundles/${id}/courses`, { course_id }),
    removeCourse: (id: string, courseId: string) => call<ApiBundleCourse[]>('DELETE', `/course-bundles/${id}/courses/${courseId}`),
    reorderCourses: (id: string, course_ids: string[]) => call<ApiBundleCourse[]>('PUT', `/course-bundles/${id}/courses/order`, { course_ids }),
    adminEnrollments: (params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ enrollments: any[]; total: number }>('GET', `/course-bundles/admin/enrollments${q ? `?${q}` : ''}`);
    },
    approveEnrollment: (id: string) => call<any>('PATCH', `/course-bundles/admin/enrollments/${id}/approve`),
    rejectEnrollment: (id: string, note?: string) => call<any>('PATCH', `/course-bundles/admin/enrollments/${id}/reject`, { note }),
  },
  auth: {
    login: (email: string, password: string) =>
      call<{ token: string; user: ApiUser }>('POST', '/auth/login', { email, password }),
    register: (data: {
      full_name: string; email: string; phone: string; password: string;
      referred_by_code?: string; role?: string;
      father_name?: string; gender?: 'male' | 'female' | 'other'; dob?: string; address?: string;
      requested_position?: 'left' | 'right';
      nominee_name?: string; nominee_dob?: string; nominee_mobile?: string; nominee_relationship?: string;
    }) =>
      call<{ token: string; user: ApiUser }>('POST', '/auth/register', data),
    me: () => call<ApiUser>('GET', '/auth/me'),
    forgotPassword: (email: string) =>
      call<{ message: string }>('POST', '/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      call<{ success: boolean; message: string }>('POST', '/auth/reset-password', { token, password }),
    updateProfile: (data: Partial<{
      full_name: string; phone: string; email: string; profile_photo_url: string; bio: string;
      father_name: string; gender: 'male' | 'female' | 'other'; dob: string; address: string;
      nominee_name: string; nominee_dob: string; nominee_mobile: string; nominee_relationship: string;
    }>) =>
      call<ApiUser>('PATCH', '/auth/profile', data),
  },
  courses: {
    enrolled: () => call<ApiEnrolledCourse[]>('GET', '/courses/enrolled'),
    instructor: () => call<any[]>('GET', '/courses/instructor'),
    analytics: () => call<any>('GET', '/courses/analytics'),
    list: () => call<{ courses: any[]; total: number }>('GET', '/courses').then(r => r.courses),
    listAll: () => call<{ courses: any[]; total: number }>('GET', '/courses?all=1').then(r => r.courses),
    enroll: (id: string) => call<any>('POST', `/courses/${id}/enroll`),
    enrollWithPayment: (id: string, data: { transaction_id: string; screenshot_url?: string; referral_code?: string; batch_id?: string }) =>
      call<any>('POST', `/courses/${id}/enroll`, data),
    batches: (id: string) => call<any[]>('GET', `/courses/${id}/batches`),
    pricing: (id: string, referralCode?: string) =>
      call<{ base_price: number; discount_amount: number; final_price: number; is_distributor: boolean; distributor_price_applied: boolean; referral_valid: boolean; bv_amount: number }>(
        'GET', `/courses/${id}/pricing${referralCode ? `?referral_code=${encodeURIComponent(referralCode)}` : ''}`
      ),
    adminEnrollments: (params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ enrollments: any[]; total: number }>('GET', `/courses/admin/enrollments${q ? `?${q}` : ''}`);
    },
    approveEnrollment: (id: string) => call<any>('PATCH', `/courses/admin/enrollments/${id}/approve`),
    rejectEnrollment: (id: string, note?: string) =>
      call<any>('PATCH', `/courses/admin/enrollments/${id}/reject`, { note }),
    assignBatch: (id: string, batchId: string | null) =>
      call<any>('PATCH', `/courses/admin/enrollments/${id}/batch`, { batch_id: batchId }),
    get: (id: string) => call<any>('GET', `/courses/${id}`),
    getPublic: (idOrSlug: string) => call<any>('GET', `/courses/${encodeURIComponent(idOrSlug)}?outline=1`),
    create: (data: any) => call<any>('POST', '/courses', data),
    update: (id: string, data: any) => call<any>('PATCH', `/courses/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/courses/${id}`),
    markLessonComplete: (courseId: string, lessonId: string) =>
      call<{ success: boolean; completion_percentage: number }>('POST', `/courses/${courseId}/lessons/${lessonId}/complete`),
    modules: {
      list: (courseId: string) => call<any[]>('GET', `/courses/${courseId}/modules`),
      create: (courseId: string, data: { title: string; description?: string }) => call<any>('POST', `/courses/${courseId}/modules`, data),
      update: (courseId: string, moduleId: string, data: { title?: string; description?: string }) => call<any>('PATCH', `/courses/${courseId}/modules/${moduleId}`, data),
      delete: (courseId: string, moduleId: string) => call<{ success: boolean }>('DELETE', `/courses/${courseId}/modules/${moduleId}`),
      lessons: {
        create: (courseId: string, moduleId: string, data: any) => call<any>('POST', `/courses/${courseId}/modules/${moduleId}/lessons`, data),
        update: (courseId: string, moduleId: string, lessonId: string, data: any) => call<any>('PATCH', `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data),
        delete: (courseId: string, moduleId: string, lessonId: string) => call<{ success: boolean }>('DELETE', `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
      },
    },
  },
  platformSettings: {
    get: () => call<{ settings: any[]; map: Record<string, string> }>('GET', '/settings'),
    updateKey: (key: string, value: string) => call<any>('PATCH', `/settings/${key}`, { value }),
    getPublic: () => call<{ map: Record<string, string> }>('GET', '/settings/public'),
  },
  users: {
    instructors: () => call<any[]>('GET', '/users/instructors'),
    students: () => call<{ users: any[]; total: number }>('GET', '/users?role=student&limit=200').then(r => r.users),
    list: (params?: { role?: string; search?: string; page?: number }) => {
      const q = params ? Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${v}`).join('&') : '';
      return call<{ users: any[]; total: number }>('GET', q ? `/users?${q}` : '/users');
    },
  },
  batches: {
    list: (params?: { course_id?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.course_id) q.set('course_id', params.course_id);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return call<{ batches: any[]; total: number }>('GET', `/batches${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => call<any>('GET', `/batches/${id}`),
    create: (data: any) => call<any>('POST', '/batches', data),
    update: (id: string, data: any) => call<any>('PATCH', `/batches/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/batches/${id}`),
    addInstructor: (batchId: string, userId: string, commissionPercent?: number) =>
      call<any>('POST', `/batches/${batchId}/instructors`, { user_id: userId, commission_percent: commissionPercent }),
    removeInstructor: (batchId: string, userId: string) => call<{ success: boolean }>('DELETE', `/batches/${batchId}/instructors/${userId}`),
    updateInstructorCommission: (batchId: string, userId: string, commissionPercent: number) =>
      call<any>('PATCH', `/batches/${batchId}/instructors/${userId}`, { commission_percent: commissionPercent }),
    addCourse: (batchId: string, courseId: string) => call<any>('POST', `/batches/${batchId}/courses`, { course_id: courseId }),
    removeCourse: (batchId: string, courseId: string) => call<{ success: boolean }>('DELETE', `/batches/${batchId}/courses/${courseId}`),
    enrollStudents: (batchId: string, student_ids: string[]) => call<{ success: boolean; enrolled: number; students: number; courses: number }>('POST', `/batches/${batchId}/enroll-students`, { student_ids }),
    enrolledStudents: (batchId: string, params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return call<{ students: any[]; total: number }>('GET', `/batches/${batchId}/enrolled-students${qs ? '?' + qs : ''}`);
    },
  },
  quizzes: {
    list: (params?: { course_id?: string; module_id?: string }) => {
      const q = params ? Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&') : '';
      return call<any[]>('GET', q ? `/quizzes?${q}` : '/quizzes');
    },
    get: (id: string) => call<any>('GET', `/quizzes/${id}`),
    create: (data: any) => call<any>('POST', '/quizzes', data),
    update: (id: string, data: any) => call<any>('PATCH', `/quizzes/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/quizzes/${id}`),
    submit: (id: string, data: any) => call<any>('POST', `/quizzes/${id}/submit`, data),
    myResult: (id: string) => call<any>('GET', `/quizzes/${id}/my-result`),
    questions: {
      create: (quizId: string, data: any) => call<any>('POST', `/quizzes/${quizId}/questions`, data),
      delete: (quizId: string, questionId: string) => call<{ success: boolean }>('DELETE', `/quizzes/${quizId}/questions/${questionId}`),
      update: (quizId: string, qid: string, data: any) => call<any>('PATCH', `/quizzes/${quizId}/questions/${qid}`, data),
    },
  },
  assignments: {
    my: () => call<ApiAssignment[]>('GET', '/assignments/my'),
    list: (courseId?: string, page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (courseId) q.set('course_id', courseId);
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      const qs = q.toString();
      return call<{ assignments: any[]; total: number; distinct_courses: number }>('GET', `/assignments${qs ? '?' + qs : ''}`);
    },
    create: (data: { course_id: string; title: string; description: string; due_date: string; max_score?: number }) =>
      call<any>('POST', '/assignments', data),
    submissions: (status?: 'pending' | 'graded', page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (status) q.set('status', status);
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      const qs = q.toString();
      return call<{ submissions: any[]; total: number }>('GET', `/assignments/submissions${qs ? '?' + qs : ''}`);
    },
    grade: (submissionId: string, grade: string, feedback?: string) =>
      call<any>('PATCH', `/assignments/submissions/${submissionId}/grade`, { grade, feedback }),
    submit: (id: string, file_url: string) =>
      call<{ id: string }>('POST', `/assignments/${id}/submit`, { file_url }),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/assignments/${id}`),
  },
  certificates: {
    my: () => call<ApiCertificate[]>('GET', '/certificates/my'),
  },
  kyc: {
    me: () => call<any>('GET', '/kyc/me'),
    saveDraft: (personal_data: Record<string, string>) => call<any>('POST', '/kyc/save-draft', { personal_data }),
    submitDocs: (data: {
      aadhaar_front_url: string;
      aadhaar_back_url: string;
      pan_url: string;
      selfie_url: string;
      cancelled_cheque_url?: string;
    }) => call<any>('POST', '/kyc/submit-docs', data),
    submitDsa: (dsa_signed_url: string) => call<any>('POST', '/kyc/submit-dsa', { dsa_signed_url }),
    listAdmin: (params?: { status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ docs: any[]; total: number; summary: { pending_count: number; dsa_review_count: number; verified_count: number; rejected_count: number } }>(
        'GET', `/kyc${q ? `?${q}` : ''}`
      );
    },
    approve: (id: string) => call<any>('PATCH', `/kyc/${id}/approve`),
    reject: (id: string, reason: string) => call<any>('PATCH', `/kyc/${id}/reject`, { reason }),
    adminUpdate: (id: string, data: any) => call<any>('PATCH', `/kyc/${id}`, data),
  },
  withdrawals: {
    list: () => call<{ requests: ApiWithdrawal[]; total: number }>('GET', '/withdrawals').then(r => r.requests),
    request: (data: { amount: number; bank_account_no: string; bank_ifsc: string; bank_name: string; bank_holder: string }) =>
      call<ApiWithdrawal>('POST', '/withdrawals', data),
    listAdmin: (status?: string, page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (status) q.set('status', status);
      q.set('limit', String(limit ?? 20));
      q.set('page', String(page ?? 1));
      return call<{ requests: any[]; total: number; summary: { pending_count: number; pending_gross: number; approved_count: number; approved_net: number; approved_tds: number; approved_gst: number } }>('GET', `/withdrawals?${q.toString()}`);
    },
    approve: (id: string, data: { utr_number?: string, admin_note?: string }) => call<any>('PATCH', `/withdrawals/${id}/approve`, data),
    reject: (id: string, data: { admin_note?: string }) => call<any>('PATCH', `/withdrawals/${id}/reject`, data),
    report: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      return call<{ requests: any[]; totals: { gross: number; tds: number; admin_charge: number; gst: number; net: number } }>('GET', `/withdrawals/report${qs ? '?' + qs : ''}`);
    },
  },
  mlm: {
    tree: (userId?: string) => call<ApiMlmNode>('GET', userId ? `/mlm/tree?user_id=${userId}` : '/mlm/tree'),
    commissions: (userId?: string) =>
      call<{ commissions: ApiCommission[]; total: number }>('GET', userId ? `/mlm/commissions?user_id=${userId}` : '/mlm/commissions')
        .then(r => r.commissions ?? (r as any)),
    networkList: (page?: number, limit?: number) =>
      call<{ users: any[]; total: number; summary: { active_count: number; total_bv: number } }>(
        'GET', `/mlm/network?page=${page ?? 1}&limit=${limit ?? 20}`
      ),
    updateStatus: (id: string, is_active: boolean) => call<any>('PATCH', `/mlm/users/${id}/status`, { is_active }),
    incomeSummary: (userId?: string) =>
      call<ApiIncomeSummary>('GET', userId ? `/mlm/income-summary?user_id=${userId}` : '/mlm/income-summary'),
    bvSummary: (userId?: string) =>
      call<ApiBvSummary>('GET', userId ? `/mlm/bv-summary?user_id=${userId}` : '/mlm/bv-summary'),
    team: (userId?: string) =>
      call<ApiTeam>('GET', userId ? `/mlm/team?user_id=${userId}` : '/mlm/team'),
    milestones: (userId?: string) =>
      call<{ milestones: ApiMilestone[]; user_left_bv: number; user_right_bv: number }>('GET', userId ? `/mlm/milestones?user_id=${userId}` : '/mlm/milestones'),
    claimMilestone: (milestoneId: string, cash_opted: boolean) =>
      call<any>('POST', `/mlm/milestones/${milestoneId}/claim`, { cash_opted }),
    createMilestone: (data: any) => call<any>('POST', '/mlm/milestones', data),
    updateMilestone: (id: string, data: any) => call<any>('PATCH', `/mlm/milestones/${id}`, data),
    listClaims: (status?: string) =>
      call<{ claims: any[]; total: number }>('GET', status ? `/mlm/milestone-claims?status=${status}` : '/mlm/milestone-claims'),
    processClaim: (id: string, data: { status: string; admin_note?: string; delivery_info?: string }) =>
      call<any>('PATCH', `/mlm/milestone-claims/${id}`, data),
    runBvMatching: (force?: boolean) =>
      call<any>('POST', `/mlm/run-bv-matching${force ? '?force=1' : ''}`),
    referrals: (userId?: string) =>
      call<any>('GET', userId ? `/mlm/referrals?user_id=${userId}` : '/mlm/referrals'),
    bvLedger: (params?: { page?: number; limit?: number; month?: string; year?: string; date?: string; search?: string; user_id?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.month) q.set('month', params.month);
      if (params?.year) q.set('year', params.year);
      if (params?.date) q.set('date', params.date);
      if (params?.search) q.set('search', params.search);
      if (params?.user_id) q.set('user_id', params.user_id);
      const qs = q.toString();
      return call<{ logs: any[]; total: number; total_bv: number }>('GET', `/mlm/bv-ledger${qs ? '?' + qs : ''}`);
    },
    downlineSearch: (q: string) =>
      call<{ users: Array<{ id: string; full_name: string; referral_code: string }> }>('GET', `/mlm/downline-search?q=${encodeURIComponent(q)}`),
    adminUserSearch: (q: string) =>
      call<{ users: Array<{ id: string; full_name: string; referral_code: string; email: string }> }>('GET', `/mlm/admin/user-search?q=${encodeURIComponent(q)}`),
    adminMembers: (userId: string, params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.page)   q.set('page',   String(params.page));
      if (params?.limit)  q.set('limit',  String(params.limit));
      const qs = q.toString();
      return call<{ members: any[]; total: number }>('GET', `/mlm/admin/members/${userId}${qs ? '?' + qs : ''}`);
    },
    adminUnplaced: (search?: string) =>
      call<{ users: any[] }>('GET', `/mlm/admin/unplaced${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    adminPlace: (data: { user_id: string; parent_id: string; position: 'left' | 'right' }) =>
      call<{ success: boolean; user: any; spilled_over: boolean; placed_under: { full_name: string; referral_code: string } | null }>('POST', '/mlm/admin/place', data),
    adminDetach: (userId: string) =>
      call<{ success: boolean; user: any }>('DELETE', `/mlm/admin/detach/${userId}`),
    runMonthlyRoyalty: (year?: number, month?: number, force?: boolean) => {
      const q = new URLSearchParams();
      if (year)  q.set('year',  String(year));
      if (month) q.set('month', String(month));
      if (force) q.set('force', '1');
      const qs = q.toString();
      return call<any>('POST', `/mlm/run-monthly-royalty${qs ? '?' + qs : ''}`);
    },
    royaltyHistory: (page?: number, limit?: number) =>
      call<{ logs: any[]; total: number }>('GET', `/mlm/royalty-history?page=${page ?? 1}&limit=${limit ?? 24}`),
    runMilestoneBonus: (code: string, year?: number, month?: number, force?: boolean) => {
      const q = new URLSearchParams();
      if (year)  q.set('year',  String(year));
      if (month) q.set('month', String(month));
      if (force) q.set('force', '1');
      const qs = q.toString();
      return call<any>('POST', `/mlm/run-milestone-bonus/${code}${qs ? '?' + qs : ''}`);
    },
    milestoneBonusHistory: (code?: string, page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (code) q.set('code', code);
      q.set('page', String(page ?? 1));
      q.set('limit', String(limit ?? 24));
      return call<{ logs: any[]; total: number }>('GET', `/mlm/milestone-bonus-history?${q.toString()}`);
    },
  },
  packages: {
    list: (all?: boolean) => call<ApiPackage[]>('GET', all ? '/packages?all=1' : '/packages'),
    listPaged: (page: number, limit = 20, all = true) =>
      call<{ packages: ApiPackage[]; total: number }>('GET', `/packages?page=${page}&limit=${limit}${all ? '&all=1' : ''}`),
    purchase: (id: string) => call<{ success: boolean; message: string; package: ApiPackage; commissions_generated: number }>('POST', `/packages/${id}/purchase`),
    create: (data: Partial<ApiPackage>) => call<ApiPackage>('POST', '/packages', data),
    update: (id: string, data: Partial<ApiPackage>) => call<ApiPackage>('PATCH', `/packages/${id}`, data),
  },
  notifications: {
    list: (unread?: boolean) =>
      call<{ notifications: ApiNotification[]; total: number; unread_count: number }>('GET', unread ? '/notifications?unread=1' : '/notifications'),
    markRead: (id: string) => call<{ success: boolean }>('PATCH', `/notifications/${id}/read`),
    markAllRead: () => call<{ success: boolean }>('PATCH', '/notifications/read-all'),
  },
  liveClasses: {
    list: (params?: { course_id?: string; status?: string }) => {
      let query = '';
      if (params) {
        const parts = [];
        if (params.course_id) parts.push(`course_id=${params.course_id}`);
        if (params.status) parts.push(`status=${params.status}`);
        if (parts.length > 0) query = '?' + parts.join('&');
      }
      return call<any[]>('GET', `/live-classes${query}`);
    },
    create: (data: any) => call<any>('POST', '/live-classes', data),
    update: (id: string, data: any) => call<any>('PATCH', `/live-classes/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/live-classes/${id}`),
    syncParticipants: (id: string) => call<any>('POST', `/live-classes/${id}/sync`),
    attendees: (id: string) => call<any>('GET', `/live-classes/${id}/attendees`),
    registrants: (id: string) => call<any>('GET', `/live-classes/${id}/registrants`),
    registerStudent: (id: string, studentId: string) => call<any>('POST', `/live-classes/${id}/registrants`, { student_id: studentId }),
  },
  zoomAccounts: {
    list: () => call<any[]>('GET', '/zoom-accounts'),
    listPaged: (page: number, limit = 20) =>
      call<{ accounts: any[]; total: number }>('GET', `/zoom-accounts?page=${page}&limit=${limit}`),
    available: () => call<any[]>('GET', '/zoom-accounts/available'),
    create: (data: any) => call<any>('POST', '/zoom-accounts', data),
    update: (id: string, data: any) => call<any>('PATCH', `/zoom-accounts/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/zoom-accounts/${id}`),
    test: (id: string) => call<any>('POST', `/zoom-accounts/${id}/test`),
  },
  reports: {
    overview: () => call<{
      totalUsers: number; totalStudents: number; totalInstructors: number;
      totalCourses: number; totalEnrollments: number; completedEnrollments: number;
      liveClassesToday: number; pendingSubmissions: number; activeBatches: number;
      pendingInstructorApprovals: number;
      kyc: { pending: number; approved: number };
      withdrawals: { pending: number; paid: number; pendingAmount: number };
      bvCirculation: number;
      commissions: { paidTotal: number; paidMTD: number; revenueMTD: number };
    }>('GET', '/reports/overview'),
    activity: () => call<any[]>('GET', '/reports/activity'),
    myStats: () => call<any>('GET', '/reports/my-stats'),
    instructorStats: () => call<any>('GET', '/reports/instructor-stats'),
    growth: () => call<{ labels: string[]; users: number[]; enrollments: number[]; revenue: number[] }>('GET', '/reports/growth'),
    topCourses: () => call<{ id: string; title: string; category: string | null; enrollments: number; status: string }[]>('GET', '/reports/top-courses'),
  },
  leads: {
    submit: (data: { full_name: string; mobile: string; email?: string; city?: string; referred_by?: string; course_interest?: string; source?: string }) =>
      call<any>('POST', '/leads', data),
    list: (status?: string, page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (status) q.set('status', status);
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      const qs = q.toString();
      return call<{ leads: any[]; total: number; counts: Record<string, number> }>('GET', `/leads${qs ? '?' + qs : ''}`);
    },
    update: (id: string, data: { status?: string; notes?: string }) =>
      call<any>('PATCH', `/leads/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/leads/${id}`),
  },
  upload: {
    file: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
      const token = getStoredToken();
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Upload failed: ${res.status}`);
      }
      return res.json();
    },
  },
  rewards: {
    list: () => call<any[]>('GET', '/rewards'),
    myClaims: () => call<any[]>('GET', '/rewards/my-claims'),
    claim: (milestoneId: string, data: { cash_opted: boolean; delivery_info?: string }) =>
      call<any>('POST', `/rewards/${milestoneId}/claim`, data),
    admin: {
      list: (page?: number, limit?: number) => {
        const q = new URLSearchParams();
        if (page) q.set('page', String(page));
        if (limit) q.set('limit', String(limit));
        const qs = q.toString();
        return call<{ milestones: any[]; total: number }>('GET', `/rewards/admin${qs ? '?' + qs : ''}`);
      },
      create: (data: any) => call<any>('POST', '/rewards/admin', data),
      update: (id: string, data: any) => call<any>('PATCH', `/rewards/admin/${id}`, data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/rewards/admin/${id}`),
      claims: (page?: number, limit?: number) => {
        const q = new URLSearchParams();
        if (page) q.set('page', String(page));
        if (limit) q.set('limit', String(limit));
        const qs = q.toString();
        return call<{ claims: any[]; total: number; summary: { pending_count: number } }>('GET', `/rewards/admin/claims${qs ? '?' + qs : ''}`);
      },
      updateClaim: (id: string, data: { status?: string; admin_note?: string; delivery_info?: string }) =>
        call<any>('PATCH', `/rewards/admin/claims/${id}`, data),
    },
    monthlyTargets: {
      list: () => call<any[]>('GET', '/rewards/monthly-targets'),
      admin: {
        list: (page?: number, limit?: number) => {
          const q = new URLSearchParams();
          if (page) q.set('page', String(page));
          if (limit) q.set('limit', String(limit));
          const qs = q.toString();
          return call<{ targets: any[]; total: number }>('GET', `/rewards/monthly-targets/admin${qs ? '?' + qs : ''}`);
        },
        create: (data: any) => call<any>('POST', '/rewards/monthly-targets/admin', data),
        update: (id: string, data: any) => call<any>('PATCH', `/rewards/monthly-targets/admin/${id}`, data),
        delete: (id: string) => call<{ success: boolean }>('DELETE', `/rewards/monthly-targets/admin/${id}`),
      },
    },
  },
  support: {
    submit: (data: { subject: string; message: string; attachment_url?: string }) => call<any>('POST', '/support/queries', data),
    myQueries: () => call<any[]>('GET', '/support/queries/my'),
    reply: (ticketId: string, content: string, attachment_url?: string) => call<any>('POST', `/support/queries/${ticketId}/messages`, { content, attachment_url }),
    adminList: (status?: string, page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (status && status !== 'all') q.set('status', status);
      if (page) q.set('page', String(page));
      if (limit) q.set('limit', String(limit));
      const qs = q.toString();
      return call<{ queries: any[]; total: number; counts?: Record<string, number> }>('GET', `/support/queries${qs ? '?' + qs : ''}`);
    },
    update: (id: string, data: { status?: string; admin_note?: string }) =>
      call<any>('PATCH', `/support/queries/${id}`, data),
    adminReply: (ticketId: string, content: string, attachment_url?: string) =>
      call<any>('POST', `/support/queries/${ticketId}/messages/admin`, { content, attachment_url }),
  },
  notificationTemplates: {
    list: () => call<ApiNotificationTemplate[]>('GET', '/notification-templates'),
    update: (eventType: string, data: Partial<ApiNotificationTemplate>) =>
      call<ApiNotificationTemplate>('PATCH', `/notification-templates/${eventType}`, data),
    test: (eventType: string) =>
      call<{ success: boolean; message: string; preview: any }>('POST', `/notification-templates/${eventType}/test`),
  },
  integrationSettings: {
    get: () => call<ApiIntegrationSettings>('GET', '/integration-settings'),
    getPublic: () => call<{ support_whatsapp_number: string }>('GET', '/integration-settings/public'),
    update: (data: Partial<{
      smtp_host: string; smtp_port: number | null; smtp_secure: boolean; smtp_user: string; smtp_pass: string; smtp_from: string;
      meta_whatsapp_token: string; meta_whatsapp_phone_number_id: string; meta_whatsapp_api_version: string; support_whatsapp_number: string;
    }>) => call<{ success: boolean; updated_at: string }>('PATCH', '/integration-settings', data),
  },
  invoices: {
    my: (params?: { type?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.type)  q.set('type',  params.type);
      if (params?.page)  q.set('page',  String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return call<{ invoices: any[]; total: number }>('GET', `/invoices/my${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => call<any>('GET', `/invoices/${id}`),
    adminList: (params?: { type?: string; status?: string; category?: string; from?: string; to?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.type)     q.set('type',     params.type);
      if (params?.status)   q.set('status',   params.status);
      if (params?.category) q.set('category', params.category);
      if (params?.from)     q.set('from',     params.from);
      if (params?.to)       q.set('to',       params.to);
      if (params?.page)     q.set('page',     String(params.page));
      if (params?.limit)    q.set('limit',    String(params.limit));
      const qs = q.toString();
      return call<{ invoices: any[]; total: number; totals: any }>('GET', `/invoices${qs ? '?' + qs : ''}`);
    },
    create: (data: any) => call<any>('POST', '/invoices', data),
    update: (id: string, data: { status?: string; workflow_stage?: string; admin_note?: string }) =>
      call<any>('PATCH', `/invoices/${id}`, data),
    gstSummary: (params?: { from?: string; to?: string }) => {
      const q = new URLSearchParams();
      if (params?.from) q.set('from', params.from);
      if (params?.to)   q.set('to',   params.to);
      const qs = q.toString();
      return call<any[]>('GET', `/invoices/gst-summary${qs ? '?' + qs : ''}`);
    },
    gstDetail: (params?: { from?: string; to?: string; category?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.from)     q.set('from',     params.from);
      if (params?.to)       q.set('to',       params.to);
      if (params?.category) q.set('category', params.category);
      if (params?.page)     q.set('page',     String(params.page));
      if (params?.limit)    q.set('limit',    String(params.limit));
      const qs = q.toString();
      return call<{ invoices: any[]; total: number; page: number; limit: number }>('GET', `/invoices/gst-detail${qs ? '?' + qs : ''}`);
    },
    tdsSummary: (params?: { from?: string; to?: string }) => {
      const q = new URLSearchParams();
      if (params?.from) q.set('from', params.from);
      if (params?.to)   q.set('to',   params.to);
      const qs = q.toString();
      return call<{ invoices: any[]; totals: any }>('GET', `/invoices/tds-summary${qs ? '?' + qs : ''}`);
    },
  },
  incomeSources: {
    list: (activeOnly?: boolean) =>
      call<any[]>('GET', activeOnly ? '/income-sources?active=true' : '/income-sources'),
    create: (data: {
      code: string; name: string; description?: string; category: string;
      rate?: number | null; fixed_amount?: number | null; daily_cap?: number | null;
      generation_level?: number | null; min_bv_per_side?: number | null;
      min_months?: number | null; cap_amount?: number | null;
      cap_period_value?: number | null; cap_period_unit?: string | null;
      order_index?: number;
    }) => call<any>('POST', '/income-sources', data),
    update: (id: string, data: {
      name?: string; description?: string; category?: string;
      rate?: number | null; fixed_amount?: number | null; daily_cap?: number | null;
      generation_level?: number | null; min_bv_per_side?: number | null;
      min_months?: number | null; cap_amount?: number | null;
      cap_period_value?: number | null; cap_period_unit?: string | null;
      is_active?: boolean; order_index?: number;
    }) => call<any>('PATCH', `/income-sources/${id}`, data),
    remove: (id: string) => call<{ success: boolean; action: string; message?: string }>('DELETE', `/income-sources/${id}`),
  },
  gstCategories: {
    list: (activeOnly?: boolean) =>
      call<any[]>('GET', activeOnly ? '/gst-categories?active=true' : '/gst-categories'),
    create: (data: { name: string; description?: string; gst_rate: number; hsn_sac_code?: string }) =>
      call<any>('POST', '/gst-categories', data),
    update: (id: string, data: { name?: string; description?: string; gst_rate?: number; hsn_sac_code?: string; is_active?: boolean }) =>
      call<any>('PATCH', `/gst-categories/${id}`, data),
    remove: (id: string) => call<{ success: boolean }>('DELETE', `/gst-categories/${id}`),
  },
  cms: {
    hero: {
      get: () => call<any>('GET', '/cms/hero'),
      update: (data: { headline: string; subheadline: string; cta_text: string; video_url?: string }) => call<any>('PUT', '/cms/hero', data),
    },
    testimonials: {
      list: () => call<any[]>('GET', '/cms/testimonials'),
      create: (data: { student_name: string; story_text: string; star_rating: number; photo_url?: string; video_url?: string }) => call<any>('POST', '/cms/testimonials', data),
      update: (id: string, data: any) => call<any>('PATCH', `/cms/testimonials/${id}`, data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/testimonials/${id}`),
    },
    faqs: {
      list: () => call<any[]>('GET', '/cms/faqs'),
      create: (data: { question: string; answer: string; category?: string }) => call<any>('POST', '/cms/faqs', data),
      update: (id: string, data: any) => call<any>('PATCH', `/cms/faqs/${id}`, data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/faqs/${id}`),
    },
    products: {
      list: () => call<any[]>('GET', '/cms/products'),
      listPaged: (page: number, limit = 20) =>
        call<{ products: any[]; total: number }>('GET', `/cms/products?page=${page}&limit=${limit}`),
      create: (data: any) => call<any>('POST', '/cms/products', data),
      update: (id: string, data: any) => call<any>('PATCH', `/cms/products/${id}`, data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/products/${id}`),
    },
    gallery: {
      list: () => call<any[]>('GET', '/cms/gallery'),
      add: (data: { title: string; image_url: string; caption?: string; category?: string }) => call<any>('POST', '/cms/gallery', data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/gallery/${id}`),
      reorder: (order: { id: string; order_index: number }[]) => call<{ success: boolean }>('PATCH', '/cms/gallery/reorder', { order }),
    },
    certifications: {
      list: () => call<any[]>('GET', '/cms/certifications'),
      add: (data: { name: string; issuer?: string; image_url?: string; description?: string }) => call<any>('POST', '/cms/certifications', data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/certifications/${id}`),
    },
    documents: {
      list: () => call<any[]>('GET', '/cms/documents'),
      add: (data: { name: string; description?: string; file_url: string; file_type?: string }) => call<any>('POST', '/cms/documents', data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/documents/${id}`),
    },
    instructorApplications: {
      submit: (data: { full_name: string; email: string; phone: string; location?: string; experience?: string; expertise?: string; course_title?: string; course_category?: string; course_description?: string; teaching_experience?: string }) =>
        call<any>('POST', '/cms/instructor-applications', data),
      list: (status?: string, page?: number, limit?: number) => {
        const q = new URLSearchParams();
        if (status && status !== 'all') q.set('status', status);
        if (page) q.set('page', String(page));
        if (limit) q.set('limit', String(limit));
        const qs = q.toString();
        return call<{ applications: any[]; total: number; counts?: Record<string, number> }>('GET', `/cms/instructor-applications${qs ? '?' + qs : ''}`);
      },
      update: (id: string, data: { status?: string; admin_note?: string }) => call<any>('PATCH', `/cms/instructor-applications/${id}`, data),
      register: (id: string) => call<any>('POST', `/cms/instructor-applications/${id}/register`, {}),
    },
  },

  orders: {
    place: (data: {
      product_id: string; quantity: number;
      shipping_name: string; shipping_phone: string;
      shipping_address: string; shipping_city: string;
      shipping_state: string; shipping_pincode: string;
      notes?: string; referral_code?: string;
      payment_transaction_id?: string; payment_screenshot_url?: string;
    }) => call<any>('POST', '/orders', data),
    pricing: (productId: string, quantity: number, referralCode?: string) =>
      call<{ unit_price: number; quantity: number; base_price: number; discount_amount: number; final_price: number; is_distributor: boolean; referral_valid: boolean; bv_amount: number }>(
        'GET', `/orders/pricing?product_id=${encodeURIComponent(productId)}&quantity=${quantity}${referralCode ? `&referral_code=${encodeURIComponent(referralCode)}` : ''}`
      ),
    myOrders: () => call<any[]>('GET', '/orders/my'),
    adminList: (status?: string, page?: number, limit?: number) => {
      const q = new URLSearchParams();
      if (status && status !== 'all') q.set('status', status);
      if (limit) q.set('limit', String(limit));
      if (page && limit) q.set('offset', String((page - 1) * limit));
      const qs = q.toString();
      return call<{ orders: any[]; total: number }>('GET', `/orders${qs ? '?' + qs : ''}`);
    },
    updateStatus: (id: string, data: { status?: string; admin_notes?: string }) =>
      call<any>('PATCH', `/orders/${id}`, data),
  },

  employeeAuth: {
    login: (email: string, password: string) =>
      call<{ token: string; employee: any; permissions: any }>('POST', '/employee-auth/login', { email, password }),
    me: () => call<{ employee: any; permissions: any }>('GET', '/employee-auth/me'),
    forgotPassword: (email: string) => call<{ message: string }>('POST', '/employee-auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      call<{ success: boolean; message: string }>('POST', '/employee-auth/reset-password', { token, password }),
    updateProfile: (data: { full_name?: string; phone?: string; profile_photo_url?: string | null }) =>
      call<any>('PATCH', '/employee-auth/profile', data),
    changePassword: (current_password: string, new_password: string) =>
      call<{ success: boolean; message: string }>('PATCH', '/employee-auth/change-password', { current_password, new_password }),
  },

  employees: {
    list: (params?: { search?: string; is_active?: boolean; role_id?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.is_active !== undefined) qs.set('is_active', params.is_active ? '1' : '0');
      if (params?.role_id) qs.set('role_id', params.role_id);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ employees: any[]; total: number }>('GET', `/employees${q ? `?${q}` : ''}`);
    },
    get: (id: string) => call<any>('GET', `/employees/${id}`),
    create: (data: {
      full_name: string; email: string; phone?: string; password: string;
      designation?: string; department?: string; date_of_joining?: string; role_ids?: string[];
    }) => call<any>('POST', '/employees', data),
    update: (id: string, data: Partial<{ full_name: string; phone: string; designation: string; department: string; date_of_joining: string; is_active: boolean }>) =>
      call<any>('PATCH', `/employees/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/employees/${id}`),
    assignRole: (id: string, role_id: string) => call<any>('POST', `/employees/${id}/roles`, { role_id }),
    unassignRole: (id: string, roleId: string) => call<{ success: boolean }>('DELETE', `/employees/${id}/roles/${roleId}`),
    resetPassword: (id: string, password: string) => call<{ success: boolean }>('POST', `/employees/${id}/reset-password`, { password }),
  },

  employeeRoles: {
    list: () => call<any[]>('GET', '/employee-roles'),
    get: (id: string) => call<any>('GET', `/employee-roles/${id}`),
    create: (data: { name: string; description?: string }) => call<any>('POST', '/employee-roles', data),
    update: (id: string, data: Partial<{ name: string; description: string; is_active: boolean }>) =>
      call<any>('PATCH', `/employee-roles/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/employee-roles/${id}`),
    setPermissions: (id: string, permissions: Array<{
      page_key: string; can_view?: boolean; can_create?: boolean; can_edit?: boolean; can_delete?: boolean; can_approve?: boolean;
    }>) => call<any[]>('PUT', `/employee-roles/${id}/permissions`, { permissions }),
  },

  employeePayroll: {
    salaryStructures: (params?: { employee_id?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.employee_id) qs.set('employee_id', params.employee_id);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ structures: any[]; total: number }>('GET', `/employee-payroll/salary-structures${q ? `?${q}` : ''}`);
    },
    setSalaryStructure: (employeeId: string, data: { basic: number; hra?: number; other_allowances?: number; pf_percent?: number; effective_from?: string }) =>
      call<any>('PUT', `/employee-payroll/salary-structures/${employeeId}`, data),
    payslips: (params?: { employee_id?: string; month?: number; year?: number; status?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.employee_id) qs.set('employee_id', params.employee_id);
      if (params?.month) qs.set('month', String(params.month));
      if (params?.year) qs.set('year', String(params.year));
      if (params?.status) qs.set('status', params.status);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ payslips: any[]; total: number }>('GET', `/employee-payroll/payslips${q ? `?${q}` : ''}`);
    },
    createPayslip: (data: {
      employee_id: string; month: number; year: number; basic: number;
      hra?: number; other_allowances?: number; pf_deduction?: number; other_deductions?: number; remarks?: string;
    }) => call<any>('POST', '/employee-payroll/payslips', data),
    updatePayslip: (id: string, data: Partial<{ basic: number; hra: number; other_allowances: number; pf_deduction: number; other_deductions: number; remarks: string }>) =>
      call<any>('PATCH', `/employee-payroll/payslips/${id}`, data),
    finalizePayslip: (id: string) => call<any>('PATCH', `/employee-payroll/payslips/${id}/finalize`),
    markPayslipPaid: (id: string) => call<any>('PATCH', `/employee-payroll/payslips/${id}/mark-paid`),
    deletePayslip: (id: string) => call<{ success: boolean }>('DELETE', `/employee-payroll/payslips/${id}`),
    incentives: (params?: { employee_id?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.employee_id) qs.set('employee_id', params.employee_id);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ incentives: any[]; total: number }>('GET', `/employee-payroll/incentives${q ? `?${q}` : ''}`);
    },
    createIncentive: (data: { employee_id: string; title: string; amount: number; reason?: string; awarded_on?: string }) =>
      call<any>('POST', '/employee-payroll/incentives', data),
    deleteIncentive: (id: string) => call<{ success: boolean }>('DELETE', `/employee-payroll/incentives/${id}`),
    myPayslips: () => call<any[]>('GET', '/employee-payroll/me/payslips'),
    myIncentives: () => call<any[]>('GET', '/employee-payroll/me/incentives'),
    mySalaryStructure: () => call<any>('GET', '/employee-payroll/me/salary-structure'),
  },
  accounts: {
    overview: (period?: 'today' | 'month' | 'year' | 'all') =>
      call<{
        period: string;
        sales: { courseSales: number; productSales: number; packageSales: number; totalSales: number };
        expenses: {
          salaryExpense: number; marketingExpense: number; purchasesExpense: number;
          operationalExpense: number; otherExpense: number; commissionPaid: number;
          commissionBreakdown: Record<string, number>; totalExpenses: number;
        };
        netProfit: number;
      }>('GET', `/accounts/overview${period ? `?period=${period}` : ''}`),
  },
  expenses: {
    list: (params?: { category?: string; from?: string; to?: string; search?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.from) qs.set('from', params.from);
      if (params?.to) qs.set('to', params.to);
      if (params?.search) qs.set('search', params.search);
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return call<{ expenses: any[]; total: number; total_amount: number }>('GET', `/expenses${q ? `?${q}` : ''}`);
    },
    create: (data: { category: string; sub_category?: string; amount: number; expense_date: string; description?: string; payment_method?: string; attachment_url?: string }) =>
      call<any>('POST', '/expenses', data),
    update: (id: string, data: Partial<{ category: string; sub_category: string; amount: number; expense_date: string; description: string; payment_method: string; attachment_url: string }>) =>
      call<any>('PATCH', `/expenses/${id}`, data),
    remove: (id: string) => call<{ success: boolean }>('DELETE', `/expenses/${id}`),
  },
};
