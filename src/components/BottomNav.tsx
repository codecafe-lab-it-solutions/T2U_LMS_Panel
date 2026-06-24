import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Home, BookOpen, Video, Wallet, ShieldCheck, Tv, FolderOpen } from 'lucide-react';
import { ActiveTab } from '../types';

export default function BottomNav() {
  const { activeTab, setActiveTab, userRole } = useAppStore();

  // Mobile Bottom items for Student
  const studentItems = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'courses' as ActiveTab, label: 'Courses', icon: BookOpen },
    { id: 'live-classes' as ActiveTab, label: 'Live', icon: Video },
    { id: 'income-dashboard' as ActiveTab, label: 'Income', icon: Wallet },
    { id: 'kyc' as ActiveTab, label: 'KYC', icon: ShieldCheck },
  ];

  // Mobile Bottom items for Instructor
  const instructorItems = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'course-management' as ActiveTab, label: 'Courses', icon: FolderOpen },
    { id: 'live-class-management' as ActiveTab, label: 'Live Mgr', icon: Tv },
    { id: 'instructor-earnings' as ActiveTab, label: 'Earnings', icon: Wallet },
    { id: 'kyc' as ActiveTab, label: 'KYC', icon: ShieldCheck },
  ];

  const currentItems = userRole === 'instructor' ? instructorItems : studentItems;

  return (
    <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/85 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-1 select-none pb-safe transition-colors duration-300">
      {currentItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all text-center relative ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {isActive && (
              <span className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
            )}
            <Icon className={`w-4.5 h-4.5 mb-0.5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
            <span className="text-[9px] font-semibold tracking-tight font-sans leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
