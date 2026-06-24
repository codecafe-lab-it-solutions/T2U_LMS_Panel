import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Sun, Moon, Bell, Search, ShieldCheck, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Header() {
  const { activeTab, darkMode, toggleDarkMode, kycRecord, userProfile } = useAppStore();
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  // Derive dynamic header captions
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'home':
        return { title: `Welcome back, ${userProfile.name}!`, subtitle: 'Manage your courses and batches at a glance.' };
      case 'income-dashboard':
        return { title: 'Vault & Earnings Overview', subtitle: 'Track your balance, claim daily bounties, and analyze performance.' };
      case 'genealogy':
        return { title: 'Genealogy Node Tree', subtitle: 'Build your left and right teams, match BV, and earn commission matching payouts.' };
      case 'commission-history':
        return { title: 'Transaction History Ledger', subtitle: 'Browse chronological history of rewards and withdrawals.' };
      case 'courses':
        return { title: 'Academic Hub', subtitle: 'Explore high-tier certs, micro-credentials, and start qualifying for premium gigs.' };
      case 'kyc':
        return { title: 'Compliance Vault', subtitle: 'Secure your biometric records and verify your identity details.' };
      default:
        return { title: 'T2U LMS Workspace', subtitle: 'Upgrade your future roadmap.' };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  // Mock Notifications list
  const notifications = [
    { id: 1, text: '🎉 Bonus Received! ₹500 referral credit matching generated.', date: '30m ago', unread: true },
    { id: 2, text: '🎓 Course "Foundations of Micro-Earning" is 85% computed.', date: '2h ago', unread: true },
    { id: 3, text: '🛡️ Document validation in progress.', date: '1d ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-xs shrink-0 select-none">
      {/* Title / Breadcrumb block */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
          <span>Dashboard</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground">
            {activeTab === 'home' ? 'Home' : 
             activeTab === 'courses' ? 'Learning' : 
             activeTab === 'income-dashboard' ? 'Vault' : 
             activeTab === 'genealogy' ? 'Tree' : 
             activeTab === 'commission-history' ? 'Ledger' : 'KYC'}
          </span>
        </div>
        <h1 className="text-xs md:text-sm font-bold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Control Right-side elements */}
      <div className="flex items-center gap-3">

        {/* Global dark mode toggle */}
        <button
          id="header-dark-mode-btn"
          onClick={toggleDarkMode}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative"
          title="Toggle Display Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-500" />}
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl border border-border shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                <span className="text-xs font-bold text-foreground">Notifications Feed</span>
                <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">2 NEW</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-2 rounded-lg text-xs leading-normal transition-colors cursor-pointer ${
                      n.unread ? 'bg-secondary/70 font-medium' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 pb-1">
                      <span className="text-foreground text-[11px]">{n.text}</span>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />}
                    </div>
                    <span className="text-[9px] text-muted-foreground block font-mono">{n.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic KYC Badge for user review visibility */}
        <div className="flex items-center gap-1.5">
          {kycRecord.status === 'Verified' ? (
            <div className="hidden sm:flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <CheckCircle className="w-3 h-3" />
              Verified
            </div>
          ) : kycRecord.status === 'Pending Verification' ? (
            <div className="hidden sm:flex items-center gap-1 text-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Clock className="w-3 h-3 animate-spin" />
              In Review
            </div>
          ) : kycRecord.status === 'Rejected' ? (
            <div className="hidden sm:flex items-center gap-1 text-[10px] bg-rose-500/10 border border-rose-500/25 text-rose-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              Failed
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[10px] bg-blue-500/10 border border-blue-500/25 text-blue-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              KYC Pending
            </div>
          )}
        </div>

        {/* Small profile banner */}
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
