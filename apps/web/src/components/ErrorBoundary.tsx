import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CartPilot ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-5 rounded-2xl border border-rose-500/25 bg-card/90 dark:bg-card-top/90 backdrop-blur-xl shadow-lg my-3 text-ink">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-display font-bold text-ink">
                {this.props.fallbackTitle || 'Something went wrong rendering this component'}
              </h4>
              <p className="text-xs text-mut mt-1">
                An unexpected interface error occurred. Your session and data are secure.
              </p>
              {this.state.error?.message && (
                <pre className="mt-2 p-2 rounded-lg bg-paper font-mono text-[11px] text-rose-700 dark:text-rose-300 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={this.handleReset}
                  className="px-3 py-1.5 rounded-lg bg-acc text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 rounded-lg border border-brd text-mut hover:text-ink text-xs font-medium transition-all cursor-pointer min-h-[36px]"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
