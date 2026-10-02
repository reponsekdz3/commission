// Modern UI Enhancements for Web
// Provides interactive components, animations, and responsive patterns

import React from 'react';

// ===== INTERACTIVE PATTERNS =====

export const InteractiveCard = ({ 
  children, 
  onClick, 
  className = '',
  interactive = true 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  interactive?: boolean;
}) => (
  <div
    onClick={onClick}
    className={`
      group relative overflow-hidden rounded-2xl border border-[var(--color-border)]
      bg-[var(--color-surface-1)] shadow-[var(--shadow-1)]
      transition-all duration-300 ease-out
      ${interactive ? 'cursor-pointer hover:shadow-[var(--shadow-2)] hover:border-[var(--color-border-strong)] hover:-translate-y-1' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

export const ModernButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
  [key: string]: any;
}) => {
  const variants = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)] shadow-[var(--shadow-glow-primary)]',
    secondary: 'bg-[var(--color-surface-2)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-3)]',
    ghost: 'bg-transparent text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-1)]',
    danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-bold
        transition-all duration-200 ease-out active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={loading}
      {...props}
    >
      {loading && <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

export const GlassCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`
      rounded-2xl border border-[rgba(255,255,255,0.18)]
      bg-[var(--color-glass)] backdrop-blur-xl
      shadow-lg p-6
      ${className}
    `}
  >
    {children}
  </div>
);

// ===== ANIMATION UTILITIES =====

export const AnimatedCounter = ({
  value,
  duration = 2000,
}: {
  value: number;
  duration?: number;
}) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

export const FadeInUp = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <div
    className={`animate-[fadeInUp_0.6s_ease-out_forwards] ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// ===== RESPONSIVE GRID SYSTEMS =====

export const ResponsiveGrid = ({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'gap-4',
  className = '',
}: {
  children: React.ReactNode;
  cols?: { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string;
  className?: string;
}) => (
  <div
    className={`
      grid
      ${cols.sm ? `sm:grid-cols-${cols.sm}` : 'grid-cols-1'}
      ${cols.md ? `md:grid-cols-${cols.md}` : 'md:grid-cols-2'}
      ${cols.lg ? `lg:grid-cols-${cols.lg}` : 'lg:grid-cols-3'}
      ${cols.xl ? `xl:grid-cols-${cols.xl}` : 'xl:grid-cols-4'}
      ${gap} ${className}
    `}
  >
    {children}
  </div>
);

// ===== INTERACTIVE ELEMENTS =====

export const HoverReveal = ({
  children,
  revealContent,
  className = '',
}: {
  children: React.ReactNode;
  revealContent: React.ReactNode;
  className?: string;
}) => (
  <div className={`group relative ${className}`}>
    <div className="group-hover:opacity-0 transition-opacity duration-300">
      {children}
    </div>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      {revealContent}
    </div>
  </div>
);

export const SkeletonLoader = ({
  count = 3,
  className = '',
}: {
  count?: number;
  className?: string;
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`
          h-12 rounded-lg bg-gradient-to-r from-[var(--color-surface-2)]
          via-[var(--color-surface-1)] to-[var(--color-surface-2)]
          animate-pulse ${className}
        `}
      />
    ))}
  </>
);

// ===== RESPONSIVE UTILITIES =====

export const ResponsiveContainer = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

export const MobileOnly = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`block md:hidden ${className}`}>
    {children}
  </div>
);

export const DesktopOnly = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`hidden md:block ${className}`}>
    {children}
  </div>
);

// ===== MODERN BADGES & PILLS =====

export const ModernBadge = ({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) => {
  const variants = {
    primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-deep)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-3 py-1 rounded-full
        text-xs font-bold uppercase tracking-wider
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
};

// ===== INTERACTIVE TABS =====

export const ModernTabs = ({
  tabs,
  defaultTab = 0,
  onChange,
  className = '',
}: {
  tabs: Array<{ label: string; content: React.ReactNode }>;
  defaultTab?: number;
  onChange?: (index: number) => void;
  className?: string;
}) => {
  const [active, setActive] = React.useState(defaultTab);

  const handleChange = (index: number) => {
    setActive(index);
    onChange?.(index);
  };

  return (
    <div className={className}>
      <div className="flex gap-2 border-b border-[var(--color-border)] overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => handleChange(i)}
            className={`
              px-4 py-3 font-bold text-sm whitespace-nowrap
              border-b-2 transition-all duration-200
              ${
                active === i
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 animate-[fadeIn_0.3s_ease-out]">
        {tabs[active].content}
      </div>
    </div>
  );
};

// ===== TOAST NOTIFICATIONS =====

export const Toast = ({
  message,
  type = 'info',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: 'bg-[var(--color-success)] text-white',
    error: 'bg-[var(--color-danger)] text-white',
    info: 'bg-[var(--color-info)] text-white',
    warning: 'bg-[var(--color-warning)] text-white',
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 px-6 py-3 rounded-lg font-bold
        shadow-lg animate-[slideUp_0.3s_ease-out]
        ${typeStyles[type]}
      `}
    >
      {message}
    </div>
  );
};

// ===== MODERN FORM ELEMENTS =====

export const ModernInput = ({
  label,
  error,
  icon,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-bold text-[var(--color-fg-soft)] mb-2">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]">
          {icon}
        </div>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)]
          bg-[var(--color-surface-1)] text-[var(--color-fg)]
          focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-focus)]
          transition-all duration-200
          ${icon ? 'pl-10' : ''}
          ${error ? 'border-[var(--color-danger)]' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
    {error && (
      <p className="text-xs text-[var(--color-danger)] mt-1">{error}</p>
    )}
  </div>
);

// ===== LOADING STATES =====

export const LoadingSpinner = ({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`
        border-2 border-[var(--color-border)]
        border-t-[var(--color-primary)] rounded-full
        animate-spin ${sizes[size]} ${className}
      `}
    />
  );
};

// ===== EMPTY STATES =====

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="text-5xl mb-4 opacity-50">{icon}</div>
    <h3 className="text-xl font-bold text-[var(--color-fg)] mb-2">{title}</h3>
    <p className="text-[var(--color-fg-muted)] max-w-sm mb-6">{description}</p>
    {action}
  </div>
);
