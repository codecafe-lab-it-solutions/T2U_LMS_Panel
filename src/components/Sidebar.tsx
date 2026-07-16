import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Home, Wallet, Users, History, ShieldCheck,
  LogOut, Rocket, BookOpen, Video, HelpCircle,
  FileText, Award, Sparkles, Link, GitCommit, ArrowUpRight,
  Bell, Settings, FolderOpen, Tv, FileSpreadsheet, ClipboardList,
  BarChart3, DollarSign, Package, LineChart, Network, ClipboardCheck,
  LayoutDashboard, UserCog, BookMarked, MonitorPlay, Globe, TrendingUp, Sliders, Zap, UserPlus, Trophy, ShoppingBag,
  Receipt, X, Lock, Layers,
} from 'lucide-react';
import { ActiveTab } from '../types';
import ConfirmDialog from './ConfirmDialog';
import { INSTRUCTOR_MANAGEMENT_TABS } from '../constants/instructorGating';

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** False while an instructor's account is pending admin approval — locks LMS nav items. */
  instructorApproved?: boolean;
};

export default function Sidebar({ mobileOpen = false, onMobileClose, instructorApproved = true }: SidebarProps) {
  const { activeTab, setActiveTab, userProfile, userRole, logout } = useAppStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Navigation Items for Student Role
  const studentNavItems = [
    { id: 'home' as ActiveTab, label: 'Dashboard', icon: Home },
    { id: 'mlm-dashboard' as ActiveTab, label: 'MLM Dashboard', icon: Network },
    { id: 'courses' as ActiveTab, label: 'Courses', icon: BookOpen },
    { id: 'student-products' as ActiveTab, label: 'Shop', icon: Package },
    { id: 'live-classes' as ActiveTab, label: 'Live Classes', icon: Video },
    { id: 'quizzes' as ActiveTab, label: 'Quizzes', icon: HelpCircle },
    { id: 'assignments' as ActiveTab, label: 'Assignments', icon: FileText },
    { id: 'certificates' as ActiveTab, label: 'Certificates', icon: Award },
    { id: 'rewards' as ActiveTab, label: 'Rewards', icon: Trophy },
    { id: 'bv-ledger' as ActiveTab, label: 'BV Ledger', icon: Sparkles },
    { id: 'referral-dashboard' as ActiveTab, label: 'Referral Dashboard', icon: Link },
    { id: 'my-team' as ActiveTab, label: 'My Team', icon: Users },
    { id: 'genealogy' as ActiveTab, label: 'Genealogy', icon: GitCommit },
    { id: 'income-dashboard' as ActiveTab, label: 'Income Dashboard', icon: Wallet },
    { id: 'commission-history' as ActiveTab, label: 'Commission History', icon: History },
    { id: 'withdrawals' as ActiveTab, label: 'Withdrawal Requests', icon: ArrowUpRight },
    { id: 'kyc' as ActiveTab, label: 'KYC Verification', icon: ShieldCheck },
    { id: 'notifications' as ActiveTab, label: 'Notifications', icon: Bell },
    { id: 'invoices' as ActiveTab, label: 'My Invoices', icon: Receipt },
    { id: 'settings' as ActiveTab, label: 'Profile Settings', icon: Settings },
  ];

  // Navigation Items for Instructor Role
  const instructorNavItems = [
    { id: 'home' as ActiveTab, label: 'Dashboard', icon: Home, section: 'Overview' },
    // --- LMS Management ---
    { id: 'instructor-courses' as ActiveTab, label: 'Courses', icon: BookOpen, section: 'LMS' },
    { id: 'instructor-products' as ActiveTab, label: 'Products', icon: Package, section: 'LMS' },
    { id: 'course-management' as ActiveTab, label: 'Course Management', icon: FolderOpen, section: 'LMS' },
    { id: 'live-class-management' as ActiveTab, label: 'Live Classes', icon: Tv, section: 'LMS' },
    { id: 'live-class-analytics' as ActiveTab, label: 'Live Analytics', icon: LineChart, section: 'LMS' },
    { id: 'quiz-management' as ActiveTab, label: 'Quiz Management', icon: FileSpreadsheet, section: 'LMS' },
    { id: 'assignment-management' as ActiveTab, label: 'My Assignments', icon: ClipboardList, section: 'LMS' },
    { id: 'student-analytics' as ActiveTab, label: 'Student Analytics', icon: BarChart3, section: 'LMS' },
    { id: 'referral-dashboard' as ActiveTab, label: 'My Earnings', icon: DollarSign, section: 'LMS' },
    // --- Personal ---
    { id: 'instructor-earnings' as ActiveTab, label: 'My Referral', icon: Link, section: 'Personal' },
    { id: 'rewards' as ActiveTab, label: 'Rewards', icon: Trophy, section: 'Personal' },
    { id: 'bv-ledger' as ActiveTab, label: 'BV Ledger', icon: Sparkles, section: 'Personal' },
    { id: 'my-team' as ActiveTab, label: 'My Team', icon: Users, section: 'Personal' },
    { id: 'genealogy' as ActiveTab, label: 'Genealogy', icon: GitCommit, section: 'Personal' },
    { id: 'instructor-withdrawals' as ActiveTab, label: 'Withdrawal Requests', icon: ArrowUpRight, section: 'Personal' },
    { id: 'invoices' as ActiveTab, label: 'My Invoices', icon: Receipt, section: 'Personal' },
    { id: 'kyc' as ActiveTab, label: 'My KYC', icon: ShieldCheck, section: 'Personal' },
    { id: 'settings' as ActiveTab, label: 'Profile Settings', icon: Settings, section: 'Personal' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { id: 'admin-dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    // --- Platform Management ---
    { id: 'admin-users' as ActiveTab, label: 'User Management', icon: UserCog, section: 'Platform' },
    { id: 'admin-kyc' as ActiveTab, label: 'KYC Management', icon: ShieldCheck, section: 'Platform' },
    { id: 'admin-withdrawals' as ActiveTab, label: 'Withdrawals', icon: ArrowUpRight, section: 'Platform' },
    { id: 'admin-enrollments' as ActiveTab, label: 'Enrollment Management', icon: ClipboardCheck, section: 'Platform' },
    { id: 'admin-products' as ActiveTab, label: 'Product Management', icon: Package, section: 'Platform' },
    { id: 'admin-orders' as ActiveTab, label: 'Product Orders', icon: ShoppingBag, section: 'Platform' },
    { id: 'admin-invoices' as ActiveTab, label: 'Invoices', icon: Receipt, section: 'Platform' },
    { id: 'admin-queries' as ActiveTab, label: 'Support Queries', icon: HelpCircle, section: 'Platform' },
    { id: 'admin-instructor-applications' as ActiveTab, label: 'Instructor Applications', icon: UserPlus, section: 'Platform' },
    { id: 'admin-tax-report' as ActiveTab, label: 'Tax & Charges Report', icon: FileSpreadsheet, section: 'Platform' },
    { id: 'admin-mlm' as ActiveTab, label: 'MLM / Network', icon: Network, section: 'Platform' },
    { id: 'admin-mlm-criteria' as ActiveTab, label: 'Incentive Criteria', icon: Trophy, section: 'Platform' },
    { id: 'admin-packages' as ActiveTab, label: 'Packages', icon: Layers, section: 'Platform' },
    { id: 'admin-notification-templates' as ActiveTab, label: 'Notification Templates', icon: Bell, section: 'Platform' },
    // --- Content ---
    { id: 'admin-courses' as ActiveTab, label: 'Courses', icon: BookMarked, section: 'Content' },
    { id: 'admin-live-classes' as ActiveTab, label: 'Live Classes', icon: MonitorPlay, section: 'Content' },
    { id: 'admin-live-class-analytics' as ActiveTab, label: 'Live Analytics', icon: LineChart, section: 'Content' },
    { id: 'admin-zoom-accounts' as ActiveTab, label: 'Zoom Accounts', icon: Zap, section: 'Content' },
    { id: 'admin-assignments' as ActiveTab, label: 'All Assignments', icon: ClipboardCheck, section: 'Content' },
    { id: 'admin-rewards' as ActiveTab, label: 'Reward Milestones', icon: Trophy, section: 'Content' },
    // --- CMS & Analytics ---
    { id: 'admin-cms' as ActiveTab, label: 'Landing Page CMS', icon: Globe, section: 'CMS' },
    { id: 'admin-crm' as ActiveTab, label: 'CRM — Leads', icon: UserPlus, section: 'CMS' },
    { id: 'admin-reports' as ActiveTab, label: 'Reports', icon: TrendingUp, section: 'CMS' },
    { id: 'admin-settings' as ActiveTab, label: 'Platform Settings', icon: Sliders, section: 'CMS' },
  ];

  const currentNavItems = userRole === 'instructor' ? instructorNavItems : userRole === 'admin' ? adminNavItems : studentNavItems;

  // Group instructor items by section for labeled nav groups
  const renderNavItem = (item: (typeof currentNavItems)[0]) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isLocked = userRole === 'instructor' && !instructorApproved && INSTRUCTOR_MANAGEMENT_TABS.has(item.id);
    return (
      <button
        type="button"
        key={item.id}
        id={`nav-${item.id}`}
        title={isLocked ? 'Locked — pending admin approval' : undefined}
        onClick={() => {
          setActiveTab(item.id);
          onMobileClose?.();
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
          isActive
            ? 'bg-primary/10 text-primary border border-primary/25 shadow-[0_0_12px_rgba(124,58,237,0.06)] font-bold'
            : isLocked
            ? 'text-sidebar-foreground/40 hover:bg-amber-500/5 hover:text-amber-500/80 border border-transparent'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-primary' : isLocked ? 'text-sidebar-foreground/30 group-hover:text-amber-500/70' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'}`} />
          <span>{item.label}</span>
        </div>
        {isLocked ? (
          <Lock className="w-3 h-3 text-amber-500/70 shrink-0" />
        ) : isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
        )}
      </button>
    );
  };

  const renderInstructorNav = () => {
    const sections = ['Overview', 'LMS', 'Personal'];
    const sectionColors: Record<string, string> = {
      Overview: 'text-muted-foreground',
      LMS: 'text-violet-500',
      Personal: 'text-blue-500',
    };
    return sections.map(section => {
      const items = instructorNavItems.filter(i => (i as any).section === section);
      if (items.length === 0) return null;
      return (
        <div key={section}>
          <p className={`text-[8.5px] font-bold uppercase tracking-widest px-3 py-1 mt-3 mb-1 ${sectionColors[section]}`}>{section}</p>
          {items.map(renderNavItem)}
        </div>
      );
    });
  };

  const renderAdminNav = () => {
    const sections = ['Overview', 'Platform', 'Content', 'CMS'];
    const sectionColors: Record<string, string> = {
      Overview: 'text-muted-foreground',
      Platform: 'text-rose-500',
      Content: 'text-violet-500',
      CMS: 'text-amber-500',
    };
    return sections.map(section => {
      const items = adminNavItems.filter(i => (i as any).section === section);
      if (items.length === 0) return null;
      return (
        <div key={section}>
          <p className={`text-[8.5px] font-bold uppercase tracking-widest px-3 py-1 mt-3 mb-1 ${sectionColors[section]}`}>{section}</p>
          {items.map(renderNavItem)}
        </div>
      );
    });
  };

  return (
    <>
    <ConfirmDialog
      open={showLogoutConfirm}
      icon="logout"
      title="Log out of T2U?"
      description="You'll need to sign in again to access your dashboard."
      confirmLabel="Yes, Log Out"
      cancelLabel="Stay"
      onConfirm={logout}
      onCancel={() => setShowLogoutConfirm(false)}
    />
    {mobileOpen && (
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onMobileClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
      />
    )}
    <aside
      id="desktop-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex flex-col w-80 max-w-[85vw] bg-sidebar border-r border-sidebar-border h-screen transition-transform duration-300 lg:static lg:translate-x-0 lg:flex lg:w-64 lg:h-screen lg:sticky lg:top-0 lg:shrink-0 select-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-sidebar-border/50 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm tracking-wide text-violet-500 leading-tight">
              T2U Portal
            </span>
            <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
              {userRole === 'admin' ? 'SUPER ADMIN' : userRole === 'instructor' ? 'INSTRUCTOR' : 'STUDENT VIEW'}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onMobileClose}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation list - Scrollable */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-none">
        {userRole === 'admin' ? (
          renderAdminNav()
        ) : userRole === 'instructor' ? (
          renderInstructorNav()
        ) : (
          <>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1 mb-2">Navigation</p>
            <div className="space-y-1">
              {currentNavItems.map(renderNavItem)}
            </div>
          </>
        )}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/80 shrink-0 space-y-3">
        <button
          type="button"
          onClick={() => {
            onMobileClose?.();
            logout();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-500/20 lg:hidden"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>

        {/* User Mini Profile Card */}
        <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-sidebar-accent to-transparent p-2 border border-sidebar-border/50">
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-sidebar-border shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-bold text-sidebar-foreground truncate">{userProfile.name}</h4>
            <p className="text-[9px] text-muted-foreground truncate font-mono">{userProfile.email}</p>
          </div>
          <button
            type="button"
            title="Log Out Account"
            onClick={() => setShowLogoutConfirm(true)}
            className="text-muted-foreground hover:text-rose-500 transition-colors shrink-0 p-1 hover:bg-rose-500/10 rounded-md"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
