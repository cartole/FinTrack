"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <p className="text-sm font-medium text-destructive mb-2">Algo salió mal</p>
          <p className="text-xs text-muted-foreground mb-4">
            {this.state.error?.message || "Error inesperado"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-xs text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
