'use client';

import type { PropsWithChildren } from 'react';

import { NavItem } from '@/components/ui';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-bg text-ink wf-noise">
      <div className="pointer-events-none fixed inset-0 bg-grid bg-[size:32px_32px] opacity-20" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <aside className="border-b border-dashed border-line/80 bg-black/65 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="p-6">
            <div className="wf-card rounded-sm border border-white/10 bg-panelSoft/70 p-5">
              <p className="wf-label text-accentGreen">Tempo // AgentPay</p>
              <h1 className="mt-3 text-2xl font-semibold">Operator Console</h1>
              <p className="mt-3 text-sm text-muted">
                Budget-safe paid-agent operations with policy controls, provider fallback, and transparent cost telemetry.
              </p>
              <div className="mt-5 border-t border-dashed border-white/10 pt-4">
                <p className="wf-label">Mode</p>
                <p className="mt-2 text-sm text-ink">Dashboard + API adapter for AgentPay runtime</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 px-6 pb-6 md:flex-col">
            <NavItem href="/" label="Dashboard" />
            <NavItem href="/tasks/new" label="Task Runner" />
            <NavItem href="/providers" label="Provider Health" />
            <NavItem href="/policy" label="Policy Control" />
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
