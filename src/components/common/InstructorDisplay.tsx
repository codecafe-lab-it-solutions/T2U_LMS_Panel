import React from 'react';
import { Award, CheckCircle2, User } from 'lucide-react';
import { getMediaUrl } from '../../services/api';

export interface InstructorProfile {
  id?: string | number;
  name?: string;
  full_name?: string;
  role?: string;
  company?: string;
  headline?: string | null;
  bio?: string | null;
  avatar?: string | null;
  profile_photo_url?: string | null;
  expertise_tags?: string[] | null;
  is_verified?: boolean;
}

interface InstructorDisplayProps {
  instructor?: InstructorProfile | null;
  variant?: 'card' | 'detail' | 'directory' | 'marquee';
  className?: string;
  showBio?: boolean;
}

export function getInstructorInitials(name?: string): string {
  if (!name) return 'IN';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InstructorDisplay({
  instructor,
  variant = 'card',
  className = '',
  showBio = false,
}: InstructorDisplayProps) {
  const name = instructor?.full_name || instructor?.name || 'T2U Industry Mentor';
  const headline =
    instructor?.headline ||
    (instructor?.role ? `${instructor.role}${instructor.company ? ` • ${instructor.company}` : ''}` : null) ||
    'Industry Specialist & Lead Mentor';
  const bio = instructor?.bio || 'Experienced industry educator and domain mentor at T2U Upgrade.';
  const photo = instructor?.profile_photo_url || instructor?.avatar;
  const initials = getInstructorInitials(name);
  const isPhotoUrl = photo && (photo.startsWith('http') || photo.startsWith('/') || photo.startsWith('data:'));
  const isAvatarGradient = photo && photo.includes('bg-');

  // Avatar element renderer
  const renderAvatar = (sizeClass: string, textClass: string) => {
    if (isPhotoUrl) {
      return (
        <img
          src={getMediaUrl(photo!)}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border border-white/20 shadow-sm shrink-0`}
          loading="lazy"
        />
      );
    }

    if (isAvatarGradient) {
      return (
        <div
          className={`${sizeClass} rounded-full ${photo} flex items-center justify-center font-bold ${textClass} border border-white/20 shadow-sm shrink-0`}
        >
          {initials}
        </div>
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-tr from-brand-coral to-amber-500 text-white flex items-center justify-center font-bold ${textClass} border border-white/20 shadow-sm shrink-0`}
      >
        {initials}
      </div>
    );
  };

  // 1. Marquee variant
  if (variant === 'marquee') {
    return (
      <div className={`flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 ${className}`}>
        {renderAvatar('w-9 h-9', 'text-xs')}
        <div className="leading-tight">
          <p className="text-xs font-bold text-white flex items-center gap-1">
            {name}
            <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
          </p>
          <p className="text-[10px] text-purple-200/70 truncate max-w-[140px]">{headline}</p>
        </div>
      </div>
    );
  }

  // 2. Card variant (Course Grid / Carousel)
  if (variant === 'card') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {renderAvatar('w-8 h-8', 'text-[11px]')}
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1">
            {name}
          </p>
          <p className="text-[10px] text-purple-200/60 truncate leading-tight mt-0.5">
            {headline}
          </p>
        </div>
      </div>
    );
  }

  // 3. Detail variant (Course Details Overview & Sidebar)
  if (variant === 'detail') {
    return (
      <div className={`p-4 rounded-2xl bg-[#1d0b30]/80 border border-white/10 ${className}`}>
        <div className="flex items-start gap-3.5">
          {renderAvatar('w-12 h-12', 'text-sm')}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-bold text-white leading-tight">{name}</h4>
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                <Award className="w-3 h-3" />
                Verified Mentor
              </span>
            </div>
            <p className="text-xs text-brand-coral font-medium mt-0.5">{headline}</p>
            {showBio && (
              <p className="text-xs text-purple-100/75 mt-2 leading-relaxed">
                {bio}
              </p>
            )}
            {instructor?.expertise_tags && instructor.expertise_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {instructor.expertise_tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-white/5 border border-white/10 text-purple-200/80 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Directory variant (Full directory listing)
  return (
    <div className={`bg-[#180927] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-coral/40 transition-all ${className}`}>
      <div>
        <div className="flex items-center gap-4 mb-4">
          {renderAvatar('w-14 h-14', 'text-base')}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-white">{name}</h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-brand-coral font-medium mt-0.5">{headline}</p>
          </div>
        </div>
        <p className="text-xs text-purple-100/70 leading-relaxed mb-4">{bio}</p>
      </div>

      {instructor?.expertise_tags && instructor.expertise_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/10">
          {instructor.expertise_tags.map((tag, i) => (
            <span
              key={i}
              className="text-[11px] bg-white/5 text-purple-200/90 px-2.5 py-1 rounded-lg border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default InstructorDisplay;
