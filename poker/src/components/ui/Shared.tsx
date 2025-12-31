import React, { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}>(({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    primary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/90 shadow-sm',
    secondary: 'bg-zinc-800 text-zinc-50 hover:bg-zinc-800/80 shadow-sm',
    outline: 'border border-zinc-800 bg-transparent hover:bg-zinc-800 hover:text-zinc-50 text-zinc-300',
    ghost: 'hover:bg-zinc-800 hover:text-zinc-50 text-zinc-400',
    destructive: 'bg-red-900/50 text-red-200 hover:bg-red-900/70 border border-red-900'
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 py-2',
    lg: 'h-10 px-8'
  };
  return <button ref={ref} className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
});
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => {
  return <input ref={ref} className={`flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
});
Input.displayName = 'Input';

export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className = '', ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-400 ${className}`} {...props} />
));
Label.displayName = 'Label';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 shadow ${className}`} {...props}>
    {children}
  </div>
);
