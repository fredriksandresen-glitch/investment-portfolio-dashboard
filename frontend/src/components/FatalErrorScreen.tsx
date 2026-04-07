import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FatalErrorScreenProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onReset?: () => void;
}

export function FatalErrorScreen({ error, errorInfo, onReset }: FatalErrorScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReload = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleCopyDiagnostics = () => {
    const diagnostics = `
Error: ${error.message}

Stack:
${error.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(diagnostics).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                The application encountered an unexpected error
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="font-mono text-sm">
              {error.message || 'Unknown error occurred'}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={handleReload} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Application
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyDiagnostics}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Diagnostics'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Error Stack:</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                    {error.stack || 'No stack trace available'}
                  </pre>
                </div>

                {errorInfo?.componentStack && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Component Stack:</h4>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-4">
            If this problem persists, please contact support with the diagnostics above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
