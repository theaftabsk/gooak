import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const inputBaseStyle: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 6,
  fontSize: '0.875rem',
  color: '#111827',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    return (
      <input
        type={type}
        ref={ref}
        style={{
          ...inputBaseStyle,
          ...(focused ? { borderColor: '#6366F1', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' } : {}),
          ...style,
        }}
        className={cn('placeholder:text-[#9CA3AF] disabled:cursor-not-allowed disabled:opacity-50', className)}
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
