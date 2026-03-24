import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { AppProviders } from '@/components/providers';

import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'TempoAgentPay',
  description: 'Production-style demo dashboard for budget-safe paid-agent operations.',
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
