import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-center my-4">
                    <h2 className="text-red-500 font-bold mb-2">Something went wrong</h2>
                    <p className="text-red-400 text-sm">{this.state.error?.message}</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
