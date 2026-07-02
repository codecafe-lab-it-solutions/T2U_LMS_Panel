const BASE_URL = import.meta.env.VITE_API_URL as string;

// ── Media URL helper ─────────────────────────────────────────────────────────
// Uploaded files are stored as relative paths like /api/upload/filename.jpg
// Convert them to absolute URLs pointing at the API server.
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SERVER_ORIGIN}${url}`;
}

// ── Token helpers ────────────────────────────────────────────────────────────
export const TOKEN_KEY = 't2u-jwt';

export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function storeToken(t: string): void {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ }
}
export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
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
  kyc_status: string;
  profile_photo_url: string | null;
  left: ApiMlmNode | null;
  right: ApiMlmNode | null;
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

// ── Named API surface ────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      call<{ token: string; user: ApiUser }>('POST', '/auth/login', { email, password }),
    register: (data: { full_name: string; email: string; phone: string; password: string; referred_by_code?: string; role?: string }) =>
      call<{ token: string; user: ApiUser }>('POST', '/auth/register', data),
    me: () => call<ApiUser>('GET', '/auth/me'),
    updateProfile: (data: Partial<{ full_name: string; phone: string; email: string; profile_photo_url: string; bio: string }>) =>
      call<ApiUser>('PATCH', '/auth/profile', data),
  },
  courses: {
    enrolled: () => call<ApiEnrolledCourse[]>('GET', '/courses/enrolled'),
    instructor: () => call<any[]>('GET', '/courses/instructor'),
    list: () => call<{ courses: any[]; total: number }>('GET', '/courses').then(r => r.courses),
    get: (id: string) => call<any>('GET', `/courses/${id}`),
    create: (data: any) => call<any>('POST', '/courses', data),
    update: (id: string, data: any) => call<any>('PATCH', `/courses/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/courses/${id}`),
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
    list: () => call<any[]>('GET', '/batches'),
    get: (id: string) => call<any>('GET', `/batches/${id}`),
    create: (data: any) => call<any>('POST', '/batches', data),
    update: (id: string, data: any) => call<any>('PATCH', `/batches/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/batches/${id}`),
    addInstructor: (batchId: string, userId: string) => call<any>('POST', `/batches/${batchId}/instructors`, { user_id: userId }),
    removeInstructor: (batchId: string, userId: string) => call<{ success: boolean }>('DELETE', `/batches/${batchId}/instructors/${userId}`),
    addCourse: (batchId: string, courseId: string) => call<any>('POST', `/batches/${batchId}/courses`, { course_id: courseId }),
    removeCourse: (batchId: string, courseId: string) => call<{ success: boolean }>('DELETE', `/batches/${batchId}/courses/${courseId}`),
    enrollStudents: (batchId: string, student_ids: string[]) => call<{ success: boolean; enrolled: number; students: number; courses: number }>('POST', `/batches/${batchId}/enroll-students`, { student_ids }),
    enrolledStudents: (batchId: string) => call<any[]>('GET', `/batches/${batchId}/enrolled-students`),
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
    questions: {
      create: (quizId: string, data: any) => call<any>('POST', `/quizzes/${quizId}/questions`, data),
      delete: (quizId: string, questionId: string) => call<{ success: boolean }>('DELETE', `/quizzes/${quizId}/questions/${questionId}`),
    },
  },
  assignments: {
    my: () => call<ApiAssignment[]>('GET', '/assignments/my'),
    list: (courseId?: string) =>
      call<any[]>('GET', courseId ? `/assignments?course_id=${courseId}` : '/assignments'),
    create: (data: { course_id: string; title: string; description: string; due_date: string; max_score?: number }) =>
      call<any>('POST', '/assignments', data),
    submissions: (status?: 'pending' | 'graded') =>
      call<any[]>('GET', status ? `/assignments/submissions?status=${status}` : '/assignments/submissions'),
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
    listAdmin: (status?: string) => call<any[]>('GET', status ? `/kyc?status=${status}` : '/kyc'),
    approve: (id: string) => call<any>('PATCH', `/kyc/${id}/approve`),
    reject: (id: string, reason: string) => call<any>('PATCH', `/kyc/${id}/reject`, { reason }),
  },
  withdrawals: {
    list: () => call<{ requests: ApiWithdrawal[]; total: number }>('GET', '/withdrawals').then(r => r.requests),
    request: (data: { amount: number; bank_account_no: string; bank_ifsc: string; bank_name: string; bank_holder: string }) =>
      call<ApiWithdrawal>('POST', '/withdrawals', data),
    listAdmin: (status?: string) => call<{ requests: any[], total: number }>('GET', status ? `/withdrawals?status=${status}&limit=100` : '/withdrawals?limit=100'),
    approve: (id: string, data: { utr_number?: string, admin_note?: string }) => call<any>('PATCH', `/withdrawals/${id}/approve`, data),
    reject: (id: string, data: { admin_note?: string }) => call<any>('PATCH', `/withdrawals/${id}/reject`, data),
  },
  mlm: {
    tree: (userId?: string) => call<ApiMlmNode>('GET', userId ? `/mlm/tree?user_id=${userId}` : '/mlm/tree'),
    commissions: (userId?: string) => call<ApiCommission[]>('GET', userId ? `/mlm/commissions?user_id=${userId}` : '/mlm/commissions'),
    networkList: () => call<{ users: any[], total: number }>('GET', '/mlm/network?limit=100'),
    updateStatus: (id: string, is_active: boolean) => call<any>('PATCH', `/mlm/users/${id}/status`, { is_active }),
    getSettings: () => call<any[]>('GET', '/mlm/settings'),
    updateSettings: (data: any) => call<any>('PATCH', '/mlm/settings', data),
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
  },
  zoomAccounts: {
    list: () => call<any[]>('GET', '/zoom-accounts'),
    create: (data: any) => call<any>('POST', '/zoom-accounts', data),
    update: (id: string, data: any) => call<any>('PATCH', `/zoom-accounts/${id}`, data),
    delete: (id: string) => call<{ success: boolean }>('DELETE', `/zoom-accounts/${id}`),
    test: (id: string) => call<any>('POST', `/zoom-accounts/${id}/test`),
  },
  reports: {
    overview: () => call<any>('GET', '/reports/overview'),
    activity: () => call<any[]>('GET', '/reports/activity'),
    myStats: () => call<any>('GET', '/reports/my-stats'),
    instructorStats: () => call<any>('GET', '/reports/instructor-stats'),
    growth: () => call<any>('GET', '/reports/growth'),
  },
  leads: {
    submit: (data: { full_name: string; mobile: string; email?: string; city?: string; referred_by?: string; course_interest?: string; source?: string }) =>
      call<any>('POST', '/leads', data),
    list: (status?: string) =>
      call<{ leads: any[]; total: number }>('GET', status ? `/leads?status=${status}` : '/leads'),
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
  cms: {
    hero: {
      get: () => call<any>('GET', '/cms/hero'),
      update: (data: { headline: string; subheadline: string; cta_text: string }) => call<any>('PUT', '/cms/hero', data),
    },
    testimonials: {
      list: () => call<any[]>('GET', '/cms/testimonials'),
      create: (data: { student_name: string; story_text: string; star_rating: number; photo_url?: string }) => call<any>('POST', '/cms/testimonials', data),
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
      create: (data: any) => call<any>('POST', '/cms/products', data),
      update: (id: string, data: any) => call<any>('PATCH', `/cms/products/${id}`, data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/products/${id}`),
    },
    gallery: {
      list: () => call<any[]>('GET', '/cms/gallery'),
      add: (data: { title: string; image_url: string; caption?: string; category?: string }) => call<any>('POST', '/cms/gallery', data),
      delete: (id: string) => call<{ success: boolean }>('DELETE', `/cms/gallery/${id}`),
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
  },
};
