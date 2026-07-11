import React from 'react';

/**
 * A highly-polished, responsive Card component following the "Urban Slate" design system.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card body content
 * @param {string} [props.title] - Top level header title
 * @param {string} [props.subtitle] - Muted subheader text
 * @param {React.ReactNode} [props.footer] - Footer actions or layout
 * @param {'default' | 'accent' | 'success' | 'warning'} [props.variant='default'] - Visual highlight color
 * @param {string} [props.className] - Additional utility overrides
 */
export const Card = ({ 
  children, 
  title, 
  subtitle, 
  footer, 
  variant = 'default', 
  className = '', 
  ...rest 
}) => {
  const variantStyles = {
    default: 'border border-[#D5DBDB] bg-white text-[#262626]',
    accent: 'border-l-4 border-l-brand-accent border border-[#D5DBDB] bg-white text-[#262626]',
    success: 'border-l-4 border-l-brand-success border border-[#D5DBDB] bg-white text-[#262626]',
    warning: 'border-l-4 border-l-brand-warning border border-[#D5DBDB] bg-white text-[#262626]',
  };

  return (
    <div 
      className={`
        w-full rounded-xl border border-[#D5DBDB] shadow-sm transition-all duration-200 
        flex flex-col overflow-hidden ${variantStyles[variant]} ${className}
      `}
      {...rest}
    >
      {/* Header Area */}
      {(title || subtitle) && (
        <div className="px-6 pt-5 pb-2 border-b border-[#D5DBDB] flex flex-col gap-0.5">
          {title && (
            <h3 className="text-sm font-bold tracking-tight text-[#262626] leading-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 px-6 py-5 text-xs text-[#262626] leading-relaxed">
        {children}
      </div>

      {/* Footer Area */}
      {footer && (
        <div className="px-6 py-3.5 bg-slate-50 border-t border-[#D5DBDB] flex items-center justify-between gap-3 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
