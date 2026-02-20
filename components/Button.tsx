import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  isLoading,
  className = '',
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-[#10221a] hover:shadow-lg hover:shadow-primary/20 hover:brightness-105",
    secondary: "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary hover:border-primary/30 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-white border border-slate-200 text-slate-600 hover:text-red-500 hover:bg-red-50"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? (
        <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
      ) : (
        <>
          {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
