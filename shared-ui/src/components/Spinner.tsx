import React from 'react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  message, 
  className = '', 
  ...props 
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} {...props}>
      <div 
        className={`animate-spin rounded-full border-t-emerald-500 border-gray-200 ${sizes[size]}`}
        role="status"
        aria-label="loading"
      />
      {message && <span className="text-sm text-gray-500 font-medium">{message}</span>}
    </div>
  );
};
