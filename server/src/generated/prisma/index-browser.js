
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  full_name: 'full_name',
  email: 'email',
  phone: 'phone',
  password_hash: 'password_hash',
  role: 'role',
  referral_code: 'referral_code',
  referred_by_id: 'referred_by_id',
  binary_parent_id: 'binary_parent_id',
  binary_position: 'binary_position',
  package_id: 'package_id',
  left_bv: 'left_bv',
  right_bv: 'right_bv',
  total_bv: 'total_bv',
  reward_points: 'reward_points',
  kyc_status: 'kyc_status',
  bank_account_no: 'bank_account_no',
  bank_ifsc: 'bank_ifsc',
  bank_name: 'bank_name',
  bank_holder_name: 'bank_holder_name',
  profile_photo_url: 'profile_photo_url',
  bio: 'bio',
  expertise_tags: 'expertise_tags',
  father_name: 'father_name',
  gender: 'gender',
  dob: 'dob',
  address: 'address',
  nominee_name: 'nominee_name',
  nominee_dob: 'nominee_dob',
  nominee_mobile: 'nominee_mobile',
  nominee_relationship: 'nominee_relationship',
  reset_token_hash: 'reset_token_hash',
  reset_token_expires: 'reset_token_expires',
  course_upload_approved: 'course_upload_approved',
  is_active: 'is_active',
  terms_accepted: 'terms_accepted',
  email_verified: 'email_verified',
  phone_verified: 'phone_verified',
  last_login_at: 'last_login_at',
  deleted_at: 'deleted_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  matched_bv_left: 'matched_bv_left',
  matched_bv_right: 'matched_bv_right'
};

exports.Prisma.PackageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  level: 'level',
  price: 'price',
  bv: 'bv',
  dsi_reward: 'dsi_reward',
  description: 'description',
  features: 'features',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  instructor_id: 'instructor_id',
  package_id: 'package_id',
  category: 'category',
  thumbnail_url: 'thumbnail_url',
  description: 'description',
  short_desc: 'short_desc',
  duration_hrs: 'duration_hrs',
  price: 'price',
  bv_credit: 'bv_credit',
  status: 'status',
  tags: 'tags',
  is_featured: 'is_featured',
  published_at: 'published_at',
  deleted_at: 'deleted_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CourseModuleScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  title: 'title',
  description: 'description',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.LessonScalarFieldEnum = {
  id: 'id',
  module_id: 'module_id',
  title: 'title',
  type: 'type',
  content_url: 'content_url',
  mux_asset_id: 'mux_asset_id',
  duration_mins: 'duration_mins',
  order_index: 'order_index',
  is_free_preview: 'is_free_preview',
  instructor_notes: 'instructor_notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.EnrollmentScalarFieldEnum = {
  id: 'id',
  student_id: 'student_id',
  course_id: 'course_id',
  package_id: 'package_id',
  enrolled_at: 'enrolled_at',
  completion_status: 'completion_status',
  progress_percent: 'progress_percent',
  completed_at: 'completed_at',
  payment_status: 'payment_status',
  payment_transaction_id: 'payment_transaction_id',
  payment_screenshot_url: 'payment_screenshot_url',
  payment_note: 'payment_note',
  payment_reviewed_at: 'payment_reviewed_at'
};

exports.Prisma.LessonProgressScalarFieldEnum = {
  id: 'id',
  student_id: 'student_id',
  lesson_id: 'lesson_id',
  enrollment_id: 'enrollment_id',
  completed: 'completed',
  completed_at: 'completed_at',
  created_at: 'created_at'
};

exports.Prisma.LiveClassRegistrantScalarFieldEnum = {
  id: 'id',
  live_class_id: 'live_class_id',
  student_id: 'student_id',
  email: 'email',
  full_name: 'full_name',
  registrant_id: 'registrant_id',
  join_url: 'join_url',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.LiveClassScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  instructor_id: 'instructor_id',
  title: 'title',
  topic: 'topic',
  zoom_meeting_id: 'zoom_meeting_id',
  zoom_join_url: 'zoom_join_url',
  zoom_start_url: 'zoom_start_url',
  scheduled_at: 'scheduled_at',
  duration_mins: 'duration_mins',
  status: 'status',
  attendance_count: 'attendance_count',
  recording_url: 'recording_url',
  created_at: 'created_at',
  updated_at: 'updated_at',
  zoom_account_id: 'zoom_account_id',
  zoom_account: 'zoom_account',
  zoom_timezone: 'zoom_timezone',
  batch_id: 'batch_id',
  auto_recording: 'auto_recording',
  zoom_uuid: 'zoom_uuid',
  zoom_password: 'zoom_password',
  registration_enabled: 'registration_enabled',
  registration_status: 'registration_status',
  description: 'description',
  absentee_notified_at: 'absentee_notified_at'
};

exports.Prisma.ZoomAccountScalarFieldEnum = {
  id: 'id',
  label: 'label',
  account_id: 'account_id',
  client_id: 'client_id',
  client_secret: 'client_secret',
  default_host: 'default_host',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.QuizScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  module_id: 'module_id',
  instructor_id: 'instructor_id',
  title: 'title',
  description: 'description',
  passing_score: 'passing_score',
  total_marks: 'total_marks',
  max_attempts: 'max_attempts',
  time_limit_mins: 'time_limit_mins',
  deadline: 'deadline',
  exam_date: 'exam_date',
  show_answers: 'show_answers',
  is_final_assessment: 'is_final_assessment',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.QuizQuestionScalarFieldEnum = {
  id: 'id',
  quiz_id: 'quiz_id',
  question_type: 'question_type',
  question_text: 'question_text',
  option_a: 'option_a',
  option_b: 'option_b',
  option_c: 'option_c',
  option_d: 'option_d',
  correct_option: 'correct_option',
  correct_answer: 'correct_answer',
  marks: 'marks',
  order_index: 'order_index',
  created_at: 'created_at'
};

exports.Prisma.QuizResultScalarFieldEnum = {
  id: 'id',
  quiz_id: 'quiz_id',
  student_id: 'student_id',
  score: 'score',
  total_marks: 'total_marks',
  passed: 'passed',
  answers: 'answers',
  attempt_count: 'attempt_count',
  time_taken_secs: 'time_taken_secs',
  attempted_at: 'attempted_at'
};

exports.Prisma.AssignmentScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  instructor_id: 'instructor_id',
  title: 'title',
  description: 'description',
  due_date: 'due_date',
  max_score: 'max_score',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SubmissionScalarFieldEnum = {
  id: 'id',
  assignment_id: 'assignment_id',
  student_id: 'student_id',
  file_url: 'file_url',
  submitted_at: 'submitted_at',
  grade: 'grade',
  feedback: 'feedback',
  graded_at: 'graded_at',
  graded_by: 'graded_by'
};

exports.Prisma.CertTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  html_template: 'html_template',
  is_active: 'is_active',
  created_at: 'created_at'
};

exports.Prisma.CertificateScalarFieldEnum = {
  id: 'id',
  student_id: 'student_id',
  course_id: 'course_id',
  template_id: 'template_id',
  certificate_no: 'certificate_no',
  issued_at: 'issued_at',
  pdf_url: 'pdf_url',
  is_revoked: 'is_revoked',
  revoked_at: 'revoked_at'
};

exports.Prisma.KycDocumentScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  aadhaar_front_url: 'aadhaar_front_url',
  aadhaar_back_url: 'aadhaar_back_url',
  pan_url: 'pan_url',
  selfie_url: 'selfie_url',
  cancelled_cheque_url: 'cancelled_cheque_url',
  dsa_signed_url: 'dsa_signed_url',
  personal_data: 'personal_data',
  status: 'status',
  rejection_reason: 'rejection_reason',
  reviewed_by: 'reviewed_by',
  reviewed_at: 'reviewed_at',
  submitted_at: 'submitted_at',
  updated_at: 'updated_at'
};

exports.Prisma.ReferralScalarFieldEnum = {
  id: 'id',
  referrer_id: 'referrer_id',
  referred_id: 'referred_id',
  package_id: 'package_id',
  bv_credited: 'bv_credited',
  dsi_amount: 'dsi_amount',
  created_at: 'created_at'
};

exports.Prisma.BinaryBvLogScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  leg: 'leg',
  bv_amount: 'bv_amount',
  source_user_id: 'source_user_id',
  source_package: 'source_package',
  created_at: 'created_at'
};

exports.Prisma.BinaryMatchLogScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  matched_bv: 'matched_bv',
  bonus_amount: 'bonus_amount',
  capped: 'capped',
  carry_left: 'carry_left',
  carry_right: 'carry_right',
  matching_date: 'matching_date',
  created_at: 'created_at'
};

exports.Prisma.CommissionTransactionScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  type: 'type',
  source_code: 'source_code',
  amount: 'amount',
  reference_id: 'reference_id',
  description: 'description',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.WithdrawalRequestScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  amount: 'amount',
  tds_amount: 'tds_amount',
  admin_charge: 'admin_charge',
  gst_amount: 'gst_amount',
  net_amount: 'net_amount',
  bank_account_no: 'bank_account_no',
  bank_ifsc: 'bank_ifsc',
  bank_name: 'bank_name',
  bank_holder: 'bank_holder',
  status: 'status',
  utr_number: 'utr_number',
  admin_note: 'admin_note',
  requested_at: 'requested_at',
  processed_at: 'processed_at',
  updated_at: 'updated_at'
};

exports.Prisma.RewardMilestoneScalarFieldEnum = {
  id: 'id',
  name: 'name',
  required_bv: 'required_bv',
  required_left_bv: 'required_left_bv',
  required_right_bv: 'required_right_bv',
  reward_desc: 'reward_desc',
  cash_value: 'cash_value',
  image_url: 'image_url',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at'
};

exports.Prisma.RewardMilestoneLogScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  milestone_id: 'milestone_id',
  achieved_at: 'achieved_at',
  reward_given: 'reward_given',
  cash_opted: 'cash_opted'
};

exports.Prisma.RewardClaimRequestScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  milestone_id: 'milestone_id',
  status: 'status',
  cash_opted: 'cash_opted',
  claim_date: 'claim_date',
  admin_note: 'admin_note',
  delivery_info: 'delivery_info',
  processed_at: 'processed_at',
  updated_at: 'updated_at'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  type: 'type',
  title: 'title',
  body: 'body',
  is_read: 'is_read',
  action_url: 'action_url',
  created_at: 'created_at'
};

exports.Prisma.NotificationTemplateScalarFieldEnum = {
  id: 'id',
  event_type: 'event_type',
  label: 'label',
  description: 'description',
  variables: 'variables',
  email_enabled: 'email_enabled',
  email_subject: 'email_subject',
  email_body: 'email_body',
  whatsapp_enabled: 'whatsapp_enabled',
  whatsapp_template_name: 'whatsapp_template_name',
  whatsapp_language_code: 'whatsapp_language_code',
  whatsapp_param_order: 'whatsapp_param_order',
  whatsapp_fallback_body: 'whatsapp_fallback_body',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.IntegrationSettingsScalarFieldEnum = {
  id: 'id',
  smtp_host: 'smtp_host',
  smtp_port: 'smtp_port',
  smtp_secure: 'smtp_secure',
  smtp_user: 'smtp_user',
  smtp_pass: 'smtp_pass',
  smtp_from: 'smtp_from',
  meta_whatsapp_token: 'meta_whatsapp_token',
  meta_whatsapp_phone_number_id: 'meta_whatsapp_phone_number_id',
  meta_whatsapp_api_version: 'meta_whatsapp_api_version',
  updated_at: 'updated_at'
};

exports.Prisma.TestimonialScalarFieldEnum = {
  id: 'id',
  student_name: 'student_name',
  photo_url: 'photo_url',
  story_text: 'story_text',
  video_url: 'video_url',
  star_rating: 'star_rating',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PartnerCompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  logo_url: 'logo_url',
  website_url: 'website_url',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at'
};

exports.Prisma.FaqScalarFieldEnum = {
  id: 'id',
  question: 'question',
  answer: 'answer',
  category: 'category',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  image_url: 'image_url',
  short_description: 'short_description',
  long_description: 'long_description',
  price: 'price',
  category: 'category',
  features: 'features',
  buy_url: 'buy_url',
  detail_url: 'detail_url',
  is_active: 'is_active',
  order_index: 'order_index',
  sku: 'sku',
  stock_quantity: 'stock_quantity',
  bv: 'bv',
  manufacturer: 'manufacturer',
  material: 'material',
  weight: 'weight',
  dimensions: 'dimensions',
  gst_category_id: 'gst_category_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.GSTCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  gst_rate: 'gst_rate',
  hsn_sac_code: 'hsn_sac_code',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ProductOrderScalarFieldEnum = {
  id: 'id',
  product_id: 'product_id',
  user_id: 'user_id',
  quantity: 'quantity',
  unit_price: 'unit_price',
  unit_bv: 'unit_bv',
  status: 'status',
  shipping_name: 'shipping_name',
  shipping_phone: 'shipping_phone',
  shipping_address: 'shipping_address',
  shipping_city: 'shipping_city',
  shipping_state: 'shipping_state',
  shipping_pincode: 'shipping_pincode',
  notes: 'notes',
  admin_notes: 'admin_notes',
  dispatched_at: 'dispatched_at',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.GalleryImageScalarFieldEnum = {
  id: 'id',
  title: 'title',
  image_url: 'image_url',
  caption: 'caption',
  category: 'category',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CompanyCertificationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  issuer: 'issuer',
  issue_date: 'issue_date',
  image_url: 'image_url',
  document_url: 'document_url',
  description: 'description',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.CompanyDocumentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  file_url: 'file_url',
  file_type: 'file_type',
  is_active: 'is_active',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.HeroConfigScalarFieldEnum = {
  id: 'id',
  headline: 'headline',
  subheadline: 'subheadline',
  cta_text: 'cta_text',
  video_url: 'video_url',
  stats: 'stats',
  updated_at: 'updated_at'
};

exports.Prisma.PlatformSettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  label: 'label',
  group_name: 'group_name',
  updated_at: 'updated_at'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actor_id: 'actor_id',
  action: 'action',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  description: 'description',
  ip_address: 'ip_address',
  before_state: 'before_state',
  after_state: 'after_state',
  created_at: 'created_at'
};

exports.Prisma.InstructorApplicationScalarFieldEnum = {
  id: 'id',
  full_name: 'full_name',
  email: 'email',
  phone: 'phone',
  location: 'location',
  experience: 'experience',
  expertise: 'expertise',
  course_title: 'course_title',
  course_category: 'course_category',
  course_description: 'course_description',
  teaching_experience: 'teaching_experience',
  status: 'status',
  admin_note: 'admin_note',
  registered_user_id: 'registered_user_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.BatchScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  start_date: 'start_date',
  end_date: 'end_date',
  timezone: 'timezone',
  zoom_meeting_id: 'zoom_meeting_id',
  zoom_join_url: 'zoom_join_url',
  zoom_password: 'zoom_password',
  details: 'details',
  status: 'status',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.BatchInstructorScalarFieldEnum = {
  id: 'id',
  batch_id: 'batch_id',
  user_id: 'user_id'
};

exports.Prisma.BatchCourseScalarFieldEnum = {
  id: 'id',
  batch_id: 'batch_id',
  course_id: 'course_id'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  full_name: 'full_name',
  mobile: 'mobile',
  email: 'email',
  city: 'city',
  referred_by: 'referred_by',
  course_interest: 'course_interest',
  status: 'status',
  notes: 'notes',
  source: 'source',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ZoomConfigurationScalarFieldEnum = {
  id: 'id',
  organization_id: 'organization_id',
  account_id: 'account_id',
  client_id: 'client_id',
  client_secret: 'client_secret',
  app_name: 'app_name',
  webhook_secret: 'webhook_secret',
  is_active: 'is_active',
  created_by: 'created_by',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ZoomAttendanceScalarFieldEnum = {
  id: 'id',
  live_class_id: 'live_class_id',
  zoom_meeting_id: 'zoom_meeting_id',
  participant_uuid: 'participant_uuid',
  participant_name: 'participant_name',
  user_email: 'user_email',
  join_time: 'join_time',
  leave_time: 'leave_time',
  duration_secs: 'duration_secs',
  attentiveness: 'attentiveness',
  device: 'device',
  network_type: 'network_type',
  is_guest: 'is_guest',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ZoomRecordingScalarFieldEnum = {
  id: 'id',
  live_class_id: 'live_class_id',
  zoom_meeting_id: 'zoom_meeting_id',
  recording_id: 'recording_id',
  file_type: 'file_type',
  file_size: 'file_size',
  play_url: 'play_url',
  download_url: 'download_url',
  recording_start: 'recording_start',
  recording_end: 'recording_end',
  duration_secs: 'duration_secs',
  status: 'status',
  created_at: 'created_at'
};

exports.Prisma.ZoomWebhookEventScalarFieldEnum = {
  id: 'id',
  event_type: 'event_type',
  meeting_id: 'meeting_id',
  payload: 'payload',
  processed: 'processed',
  error: 'error',
  received_at: 'received_at'
};

exports.Prisma.MonthlyTargetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  required_left_bv: 'required_left_bv',
  required_right_bv: 'required_right_bv',
  reward_desc: 'reward_desc',
  cash_value: 'cash_value',
  image_url: 'image_url',
  time_limit: 'time_limit',
  order_index: 'order_index',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SupportTicketScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  subject: 'subject',
  message: 'message',
  attachment_url: 'attachment_url',
  status: 'status',
  admin_note: 'admin_note',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SupportMessageScalarFieldEnum = {
  id: 'id',
  ticket_id: 'ticket_id',
  sender: 'sender',
  content: 'content',
  attachment_url: 'attachment_url',
  created_at: 'created_at'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoice_number: 'invoice_number',
  user_id: 'user_id',
  type: 'type',
  status: 'status',
  subtotal: 'subtotal',
  gst_rate: 'gst_rate',
  gst_amount: 'gst_amount',
  tds_rate: 'tds_rate',
  tds_amount: 'tds_amount',
  admin_charge: 'admin_charge',
  total_amount: 'total_amount',
  reference_id: 'reference_id',
  reference_type: 'reference_type',
  description: 'description',
  category: 'category',
  gst_category: 'gst_category',
  admin_note: 'admin_note',
  workflow_stage: 'workflow_stage',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.PackagePurchaseLogScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  package_id: 'package_id',
  bv: 'bv',
  created_at: 'created_at'
};

exports.Prisma.RoyaltyDistributionLogScalarFieldEnum = {
  id: 'id',
  year: 'year',
  month: 'month',
  total_company_bv: 'total_company_bv',
  pool_bv: 'pool_bv',
  qualified_count: 'qualified_count',
  distributions_count: 'distributions_count',
  ran_at: 'ran_at',
  ran_by: 'ran_by'
};

exports.Prisma.IncomeSourceScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  description: 'description',
  category: 'category',
  rate: 'rate',
  fixed_amount: 'fixed_amount',
  daily_cap: 'daily_cap',
  generation_level: 'generation_level',
  min_bv_per_side: 'min_bv_per_side',
  min_months: 'min_months',
  cap_amount: 'cap_amount',
  cap_period_value: 'cap_period_value',
  cap_period_unit: 'cap_period_unit',
  is_active: 'is_active',
  is_system: 'is_system',
  order_index: 'order_index',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  admin: 'admin',
  instructor: 'instructor',
  student: 'student'
};

exports.BinaryPosition = exports.$Enums.BinaryPosition = {
  left: 'left',
  right: 'right'
};

exports.KycStatus = exports.$Enums.KycStatus = {
  pending: 'pending',
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected'
};

exports.Gender = exports.$Enums.Gender = {
  male: 'male',
  female: 'female',
  other: 'other'
};

exports.CourseStatus = exports.$Enums.CourseStatus = {
  draft: 'draft',
  published: 'published'
};

exports.LessonType = exports.$Enums.LessonType = {
  video: 'video',
  pdf: 'pdf',
  text: 'text',
  quiz: 'quiz'
};

exports.EnrollmentStatus = exports.$Enums.EnrollmentStatus = {
  in_progress: 'in_progress',
  completed: 'completed'
};

exports.LiveClassStatus = exports.$Enums.LiveClassStatus = {
  upcoming: 'upcoming',
  live: 'live',
  ended: 'ended',
  cancelled: 'cancelled'
};

exports.QuestionType = exports.$Enums.QuestionType = {
  mcq: 'mcq',
  user_input: 'user_input',
  open_ended: 'open_ended'
};

exports.KycDocStatus = exports.$Enums.KycDocStatus = {
  draft: 'draft',
  submitted: 'submitted',
  awaiting_dsa_review: 'awaiting_dsa_review',
  approved: 'approved',
  rejected: 'rejected'
};

exports.Leg = exports.$Enums.Leg = {
  left: 'left',
  right: 'right'
};

exports.CommissionType = exports.$Enums.CommissionType = {
  dsi: 'dsi',
  gen2: 'gen2',
  gen3: 'gen3',
  binary: 'binary',
  car_fund: 'car_fund',
  house_fund: 'house_fund',
  royalty: 'royalty'
};

exports.CommissionStatus = exports.$Enums.CommissionStatus = {
  pending: 'pending',
  approved: 'approved',
  paid: 'paid'
};

exports.WithdrawalStatus = exports.$Enums.WithdrawalStatus = {
  pending: 'pending',
  processing: 'processing',
  paid: 'paid',
  rejected: 'rejected'
};

exports.ClaimStatus = exports.$Enums.ClaimStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  delivered: 'delivered',
  cancelled: 'cancelled'
};

exports.BatchStatus = exports.$Enums.BatchStatus = {
  upcoming: 'upcoming',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled'
};

exports.LeadStatus = exports.$Enums.LeadStatus = {
  new: 'new',
  contacted: 'contacted',
  interested: 'interested',
  converted: 'converted',
  lost: 'lost'
};

exports.Prisma.ModelName = {
  User: 'User',
  Package: 'Package',
  Course: 'Course',
  CourseModule: 'CourseModule',
  Lesson: 'Lesson',
  Enrollment: 'Enrollment',
  LessonProgress: 'LessonProgress',
  LiveClassRegistrant: 'LiveClassRegistrant',
  LiveClass: 'LiveClass',
  ZoomAccount: 'ZoomAccount',
  Quiz: 'Quiz',
  QuizQuestion: 'QuizQuestion',
  QuizResult: 'QuizResult',
  Assignment: 'Assignment',
  Submission: 'Submission',
  CertTemplate: 'CertTemplate',
  Certificate: 'Certificate',
  KycDocument: 'KycDocument',
  Referral: 'Referral',
  BinaryBvLog: 'BinaryBvLog',
  BinaryMatchLog: 'BinaryMatchLog',
  CommissionTransaction: 'CommissionTransaction',
  WithdrawalRequest: 'WithdrawalRequest',
  RewardMilestone: 'RewardMilestone',
  RewardMilestoneLog: 'RewardMilestoneLog',
  RewardClaimRequest: 'RewardClaimRequest',
  Notification: 'Notification',
  NotificationTemplate: 'NotificationTemplate',
  IntegrationSettings: 'IntegrationSettings',
  Testimonial: 'Testimonial',
  PartnerCompany: 'PartnerCompany',
  Faq: 'Faq',
  Product: 'Product',
  GSTCategory: 'GSTCategory',
  ProductOrder: 'ProductOrder',
  GalleryImage: 'GalleryImage',
  CompanyCertification: 'CompanyCertification',
  CompanyDocument: 'CompanyDocument',
  HeroConfig: 'HeroConfig',
  PlatformSetting: 'PlatformSetting',
  AuditLog: 'AuditLog',
  InstructorApplication: 'InstructorApplication',
  Batch: 'Batch',
  BatchInstructor: 'BatchInstructor',
  BatchCourse: 'BatchCourse',
  Lead: 'Lead',
  ZoomConfiguration: 'ZoomConfiguration',
  ZoomAttendance: 'ZoomAttendance',
  ZoomRecording: 'ZoomRecording',
  ZoomWebhookEvent: 'ZoomWebhookEvent',
  MonthlyTarget: 'MonthlyTarget',
  SupportTicket: 'SupportTicket',
  SupportMessage: 'SupportMessage',
  Invoice: 'Invoice',
  PackagePurchaseLog: 'PackagePurchaseLog',
  RoyaltyDistributionLog: 'RoyaltyDistributionLog',
  IncomeSource: 'IncomeSource'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
