'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode } from 'react';

import clsx from 'clsx';

export function PageShell({
  title,
  eyebrow,
  actions,
  children,
}: PropsWithChildren<{ title: string; eyebrow: string; actions?: ReactNode }>) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-dashed border-line/80 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="wf-label text-accentGreen">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Card({
  title,
  kicker,
  children,
  className,
}: PropsWithChildren<{ title?: string; kicker?: string; className?: string }>) {
  return (
    <section className={clsx('wf-card rounded-sm border border-white/10 bg-panel/95 p-5 shadow-glow', className)}>
      {(title || kicker) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {kicker ? <p className="wf-label">{kicker}</p> : null}
            {title ? <h2 className="mt-2 text-lg font-medium text-ink">{title}</h2> : null}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  tone = 'blue',
  helper,
}: {
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'amber';
  helper?: string;
}) {
  const toneClass =
    tone === 'green'
      ? 'border-accentGreen/30'
      : tone === 'amber'
        ? 'border-accentAmber/30'
        : 'border-accentBlue/30';
  const toneGlow =
    tone === 'green'
      ? 'text-accentGreen'
      : tone === 'amber'
        ? 'text-accentAmber'
        : 'text-accentBlue';

  return (
    <Card className={clsx('border bg-black/90', toneClass)}>
      <p className="wf-label">{label}</p>
      <p className={clsx('mt-4 text-3xl font-semibold', toneGlow)}>{value}</p>
      {helper ? <p className="mt-3 text-sm text-muted">{helper}</p> : null}
    </Card>
  );
}

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        'rounded-sm border px-4 py-3 text-sm font-medium transition',
        active
          ? 'border-white bg-white text-black'
          : 'border-white/10 text-muted hover:border-white/25 hover:bg-white/5 hover:text-ink'
      )}
    >
      {label}
    </Link>
  );
}

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const className =
    tone === 'success'
      ? 'border-accentGreen/40 bg-accentGreen/10 text-accentGreen'
      : tone === 'warning'
        ? 'border-accentAmber/40 bg-accentAmber/10 text-accentAmber'
        : tone === 'danger'
          ? 'border-accentRed/40 bg-accentRed/10 text-accentRed'
          : 'border-line bg-white/5 text-muted';

  return <span className={`inline-flex rounded-sm border px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${className}`}>{label}</span>;
}

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-line bg-panelSoft/40 p-6 text-sm text-muted">
      {label}
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-panelSoft/40 p-6 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{detail}</p>
    </div>
  );
}

export function ErrorState({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-accentRed/30 bg-accentRed/10 p-5">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-sm border border-accentRed/40 px-4 py-2 text-sm font-medium text-ink transition hover:bg-accentRed/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button
      {...props}
      className={clsx(
        'rounded-sm border px-4 py-2.5 text-sm font-medium uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary'
          ? 'border-white bg-white text-black hover:bg-transparent hover:text-white'
          : 'border-white/15 bg-white/[0.03] text-ink hover:border-white/30 hover:bg-white/[0.06]',
        props.className
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: PropsWithChildren<{ label: string; htmlFor: string; hint?: string }>) {
  return (
    <label htmlFor={htmlFor} className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function inputClassName() {
  return 'w-full rounded-sm border border-white/15 bg-panelSoft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-white/40';
}
