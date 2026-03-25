import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { AppProviders } from '@/components/providers';

import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Tempo Query Commerce',
  description: 'Machine-buyable knowledge with grounded answers, Tempo receipts, and no API keys or accounts required.',
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
