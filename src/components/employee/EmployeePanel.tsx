import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { adminNavItems } from '../../constants/adminNav';
import { ActiveTab } from '../../types';
import { Rocket, LogOut, X, Menu, ShieldAlert, Wallet, User, UserCircle, GitCommit } from 'lucide-react';
import { api } from '../../services/api';
import GenealogyTree from '../GenealogyTree';

// Reuse the exact same Admin*.tsx page components real admins use — the backend
// permission check (requirePermission/requireContentPermission) is the actual security
// boundary, so no page needs a separate employee-specific implementation.
import AdminDashboard from '../admin/AdminDashboard';
import AdminUsers from '../admin/AdminUsers';
import AdminKYC from '../admin/AdminKYC';
import AdminWithdrawals from '../admin/AdminWithdrawals';
import AdminMLM from '../admin/AdminMLM';
import AdminCourses from '../admin/AdminCourses';
import AdminAssignments from '../admin/AdminAssignments';
import CourseCreatePage from '../admin/CourseCreatePage';
import CourseDetailPage from '../admin/CourseDetailPage';
import QuizCreatePage from '../admin/QuizCreatePage';
import BatchCreatePage from '../admin/BatchCreatePage';
import BatchManagePage from '../admin/BatchManagePage';
import AdminCMS from '../admin/AdminCMS';
import AdminCRM from '../admin/AdminCRM';
import AdminReports from '../admin/AdminReports';
import AdminSettings from '../admin/AdminSettings';
import AdminLiveClasses from '../admin/AdminLiveClasses';
import AdminLiveClassAnalytics from '../admin/AdminLiveClassAnalytics';
import AdminZoomAccounts from '../admin/AdminZoomAccounts';
import AdminEnrollments from '../admin/AdminEnrollments';
import AdminCourseBundles from '../admin/AdminCourseBundles';
import AdminRewards from '../admin/AdminRewards';
import AdminInstructorApplications from '../admin/AdminInstructorApplications';
import AdminTaxReport from '../admin/AdminTaxReport';
import AdminMLMCriteria from '../admin/AdminMLMCriteria';
import AdminNotificationTemplates from '../admin/AdminNotificationTemplates';
import AdminProducts from '../admin/AdminProducts';
import AdminOrders from '../admin/AdminOrders';
import AdminQueries from '../admin/AdminQueries';
import AdminInvoices from '../admin/AdminInvoices';
import EmployeePayslips from './EmployeePayslips';
import EmployeeProfile from './EmployeeProfile';

// Sub-navigation tabs (course-create/detail, quiz-create, batch-create/manage) aren't
// independently listed in the permission matrix — they're all reached via the Courses
// page, so their access lives under the 'admin-courses' grant.
const PAGE_KEY_ALIASES: Partial<Record<ActiveTab, string>> = {
  'admin-course-create': 'admin-courses',
  'admin-course-detail': 'admin-courses',
  'admin-quiz-create': 'admin-courses',
  'admin-batch-create': 'admin-courses',
  'admin-batch-manage': 'admin-courses',
  'genealogy': 'admin-mlm',
};

// Always reachable regardless of role grants — no page_key check needed.
const ALWAYS_ALLOWED: ActiveTab[] = ['employee-dashboard', 'employee-payslips', 'employee-profile', 'genealogy', 'admin-mlm'];

function EmployeeDashboardHome({ permittedCount }: { permittedCount: number }) {
  const employeeProfile = useAppStore(s => s.employeeProfile);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Welcome, {employeeProfile?.full_name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {employeeProfile?.designation ? `${employeeProfile.designation} · ` : ''}{employeeProfile?.employee_code}
        </p>
      </div>
      <div className="p-4 rounded-xl border border-border bg-card text-sm text-muted-foreground">
        {permittedCount > 0
          ? `You have access to ${permittedCount} section${permittedCount === 1 ? '' : 's'} — pick one from the sidebar.`
          : "You don't have any sections granted yet — ask an admin to assign you a role."}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('employee-payslips')}
          className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
        >
          <Wallet className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">My Payslips</p>
            <p className="text-xs text-muted-foreground">View your payslip and incentive history</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('employee-profile')}
          className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
        >
          <UserCircle className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">My Profile</p>
            <p className="text-xs text-muted-foreground">View your details and change your password</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('genealogy')}
          className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-left col-span-1 sm:col-span-2"
        >
          <GitCommit className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">Genealogy Tree</p>
            <p className="text-xs text-muted-foreground">View platform network, team placements & BV volumes</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function EmployeePanel() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const activeCourseId = useAppStore(s => s.activeCourseId);
  const setActiveCourseId = useAppStore(s => s.setActiveCourseId);
  const employeeProfile = useAppStore(s => s.employeeProfile);
  const employeePermissions = useAppStore(s => s.employeePermissions);
  const employeeLogout = useAppStore(s => s.employeeLogout);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refresh the permission map on mount — if an admin revoked a role while this employee
  // was logged in, a stale persisted map shouldn't stay in effect longer than necessary.
  useEffect(() => {
    api.employeeAuth.me().then(({ permissions }) => {
      useAppStore.setState({ employeePermissions: permissions });
    }).catch(() => { /* best-effort */ });
  }, []);

  const permittedNavItems = adminNavItems.filter(item => employeePermissions[item.id]?.view);

  const effectivePageKey = PAGE_KEY_ALIASES[activeTab] ?? activeTab;
  const hasAccess = ALWAYS_ALLOWED.includes(activeTab) || !!employeePermissions[effectivePageKey]?.view;

  function renderContent() {
    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-bold text-foreground">You don't have access to this section</p>
          <p className="text-xs text-muted-foreground">Ask an admin to grant you the relevant permission.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'admin-dashboard':    return <AdminDashboard />;
      case 'admin-users':        return <AdminUsers />;
      case 'admin-kyc':          return <AdminKYC />;
      case 'admin-withdrawals':  return <AdminWithdrawals />;
      case 'admin-mlm':          return <AdminMLM />;
      case 'admin-courses':      return <AdminCourses />;
      case 'admin-course-create': return <CourseCreatePage
        courseId={activeCourseId ?? undefined}
        onBack={() => { setActiveCourseId(null); setActiveTab('admin-courses'); }}
      />;
      case 'admin-course-detail': return activeCourseId
        ? <CourseDetailPage courseId={activeCourseId} onBack={() => setActiveTab('admin-courses')} role="admin" />
        : <AdminCourses />;
      case 'admin-quiz-create':   return <QuizCreatePage onBack={() => setActiveTab('admin-courses')} />;
      case 'admin-batch-create':  return <BatchCreatePage onBack={() => setActiveTab('admin-batch-manage')} />;
      case 'admin-batch-manage':  return (
        <BatchManagePage onBack={() => setActiveTab('admin-courses')} onCreateBatch={() => setActiveTab('admin-batch-create')} role="admin" />
      );
      case 'admin-live-classes': return <AdminLiveClasses />;
      case 'admin-live-class-analytics': return <AdminLiveClassAnalytics />;
      case 'admin-assignments':  return <AdminAssignments />;
      case 'admin-cms':          return <AdminCMS />;
      case 'admin-reports':      return <AdminReports />;
      case 'admin-settings':     return <AdminSettings />;
      case 'admin-zoom-accounts': return <AdminZoomAccounts />;
      case 'admin-crm':          return <AdminCRM />;
      case 'admin-enrollments':  return <AdminEnrollments />;
      case 'admin-course-bundles': return <AdminCourseBundles />;
      case 'admin-rewards':      return <AdminRewards />;
      case 'admin-instructor-applications': return <AdminInstructorApplications />;
      case 'admin-tax-report':   return <AdminTaxReport />;
      case 'admin-mlm-criteria': return <AdminMLMCriteria />;
      case 'admin-notification-templates': return <AdminNotificationTemplates />;
      case 'admin-products':     return <AdminProducts />;
      case 'admin-orders':       return <AdminOrders />;
      case 'admin-invoices':     return <AdminInvoices />;
      case 'admin-queries':      return <AdminQueries />;
      case 'genealogy':          return <GenealogyTree adminMode />;
      case 'employee-payslips':  return <EmployeePayslips />;
      case 'employee-profile':   return <EmployeeProfile />;
      default: return <EmployeeDashboardHome permittedCount={permittedNavItems.length} />;
    }
  }

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden overflow-x-hidden bg-background text-foreground antialiased select-none font-sans">
      {mobileOpen && (
        <button type="button" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-80 max-w-[85vw] bg-sidebar border-r border-sidebar-border h-screen transition-transform duration-300 lg:static lg:translate-x-0 lg:flex lg:w-64 lg:h-screen lg:sticky lg:top-0 lg:shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm tracking-wide text-amber-500 leading-tight">T2U Portal</span>
              <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Employee Access</span>
            </div>
          </div>
          <button type="button" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-none space-y-1">
          <button
            type="button" onClick={() => { setActiveTab('employee-dashboard'); setMobileOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'employee-dashboard' ? 'bg-primary/10 text-primary border border-primary/25 font-bold' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
            }`}
          >
            <User className="w-4 h-4" />Dashboard
          </button>
          <button
            type="button" onClick={() => { setActiveTab('employee-payslips'); setMobileOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'employee-payslips' ? 'bg-primary/10 text-primary border border-primary/25 font-bold' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
            }`}
          >
            <Wallet className="w-4 h-4" />My Payslips
          </button>
          <button
            type="button" onClick={() => { setActiveTab('employee-profile'); setMobileOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'employee-profile' ? 'bg-primary/10 text-primary border border-primary/25 font-bold' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
            }`}
          >
            <UserCircle className="w-4 h-4" />My Profile
          </button>
          <button
            type="button" onClick={() => { setActiveTab('genealogy'); setMobileOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'genealogy' ? 'bg-primary/10 text-primary border border-primary/25 font-bold' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
            }`}
          >
            <GitCommit className="w-4 h-4" />Genealogy Tree
          </button>

          {permittedNavItems.length > 0 && (
            <p className="text-[8.5px] font-bold uppercase tracking-widest px-3 py-1 mt-3 mb-1 text-muted-foreground">Granted Access</p>
          )}
          {permittedNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id} type="button" onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-primary/10 text-primary border border-primary/25 font-bold' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />{item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/80 shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-sidebar-accent to-transparent p-2 border border-sidebar-border/50">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[11px] font-black text-amber-600 shrink-0">
              {employeeProfile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-bold text-sidebar-foreground truncate">{employeeProfile?.full_name}</h4>
              <p className="text-[9px] text-muted-foreground truncate font-mono">{employeeProfile?.email}</p>
            </div>
            <button type="button" title="Log Out" onClick={employeeLogout}
              className="text-muted-foreground hover:text-rose-500 transition-colors shrink-0 p-1 hover:bg-rose-500/10 rounded-md">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-x-hidden">
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0 bg-card/50 lg:hidden">
          <button type="button" aria-label="Open navigation menu" onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Employee Access</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
