import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', iconOnly = false, size = 'md' }: LogoProps) {
  // Determine sizing classes - responsive to mobile
  const sizeMap = {
    sm: 'w-[200px] h-12',
    md: 'w-[240px] sm:w-[380px] h-12 sm:h-20',
    lg: 'w-[560px] h-28',
  };

  return (
    <div className={`flex items-center select-none ${sizeMap[size]} ${className}`}>
      <picture className="w-full h-full flex items-center">
        <source srcSet="/images/logo.webp" type="image/webp" />
        <img
          src="/images/logo.png"
          alt="T2U - Time to Upgrade"
          width={380}
          height={80}
          className="w-full h-full object-contain object-left"
        />
      </picture>
    </div>
  );
}
