'use client';

import type { PropsWithChildren } from 'react';

import { NavItem } from '@/components/ui';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-bg text-ink wf-noise">
      <div className="wireframe-grid" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <aside className="border-b border-dashed border-white/10 bg-black/70 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="p-6">
            <div className="wireframe-card rounded-sm p-5">
              <p className="wf-label text-accentGreen">Tempo // Query Commerce</p>
              <h1 className="mt-3 text-2xl font-semibold">No API Keys. No Accounts.</h1>
              <p className="mt-3 text-sm text-muted">
                Sell grounded answers from curated source collections, meter each query, and expose receipts with citation-level auditability.
              </p>
              <div className="mt-5 border-t border-dashed border-white/10 pt-4">
                <p className="wf-label">Mode</p>
                <p className="mt-2 text-sm text-ink">Public pay-per-query API with Tempo-native receipts</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 px-6 pb-6 md:flex-col">
            <NavItem href="/" label="Dashboard" />
            <NavItem href="/queries/new" label="Ask KB" />
            <NavItem href="/sources" label="Sources" />
            <NavItem href="/providers" label="Retrieval Health" />
            <NavItem href="/policy" label="Pricing Policy" />
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
