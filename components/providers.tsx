'use client';

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { SWRConfig } from 'swr';

type ToastTone = 'success' | 'error';

interface ToastItem {
  id: string;
  title: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (title: string, tone: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-glow ${
            toast.tone === 'success'
              ? 'border-accentGreen/40 bg-accentGreen/10 text-ink'
              : 'border-accentRed/40 bg-accentRed/10 text-ink'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium">{toast.title}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-xs uppercase tracking-[0.2em] text-muted transition hover:text-ink"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const context = useMemo<ToastContextValue>(
    () => ({
      pushToast(title, tone) {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, title, tone }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
      },
    }),
    []
  );

  return (
    <SWRConfig value={{}}>
      <ToastContext.Provider value={context}>
        {children}
        <ToastViewport
          toasts={toasts}
          onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
        />
      </ToastContext.Provider>
    </SWRConfig>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside AppProviders');
  }

  return context;
}
