'use client';

import { Button } from '@/components/ui';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accentRed">Unhandled Error</p>
          <h2 className="text-3xl font-semibold">Tempo Query Commerce hit a rendering fault.</h2>
          <p className="text-sm text-muted">Reset the page to recover from the last client-side failure.</p>
          <Button type="button" onClick={() => reset()}>
            Reset
          </Button>
        </div>
      </body>
    </html>
  );
}
