import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="flex flex-col space-y-1.5 pb-4">
          {title && <h3 className="font-semibold text-lg leading-none tracking-tight text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
