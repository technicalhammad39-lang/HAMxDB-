import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <h1 className="text-red-500 text-2xl font-bold mb-4 font-mono uppercase tracking-tighter">System Failure</h1>
            <p className="text-white/60 mb-6 font-mono text-sm">
              A critical error has occurred within the HAMxDB protocol. The interface has been locked for security.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-red-400 transition-colors"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
