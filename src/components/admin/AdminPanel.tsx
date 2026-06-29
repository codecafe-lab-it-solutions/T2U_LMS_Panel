import { useAppStore } from '../../store/useAppStore';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminKYC from './AdminKYC';
import AdminWithdrawals from './AdminWithdrawals';
import AdminMLM from './AdminMLM';
import AdminCourses from './AdminCourses';
import CourseCreatePage from './CourseCreatePage';
import QuizCreatePage from './QuizCreatePage';
import BatchCreatePage from './BatchCreatePage';
import AdminCMS from './AdminCMS';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminLiveClasses from './AdminLiveClasses';
import AdminZoomAccounts from './AdminZoomAccounts';

export default function AdminPanel() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);

  switch (activeTab) {
    case 'admin-dashboard':    return <AdminDashboard />;
    case 'admin-users':        return <AdminUsers />;
    case 'admin-kyc':          return <AdminKYC />;
    case 'admin-withdrawals':  return <AdminWithdrawals />;
    case 'admin-mlm':          return <AdminMLM />;
    case 'admin-courses':      return <AdminCourses />;
    case 'admin-course-create':return <CourseCreatePage onBack={() => setActiveTab('admin-courses')} />;
    case 'admin-quiz-create':   return <QuizCreatePage onBack={() => setActiveTab('admin-courses')} />;
    case 'admin-batch-create':  return <BatchCreatePage onBack={() => setActiveTab('admin-courses')} />;
    case 'admin-live-classes': return <AdminLiveClasses />;
    case 'admin-assignments':  return <AdminCourses />;
    case 'admin-cms':          return <AdminCMS />;
    case 'admin-reports':      return <AdminReports />;
    case 'admin-settings':     return <AdminSettings />;
    case 'admin-zoom-accounts': return <AdminZoomAccounts />;
    default:                   return <AdminDashboard />;
  }
}
