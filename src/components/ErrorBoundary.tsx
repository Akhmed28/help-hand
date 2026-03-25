import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Произошла ошибка при загрузке страницы.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] editor render failed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
          <div className="max-w-lg w-full rounded-2xl border border-border bg-card p-6 shadow-2xl text-center">
            <h1 className="text-xl font-semibold mb-3">Не удалось открыть редактор</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Вместо пустого экрана показываем ошибку. Обновите страницу или вернитесь на главную и попробуйте снова.
            </p>
            <div className="rounded-xl bg-secondary px-4 py-3 text-left text-xs text-muted-foreground break-words">
              {this.state.message}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
