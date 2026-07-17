import { useAppStore } from '../../store/useAppStore';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminKYC from './AdminKYC';
import AdminWithdrawals from './AdminWithdrawals';
import AdminMLM from './AdminMLM';
import AdminCourses from './AdminCourses';
import AdminAssignments from './AdminAssignments';
import CourseCreatePage from './CourseCreatePage';
import CourseDetailPage from './CourseDetailPage';
import QuizCreatePage from './QuizCreatePage';
import BatchCreatePage from './BatchCreatePage';
import BatchManagePage from './BatchManagePage';
import AdminCMS from './AdminCMS';
import AdminCRM from './AdminCRM';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminLiveClasses from './AdminLiveClasses';
import AdminLiveClassAnalytics from './AdminLiveClassAnalytics';
import AdminZoomAccounts from './AdminZoomAccounts';
import AdminEnrollments from './AdminEnrollments';
import AdminRewards from './AdminRewards';
import AdminInstructorApplications from './AdminInstructorApplications';
import AdminTaxReport from './AdminTaxReport';
import AdminMLMCriteria from './AdminMLMCriteria';
import AdminPackages from './AdminPackages';
import AdminNotificationTemplates from './AdminNotificationTemplates';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminQueries from './AdminQueries';
import AdminInvoices from './AdminInvoices';
import AdminIncomeSources from './AdminIncomeSources';
import AdminEmployees from './AdminEmployees';
import AdminEmployeeRoles from './AdminEmployeeRoles';
import AdminEmployeePayroll from './AdminEmployeePayroll';

export default function AdminPanel() {
  const activeTab = useAppStore(s => s.activeTab);
  const activeCourseId = useAppStore(s => s.activeCourseId);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);

  switch (activeTab) {
    case 'admin-dashboard':    return <AdminDashboard />;
    case 'admin-users':        return <AdminUsers />;
    case 'admin-kyc':          return <AdminKYC />;
    case 'admin-withdrawals':  return <AdminWithdrawals />;
    case 'admin-mlm':          return <AdminMLM />;
    case 'admin-courses':      return <AdminCourses />;
    case 'admin-course-create':return <CourseCreatePage
      courseId={activeCourseId ?? undefined}
      onBack={() => { setActiveCourseId(null); setActiveTab('admin-courses'); }}
    />;
    case 'admin-course-detail':return activeCourseId
      ? <CourseDetailPage courseId={activeCourseId} onBack={() => setActiveTab('admin-courses')} role="admin" />
      : <AdminCourses />;
    case 'admin-quiz-create':   return <QuizCreatePage onBack={() => setActiveTab('admin-courses')} />;
    case 'admin-batch-create':  return <BatchCreatePage onBack={() => setActiveTab('admin-batch-manage')} />;
    case 'admin-batch-manage':  return (
      <BatchManagePage
        onBack={() => setActiveTab('admin-courses')}
        onCreateBatch={() => setActiveTab('admin-batch-create')}
        role="admin"
      />
    );
    case 'admin-live-classes': return <AdminLiveClasses />;
    case 'admin-live-class-analytics': return <AdminLiveClassAnalytics />;
    case 'admin-assignments':  return <AdminAssignments />;
    case 'admin-cms':          return <AdminCMS />;
    case 'admin-reports':      return <AdminReports />;
    case 'admin-settings':     return <AdminSettings />;
    case 'admin-zoom-accounts': return <AdminZoomAccounts />;
    case 'admin-crm':             return <AdminCRM />;
    case 'admin-team-management': return <AdminMLM />; // merged into MLM / Network
    case 'admin-enrollments':     return <AdminEnrollments />;
    case 'admin-rewards':                    return <AdminRewards />;
    case 'admin-instructor-applications':    return <AdminInstructorApplications />;
    case 'admin-tax-report':                 return <AdminTaxReport />;
    case 'admin-mlm-criteria':               return <AdminMLMCriteria />;
    case 'admin-packages':                   return <AdminPackages />;
    case 'admin-notification-templates':     return <AdminNotificationTemplates />;
    case 'admin-income-sources':             return <AdminIncomeSources />;
    case 'admin-products':                   return <AdminProducts />;
    case 'admin-orders':                     return <AdminOrders />;
    case 'admin-invoices':                   return <AdminInvoices />;
    case 'admin-queries':                    return <AdminQueries />;
    case 'admin-employees':                  return <AdminEmployees />;
    case 'admin-employee-roles':             return <AdminEmployeeRoles />;
    case 'admin-employee-payroll':           return <AdminEmployeePayroll />;
    default:                                 return <AdminDashboard />;
  }
}
