import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary:
        'bg-lernivox-forest text-white hover:bg-lernivox-forest-light focus-visible:ring-lernivox-forest',
      secondary:
        'bg-lernivox-terracotta text-white hover:bg-orange-600 focus-visible:ring-lernivox-terracotta',
      outline:
        'border border-lernivox-stone bg-transparent text-lernivox-forest hover:bg-lernivox-cream-light focus-visible:ring-lernivox-forest',
      ghost:
        'bg-transparent text-lernivox-forest hover:bg-lernivox-cream-light',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-base',
      lg: 'h-13 px-7 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
