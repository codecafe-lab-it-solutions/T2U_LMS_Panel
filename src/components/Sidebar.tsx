import { useAppStore } from '../store/useAppStore';
import { 
  Home, Wallet, Users, History, GraduationCap, ShieldCheck, 
  LogOut, Rocket, BookOpen, Video, HelpCircle, 
  FileText, Award, Sparkles, Link, GitCommit, ArrowUpRight, 
  Bell, Settings, FolderOpen, Tv, FileSpreadsheet, ClipboardList, 
  BarChart3, DollarSign 
} from 'lucide-react';
import { ActiveTab } from '../types';

export default function Sidebar() {
  const { activeTab, setActiveTab, userProfile, userRole, logout } = useAppStore();

  // Navigation Items for Student Role
  const studentNavItems = [
    { id: 'home' as ActiveTab, label: 'Dashboard', icon: Home },
    { id: 'courses' as ActiveTab, label: 'My Courses', icon: BookOpen },
    { id: 'live-classes' as ActiveTab, label: 'Live Classes', icon: Video },
    { id: 'quizzes' as ActiveTab, label: 'Quizzes', icon: HelpCircle },
    { id: 'assignments' as ActiveTab, label: 'Assignments', icon: FileText },
    { id: 'certificates' as ActiveTab, label: 'Certificates', icon: Award },
    { id: 'rewards' as ActiveTab, label: 'Rewards', icon: Sparkles },
    { id: 'referral-dashboard' as ActiveTab, label: 'Referral Dashboard', icon: Link },
    { id: 'my-team' as ActiveTab, label: 'My Team', icon: Users },
    { id: 'genealogy' as ActiveTab, label: 'Genealogy', icon: GitCommit },
    { id: 'income-dashboard' as ActiveTab, label: 'Income Dashboard', icon: Wallet },
    { id: 'commission-history' as ActiveTab, label: 'Commission History', icon: History },
    { id: 'withdrawals' as ActiveTab, label: 'Withdrawal Requests', icon: ArrowUpRight },
    { id: 'kyc' as ActiveTab, label: 'KYC Verification', icon: ShieldCheck },
    { id: 'notifications' as ActiveTab, label: 'Notifications', icon: Bell },
    { id: 'settings' as ActiveTab, label: 'Profile Settings', icon: Settings },
  ];

  // Navigation Items for Instructor Role
  const instructorNavItems = [
    { id: 'home' as ActiveTab, label: 'Dashboard', icon: Home },
    { id: 'course-management' as ActiveTab, label: 'Course Management', icon: FolderOpen },
    { id: 'live-class-management' as ActiveTab, label: 'Live Classes Manager', icon: Tv },
    { id: 'quiz-management' as ActiveTab, label: 'Quiz Management', icon: FileSpreadsheet },
    { id: 'assignment-management' as ActiveTab, label: 'Assignments Manager', icon: ClipboardList },
    { id: 'student-analytics' as ActiveTab, label: 'Student Analytics', icon: BarChart3 },
    { id: 'instructor-earnings' as ActiveTab, label: 'Instructor Earnings', icon: DollarSign },
    { id: 'referral-dashboard' as ActiveTab, label: 'Referral Dashboard', icon: Link },
    { id: 'my-team' as ActiveTab, label: 'My Team', icon: Users },
    { id: 'genealogy' as ActiveTab, label: 'Genealogy', icon: GitCommit },
    { id: 'kyc' as ActiveTab, label: 'KYC Verification', icon: ShieldCheck },
    { id: 'settings' as ActiveTab, label: 'Profile Settings', icon: Settings },
  ];

  const currentNavItems = userRole === 'instructor' ? instructorNavItems : studentNavItems;

  return (
    <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border/50 select-none">
        <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-sm tracking-wide text-violet-500 leading-tight">
            T2U Portal
          </span>
          <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
            {userRole === 'instructor' ? 'INSTRUCTOR VIEW' : 'STUDENT VIEW'}
          </span>
        </div>
      </div>

      {/* Navigation list - Scrollable */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-none">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1 mb-2">Navigation</p>
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/25 shadow-[0_0_12px_rgba(124,58,237,0.06)] font-bold'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/80 shrink-0">
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
            onClick={logout}
            className="text-muted-foreground hover:text-rose-500 transition-colors shrink-0 p-1 hover:bg-rose-500/10 rounded-md"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
