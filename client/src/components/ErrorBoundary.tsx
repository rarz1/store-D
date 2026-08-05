import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <span className="error-boundary__icon" role="img" aria-label="Error">⚠️</span>
            <h2 className="error-boundary__title">Algo salió mal</h2>
            <p className="error-boundary__text">Ocurrió un error inesperado. Probá de nuevo o volvé al inicio.</p>
            <div className="error-boundary__actions">
              <button className="btn-primary" onClick={this.handleRetry}>
                Reintentar
              </button>
              <button className="btn-back" onClick={() => { window.location.href = "/"; }}>
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
