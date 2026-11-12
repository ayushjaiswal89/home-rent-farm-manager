import React from 'react';

interface FarmerAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  avatarUrl?: string;
}

export function FarmerAvatar({ size = 'md', className = '', avatarUrl }: FarmerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  if (avatarUrl) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm ${sizeClasses[size]} ${className}`}
      >
        <img src={avatarUrl} alt="Farmer" className="w-full h-full object-cover" />
      </div>
    );
  }

  // High-fidelity stylized Indian Farmer Avatar with Pagdi/Turban matching the image
  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm bg-gradient-to-b from-amber-100 to-emerald-50 flex items-center justify-center ${sizeClasses[size]} ${className}`}
      title="रामलाल यादव (किसान)"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Sky / subtle background */}
        <circle cx="50" cy="50" r="50" fill="#E8F5E9" />

        {/* Kurta Collar */}
        <path d="M 20 100 L 25 75 Q 50 82 75 75 L 80 100 Z" fill="#F8FAFC" />
        <path d="M 45 76 L 55 76 L 52 95 L 48 95 Z" fill="#E2E8F0" />

        {/* Neck */}
        <path d="M 40 65 L 60 65 L 58 78 L 42 78 Z" fill="#E09F67" />

        {/* Face */}
        <ellipse cx="50" cy="52" rx="20" ry="22" fill="#ECA66F" />

        {/* Ears */}
        <ellipse cx="29" cy="53" rx="4" ry="6" fill="#D9935A" />
        <ellipse cx="71" cy="53" rx="4" ry="6" fill="#D9935A" />

        {/* Eyes */}
        <ellipse cx="43" cy="48" rx="2.5" ry="1.8" fill="#292524" />
        <ellipse cx="57" cy="48" rx="2.5" ry="1.8" fill="#292524" />
        <circle cx="44" cy="47.5" r="0.6" fill="#FFFFFF" />
        <circle cx="58" cy="47.5" r="0.6" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M 39 44 Q 44 42 48 44" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M 52 44 Q 56 42 61 44" stroke="#292524" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Nose */}
        <path d="M 50 48 L 48 57 L 53 57" stroke="#C97F48" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Mustache */}
        <path d="M 42 63 Q 47 60 50 62 Q 53 60 58 63 Q 54 66 50 64 Q 46 66 42 63 Z" fill="#292524" />

        {/* Smile */}
        <path d="M 46 66 Q 50 69 54 66" stroke="#873523" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Turban / Pagdi (White with saffron folds, iconic Indian farmer style) */}
        <path
          d="M 24 40 C 20 22, 35 12, 50 12 C 65 12, 80 22, 76 40 C 72 34, 62 30, 50 30 C 38 30, 28 34, 24 40 Z"
          fill="#FAF5FF"
        />
        {/* Turban folds */}
        <path d="M 22 36 Q 42 20 78 35" stroke="#FFFFFF" strokeWidth="6" fill="none" />
        <path d="M 24 32 Q 50 16 76 30" stroke="#F97316" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 28 26 Q 50 14 72 26" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 33 20 Q 50 13 67 20" stroke="#F97316" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Pagdi crown knot */}
        <circle cx="50" cy="15" r="6" fill="#F97316" />
        <circle cx="50" cy="15" r="4" fill="#FFFFFF" />

        {/* Tilak */}
        <path d="M 49 35 L 51 35 L 50 42 Z" fill="#DC2626" />
      </svg>
    </div>
  );
}
