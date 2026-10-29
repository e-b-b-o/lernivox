import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      primary:
        'bg-lernivox-forest text-white hover:bg-lernivox-forest-light shadow-sm hover:shadow-card focus-visible:ring-lernivox-forest',
      secondary:
        'bg-lernivox-terracotta text-white hover:bg-lernivox-terracotta-hover shadow-sm hover:shadow-glow-terracotta focus-visible:ring-lernivox-terracotta',
      outline:
        'border border-stone-300/90 bg-white/80 backdrop-blur-sm text-lernivox-forest hover:bg-white hover:border-stone-400 hover:shadow-subtle focus-visible:ring-lernivox-forest',
      ghost:
        'bg-transparent text-lernivox-forest hover:bg-stone-200/50 focus-visible:ring-lernivox-forest',
    };

    const sizes = {
      sm: 'h-10 px-5 text-sm',
      md: 'h-12 px-7 py-3 text-base font-semibold',
      lg: 'h-14 px-8 py-3.5 text-lg font-semibold',
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

