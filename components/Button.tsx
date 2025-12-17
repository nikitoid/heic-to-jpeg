import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  as?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  ...props
}) => {
  const variants = {
    // Sliding gradient effect: Background is 200% wide, moves on hover.
    primary: `
      bg-gradient-to-r from-primary via-primaryDark to-primary 
      bg-[length:200%_auto] hover:bg-[position:100%_center] 
      text-white 
      shadow-[0_0_15px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--color-primary),0.6)]
      border border-primary/20 hover:border-primary/50
    `,
    secondary: `
      bg-surfaceHighlight hover:bg-zinc-700 
      text-zinc-200 
      border border-zinc-700 hover:border-zinc-500
      shadow-sm hover:shadow-md
    `,
    ghost: `
      hover:bg-white/10 
      text-zinc-300 hover:text-white
    `,
    danger: `
      bg-red-500/10 hover:bg-red-500/20 
      text-red-500 
      border border-red-500/20 hover:border-red-500/40
      hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-5 py-2.5 text-sm font-medium',
    lg: 'px-8 py-4 text-base font-semibold',
    icon: 'p-2.5',
  };

  return (
    <Component
      className={cn(
        'rounded-xl transition-all duration-500 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 backdrop-blur-sm select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};