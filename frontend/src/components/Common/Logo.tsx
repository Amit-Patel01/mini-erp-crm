import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
}) => {
  const dimensions = {
    sm: { img: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    md: { img: 'w-10 h-10', text: 'text-xl', sub: 'text-xs' },
    lg: { img: 'w-14 h-14', text: 'text-3xl', sub: 'text-sm' },
  }[size];

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const subColor = variant === 'light' ? 'text-indigo-400' : 'text-indigo-600';

  return (
    <div className="flex items-center gap-3 select-none">
      <img
        src="/logo.png"
        alt="Nexus ERP Logo"
        className={`${dimensions.img} rounded-xl object-cover shadow-md shadow-indigo-500/20`}
      />
      <div>
        <div className={`font-black tracking-tight ${textColor} ${dimensions.text} leading-none`}>
          Nexus ERP
        </div>
        {showSubtitle && (
          <div className={`font-bold tracking-wide ${subColor} ${dimensions.sub} mt-0.5`}>
            CRM & Operations
          </div>
        )}
      </div>
    </div>
  );
};
