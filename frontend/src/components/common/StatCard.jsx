import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      accent: 'bg-blue-600',
    },
    navy: {
      bg: 'bg-slate-900 text-white',
      text: 'text-blue-400',
      border: 'border-slate-800',
      accent: 'bg-blue-500',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      accent: 'bg-amber-500',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      accent: 'bg-emerald-600',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      accent: 'bg-rose-600',
    },
  };

  const currentStyle = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${currentStyle.accent}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${currentStyle.bg} ${currentStyle.text} group-hover:scale-110 transition-transform duration-200`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        <span>{subtitle}</span>
        {trend && (
          <span className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
