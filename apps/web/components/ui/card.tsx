import * as React from 'react';

export function Card({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[2rem] border border-stone-200/80 bg-white/80 backdrop-blur-md p-8 md:p-10 shadow-card transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-6 flex flex-col space-y-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-2xl font-bold tracking-tight text-lernivox-forest ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`text-stone-600 leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  );
}

