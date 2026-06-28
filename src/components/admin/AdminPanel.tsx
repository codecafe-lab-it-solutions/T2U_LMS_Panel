import { useAppStore } from '../../store/useAppStore';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminKYC from './AdminKYC';
import AdminWithdrawals from './AdminWithdrawals';
import AdminMLM from './AdminMLM';
import AdminCourses from './AdminCourses';
import AdminCMS from './AdminCMS';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';

export default function AdminPanel() {
  const activeTab = useAppStore(s => s.activeTab);

  switch (activeTab) {
    case 'admin-dashboard':   return <AdminDashboard />;
    case 'admin-users':       return <AdminUsers />;
    case 'admin-kyc':         return <AdminKYC />;
    case 'admin-withdrawals': return <AdminWithdrawals />;
    case 'admin-mlm':         return <AdminMLM />;
    case 'admin-courses':     return <AdminCourses />;
    case 'admin-live-classes':return <AdminCourses />;
    case 'admin-assignments': return <AdminCourses />;
    case 'admin-cms':         return <AdminCMS />;
    case 'admin-reports':     return <AdminReports />;
    case 'admin-settings':    return <AdminSettings />;
    default:                  return <AdminDashboard />;
  }
}
