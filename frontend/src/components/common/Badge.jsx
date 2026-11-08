import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantClasses = {
    // Roles
    admin: 'bg-purple-100 text-purple-800 border border-purple-200',
    lawyer: 'bg-blue-100 text-blue-800 border border-blue-200',
    client: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    clerk: 'bg-amber-100 text-amber-800 border border-amber-200',

    // Case Statuses
    filed: 'bg-sky-50 text-sky-700 border border-sky-200',
    'under-review': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    'hearing-in-progress': 'bg-blue-600 text-white font-medium shadow-sm',
    'judgment-reserved': 'bg-amber-100 text-amber-800 border border-amber-300',
    closed: 'bg-slate-100 text-slate-700 border border-slate-300',
    appealed: 'bg-rose-100 text-rose-800 border border-rose-200',

    // Priorities
    low: 'bg-slate-100 text-slate-600 border border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border border-blue-200',
    high: 'bg-orange-100 text-orange-800 border border-orange-200',
    urgent: 'bg-red-600 text-white shadow-sm font-bold animate-pulse',

    // Generic
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const key = variant.toLowerCase().replace(/\s+/g, '-');
  const styling = variantClasses[key] || variantClasses.default;

  return (
    <span className={`inline-flex items-center rounded-full tracking-wide uppercase ${sizeClasses[size]} ${styling}`}>
      {children}
    </span>
  );
};

export default Badge;
