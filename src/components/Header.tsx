import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { Sun, Moon, Bell, ShieldCheck, CheckCircle, Clock, AlertTriangle, Shield, HelpCircle, Menu, LogOut } from 'lucide-react';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Maps raw DB status → display label + style
function kycBadge(status: string | undefined) {
  switch (status) {
    case 'approved':
      return { label: 'KYC Verified', icon: CheckCircle, cls: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500' };
    case 'awaiting_dsa_review':
      return { label: 'DSA Review', icon: Clock, cls: 'bg-violet-500/10 border-violet-500/25 text-violet-500' };
    case 'submitted':
      return { label: 'In Review', icon: Clock, cls: 'bg-amber-500/10 border-amber-500/25 text-amber-500' };
    case 'rejected':
      return { label: 'KYC Failed', icon: AlertTriangle, cls: 'bg-rose-500/10 border-rose-500/25 text-rose-500' };
    case 'draft':
    case 'not_submitted':
    default:
      return { label: 'KYC Pending', icon: Shield, cls: 'bg-blue-500/10 border-blue-500/25 text-blue-500' };
  }
}

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { activeTab, setActiveTab, darkMode, toggleDarkMode, userProfile, authToken, logout } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const qc = useQueryClient();

  // Fetch real KYC status from backend
  const { data: apiKyc } = useQuery({
    queryKey: ['my-kyc', authToken],
    queryFn: () => api.kyc.me(),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', authToken],
    queryFn: () => api.notifications.list(),
    enabled: !!authToken,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unread_count ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const isAdmin = (userProfile?.role as string)?.toLowerCase() === 'admin';
  const badge = kycBadge(!isAdmin && authToken ? apiKyc?.status : undefined);
  const BadgeIcon = badge.icon;

  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'home':
        return { title: `Welcome back, ${userProfile.name}!`, subtitle: 'Manage your courses and batches at a glance.' };
      case 'income-dashboard':
        return { title: 'Income & Earnings Overview', subtitle: 'Track your balance, claim daily bounties, and analyze performance.' };
      case 'genealogy':
        return { title: 'Genealogy Node Tree', subtitle: 'Build your left and right teams, match BV, and earn commission matching payouts.' };
      case 'commission-history':
        return { title: 'Transaction History Ledger', subtitle: 'Browse chronological history of rewards and withdrawals.' };
      case 'courses':
        return { title: 'Academic Hub', subtitle: 'Explore high-tier certs, micro-credentials, and start qualifying for premium gigs.' };
      case 'kyc':
        return { title: 'Compliance Vault', subtitle: 'Secure your biometric records and verify your identity details.' };
      case 'support':
        return { title: 'Help & Support Vault', subtitle: 'Submit queries and review active responses.' };
      default:
        return { title: 'T2U LMS Workspace', subtitle: 'Upgrade your future roadmap.' };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-xs shrink-0 select-none">
      <div className="flex items-center min-w-0">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          className="mr-3 rounded-full border border-border/70 bg-card/70 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Title / Breadcrumb */}
        <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
          <span>Dashboard</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground">
            {activeTab === 'home' ? 'Home' :
             activeTab === 'courses' ? 'Learning' :
             activeTab === 'income-dashboard' ? 'Vault' :
             activeTab === 'genealogy' ? 'Tree' :
             activeTab === 'commission-history' ? 'Ledger' :
             activeTab === 'support' ? 'Support' : 'KYC'}
          </span>
        </div>
          <h1 className="text-xs md:text-sm font-bold text-foreground truncate">{title}</h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          type="button"
          id="header-dark-mode-btn"
          onClick={toggleDarkMode}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          title="Toggle Display Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-500" />}
        </button>

        {/* Mobile logout */}
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-rose-500/20 bg-rose-500/10 p-2 text-rose-500 transition-colors hover:bg-rose-500/20 lg:hidden"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* Support Help Button */}
        {!isAdmin && (
          <button
            type="button"
            id="header-support-btn"
            title="Help & Support"
            onClick={() => setActiveTab('support')}
            className={`p-2 rounded-full transition-colors ${
              activeTab === 'support' ? 'text-violet-500 bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            id="notification-bell-btn"
            title="Toggle Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl border border-border shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                <span className="text-xs font-bold text-foreground">Notifications Feed</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{unreadCount} NEW</span>
                )}
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-6">No notifications yet.</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.is_read) markReadMutation.mutate(n.id); }}
                      className={`p-2 rounded-lg text-xs leading-normal transition-colors cursor-pointer ${!n.is_read ? 'bg-secondary/70 font-medium' : 'hover:bg-muted/50'}`}
                    >
                      <div className="flex justify-between items-start gap-1 pb-1">
                        <div className="min-w-0">
                          <span className="text-foreground text-[11px] font-bold block">{n.title}</span>
                          <span className="text-muted-foreground text-[10px]">{n.body}</span>
                        </div>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />}
                      </div>
                      <span className="text-[9px] text-muted-foreground block font-mono">{timeAgo(n.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="w-full mt-2 pt-2 border-t border-border text-[10px] font-bold text-primary hover:underline text-center"
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>

        {/* KYC status badge — real database value; hidden for admin */}
        {!isAdmin && (
          <div className={`hidden sm:flex items-center gap-1 text-[10px] border font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${badge.cls}`}>
            <BadgeIcon className="w-3 h-3 shrink-0" />
            {badge.label}
          </div>
        )}

        {/* Mobile avatar */}
        <div className="sm:hidden flex items-center gap-2">
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full border border-border"
          />
        </div>
      </div>
    </header>
  );
}
