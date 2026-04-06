'use client';

import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

export const appFieldClassName =
  'w-full rounded-[7px] border-[1.5px] border-[#e2e8f0] bg-[#f8fafc] px-3 py-[9px] text-[13px] text-[#0f172a] outline-none transition-colors focus:border-[#2563eb]';

const toolbarButtonClassName =
  'inline-flex items-center gap-[6px] rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[6px] text-[12px] font-semibold text-[#64748b] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]';

const primaryButtonClassName =
  'inline-flex items-center gap-[6px] rounded-[6px] bg-[#2563eb] px-3 py-[6px] text-[12px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]';

function toneClassName(tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral') {
  if (tone === 'success') return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
  if (tone === 'warning') return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]';
  if (tone === 'danger') return 'border-[#fecaca] bg-[#fef2f2] text-[#dc2626]';
  if (tone === 'neutral') return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  return 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]';
}

export function AppPageShell({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('-mx-4 -my-6 md:-mx-6 lg:-mx-8 lg:-my-8', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppPageToolbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 flex min-h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
      <strong className="text-[15px] font-bold text-[#0f172a]">{title}</strong>
      {actions ? <div className="ml-auto flex flex-wrap items-center gap-2 py-3">{actions}</div> : null}
    </div>
  );
}

export function AppPageContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-[#f1f5f9] px-6 py-6', className)} {...props}>
      {children}
    </div>
  );
}

export function AppPageIntro({
  title,
  subtitle,
}: {
  title: string;
  subtitle: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="text-[26px] font-extrabold tracking-[-0.03em] text-[#0f172a]">
        {title}
      </div>
      <div className="mt-2 text-[12px] text-[#64748b]">{subtitle}</div>
    </div>
  );
}

export function AppSurface({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[12px] border border-[#e2e8f0] bg-white', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center">
      <div className="text-[28px] leading-none">{icon}</div>
      <div className="mt-3 text-[18px] font-bold text-[#0f172a]">{title}</div>
      {description ? <div className="mt-1 text-[13px] text-[#64748b]">{description}</div> : null}
    </div>
  );
}

export function AppToolbarButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(toolbarButtonClassName, className)} {...props}>
      {children}
    </button>
  );
}

export function AppPrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(primaryButtonClassName, className)} {...props}>
      {children}
    </button>
  );
}

export function AppFormLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[11px] font-bold uppercase tracking-[.06em] text-[#64748b]">
      {children}
      {required ? <span className="ml-0.5 text-[#dc2626]">*</span> : null}
    </label>
  );
}

export function AppInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(appFieldClassName, className)} {...props} />;
}

export function AppSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(appFieldClassName, className)} {...props} />;
}

export function AppTextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(appFieldClassName, className)} {...props} />;
}

export function AppAlert({
  children,
  tone = 'info',
  className,
}: {
  children: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[8px] border px-3 py-2 text-[12px] font-medium',
        toneClassName(tone),
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-[10px] py-[4px] text-[11px] font-bold',
        className,
      )}
    >
      {children}
    </span>
  );
}
