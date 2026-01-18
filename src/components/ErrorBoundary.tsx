import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4 text-destructive">
              Something went wrong.
            </h1>
            <p className="text-muted-foreground mb-6">
              There was an error rendering this part of the application.
            </p>
            {this.state.error && (
                <pre className="mb-6 p-4 bg-muted text-destructive-foreground rounded-md text-left text-sm overflow-auto">
                    {this.state.error.name}: {this.state.error.message}
                </pre>
            )}
            <Button onClick={() => window.location.assign('/explore')}>
              Back to Explore
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
