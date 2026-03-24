import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { AppProviders } from '@/components/providers';

import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Tempo Query Commerce',
  description: 'Pay-per-query knowledge base with grounded answers, receipts, and source-aware pricing.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
