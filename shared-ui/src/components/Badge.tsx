import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    success: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
    warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    danger: 'bg-red-100 text-red-800 hover:bg-red-200',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};
