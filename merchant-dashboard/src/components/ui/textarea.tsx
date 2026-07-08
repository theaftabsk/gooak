import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const textareaBaseStyle: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  minHeight: 80,
  padding: '8px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 6,
  fontSize: '0.875rem',
  color: '#111827',
  background: '#ffffff',
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    return (
      <textarea
        ref={ref}
        style={{
          ...textareaBaseStyle,
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
Textarea.displayName = 'Textarea';

export { Textarea };
