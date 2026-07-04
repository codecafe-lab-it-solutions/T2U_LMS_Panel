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
import AdminTeamManagement from './AdminTeamManagement';

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
    case 'admin-team-management': return <AdminTeamManagement />;
    default:                      return <AdminDashboard />;
  }
}
