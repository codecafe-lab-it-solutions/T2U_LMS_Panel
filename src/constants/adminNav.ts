import {
  Users, ShieldCheck, ArrowUpRight, ClipboardCheck, Package, ShoppingBag, Receipt,
  HelpCircle, UserPlus, FileSpreadsheet, Network, Trophy, Layers, Bell,
  BookMarked, MonitorPlay, LineChart, Zap, Globe, TrendingUp, Sliders,
  LayoutDashboard, ShieldCheck as HrmsIcon, Wallet, Banknote, Calculator,
} from 'lucide-react';
import { ActiveTab } from '../types';

export interface AdminNavItem {
  id: ActiveTab;
  label: string;
  icon: any;
  section: string;
}

// Single source of truth for every real admin page (page_key = ActiveTab value), reused by
// Sidebar.tsx (full admin nav) and EmployeePanel.tsx (filtered down to an employee's granted
// pages) so the two never drift out of sync. Also doubles as the row list for the permission
// matrix editor in AdminEmployeeRoles.tsx.
export const adminNavItems: AdminNavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  // --- Platform Management ---
  { id: 'admin-users', label: 'User Management', icon: Users, section: 'Platform' },
  { id: 'admin-kyc', label: 'KYC Management', icon: ShieldCheck, section: 'Platform' },
  { id: 'admin-withdrawals', label: 'Withdrawals', icon: ArrowUpRight, section: 'Platform' },
  { id: 'admin-enrollments', label: 'Enrollment Management', icon: ClipboardCheck, section: 'Platform' },
  { id: 'admin-products', label: 'Product Management', icon: Package, section: 'Platform' },
  { id: 'admin-orders', label: 'Product Orders', icon: ShoppingBag, section: 'Platform' },
  { id: 'admin-invoices', label: 'Invoices', icon: Receipt, section: 'Platform' },
  { id: 'admin-queries', label: 'Support Queries', icon: HelpCircle, section: 'Platform' },
  { id: 'admin-instructor-applications', label: 'Instructor Applications', icon: UserPlus, section: 'Platform' },
  { id: 'admin-tax-report', label: 'Tax & Charges Report', icon: FileSpreadsheet, section: 'Platform' },
  { id: 'admin-mlm', label: 'MLM / Network', icon: Network, section: 'Platform' },
  { id: 'admin-mlm-criteria', label: 'Incentive Criteria', icon: Trophy, section: 'Platform' },
  { id: 'admin-packages', label: 'Packages', icon: Layers, section: 'Platform' },
  { id: 'admin-notification-templates', label: 'Notification Templates', icon: Bell, section: 'Platform' },
  // --- Content ---
  { id: 'admin-courses', label: 'Courses', icon: BookMarked, section: 'Content' },
  { id: 'admin-live-classes', label: 'Live Classes', icon: MonitorPlay, section: 'Content' },
  { id: 'admin-live-class-analytics', label: 'Live Analytics', icon: LineChart, section: 'Content' },
  { id: 'admin-zoom-accounts', label: 'Zoom Accounts', icon: Zap, section: 'Content' },
  { id: 'admin-assignments', label: 'All Assignments', icon: ClipboardCheck, section: 'Content' },
  { id: 'admin-rewards', label: 'Reward Milestones', icon: Trophy, section: 'Content' },
  // --- CMS & Analytics ---
  { id: 'admin-cms', label: 'Landing Page CMS', icon: Globe, section: 'CMS' },
  { id: 'admin-crm', label: 'CRM — Leads', icon: UserPlus, section: 'CMS' },
  { id: 'admin-reports', label: 'Reports', icon: TrendingUp, section: 'CMS' },
  { id: 'admin-settings', label: 'Platform Settings', icon: Sliders, section: 'CMS' },
];

// HRMS section — admin-only, never shown to employees (an employee's own panel is built
// purely from adminNavItems filtered by their granted pages; it never references this list).
export const hrmsNavItems: AdminNavItem[] = [
  { id: 'admin-employees', label: 'Employees', icon: Users, section: 'HRMS' },
  { id: 'admin-employee-roles', label: 'Roles & Permissions', icon: HrmsIcon, section: 'HRMS' },
  { id: 'admin-employee-payroll', label: 'Payroll', icon: Wallet, section: 'HRMS' },
];

// Finance section — Super Admin only, same exclusion pattern as hrmsNavItems above: never
// shown to employees regardless of permission grants (EmployeePanel.tsx only ever imports
// adminNavItems, never this list — see server/src/routes/accounts.js and expenses.js, both
// gated by requireAdmin with no employee-permission override).
export const financeNavItems: AdminNavItem[] = [
  { id: 'admin-finance-dashboard', label: 'Finance Dashboard', icon: Banknote, section: 'Finance' },
  { id: 'admin-expenses', label: 'Expenses', icon: Calculator, section: 'Finance' },
];
