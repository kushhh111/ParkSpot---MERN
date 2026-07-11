import React from 'react';

/**
 * Reusable Button component designed for high-trust and consistent UI action buttons.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Label or content
 * @param {'primary' | 'secondary' | 'danger' | 'success'} [props.variant='primary'] - Variant theme
 * @param {boolean} [props.loading=false] - Show spinner
 * @param {boolean} [props.disabled=false] - Disables interaction
 * @param {string} [props.className] - Class overrides
 */
export const Button = ({ 
  children, 
  variant = 'primary', 
  loading = false, 
  disabled = false, 
  className = '', 
  ...rest 
}) => {
  const baseStyle = 'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variantStyles = {
    primary: 'bg-[#EAB308] text-[#262626] shadow-sm hover:bg-[#ca8a04] focus:ring-[#eab308]',
    secondary: 'border border-[#D5DBDB] bg-white text-[#262626] hover:bg-slate-50 focus:ring-slate-400',
    danger: 'bg-red-650 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
