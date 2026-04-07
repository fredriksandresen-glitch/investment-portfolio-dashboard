import React from 'react';
import { AlertTriangle, X, Copy, RefreshCw } from 'lucide-react';
import { useGlobalErrorState } from './GlobalErrorState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function GlobalErrorBanner() {
  const { error, clearError } = useGlobalErrorState();
  const [copied, setCopied] = React.useState(false);

  if (!error) return null;

  const handleCopy = () => {
    const diagnostics = `
Error: ${error.message}
Type: ${error.type}
Timestamp: ${new Date(error.timestamp).toISOString()}
Stack: ${error.stack || 'No stack trace'}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(diagnostics).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="shadow-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-1">Application Error</p>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              <Copy className="h-3 w-3" />
              {copied && <span className="ml-1 text-xs">Copied</span>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReload}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearError}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
