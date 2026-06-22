import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'storefront' | 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Simple CSS class construction mapping base styles
  const baseClass = 'oaksol-btn';
  const variantClass = `oaksol-btn-${variant}`;
  const sizeClass = `oaksol-btn-${size}`;
  const loadingClass = loading ? 'oaksol-btn-loading' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="oaksol-spinner-inline" aria-hidden="true"></span>
      ) : null}
      <span className="oaksol-btn-content">{children}</span>
    </button>
  );
};
