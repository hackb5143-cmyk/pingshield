import React from 'react';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const styles: Record<AlertVariant, { bg: string; border: string; icon: string; text: string }> = {
  info: { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'ℹ️', text: 'text-sky-800' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️', text: 'text-amber-800' },
  error: { bg: 'bg-red-50', border: 'border-red-200', icon: '❌', text: 'text-red-800' },
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: '✅', text: 'text-green-800' },
};

export default function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  onDismiss,
}: AlertProps) {
  const s = styles[variant];
  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-xl border p-4',
        s.bg,
        s.border,
        s.text,
        className,
      ].join(' ')}
    >
      <span className="flex-shrink-0 text-lg" aria-hidden="true">
        {s.icon}
      </span>
      <div className="flex-1 text-sm">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-lg opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
