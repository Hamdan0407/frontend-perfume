import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle chunk loading errors automatically
    const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                        error?.message?.includes('Loading chunk') ||
                        error?.message?.includes('chunk loading failed');
                        
    if (isChunkError) {
      const pageHasAlreadyBeenForceRefreshed = JSON.parse(
        window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
      );
      
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-8">
              We've encountered a runtime error. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Go Home
              </button>
            </div>
            <div className="mt-8 p-4 bg-slate-100 rounded-lg text-left overflow-auto max-h-60">
              <p className="text-sm font-bold text-red-800 mb-2">Error Detail:</p>
              <p className="text-xs font-mono text-red-700 break-all">{this.state.error?.toString()}</p>
              {this.state.error?.stack && (
                <pre className="mt-4 text-[10px] font-mono text-slate-500 overflow-x-auto">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
