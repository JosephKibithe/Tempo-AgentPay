'use client';

import { Component, type PropsWithChildren, type ReactNode } from 'react';

import { ErrorState } from '@/components/ui';

interface Props {
  fallbackTitle: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren<Props>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return <ErrorState title={this.props.fallbackTitle} detail="This widget failed to render." />;
    }

    return this.props.children;
  }
}
