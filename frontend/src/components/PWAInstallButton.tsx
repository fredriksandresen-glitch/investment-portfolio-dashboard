import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);
    };

    checkMobile();

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  // Don't show button if not mobile or already installed
  if (!isMobile || isInstalled) {
    return null;
  }

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  return (
    <>
      <div className="flex justify-center py-6">
        <Button
          onClick={handleInstallClick}
          size="lg"
          className="gap-2 shadow-lg"
          variant="default"
        >
          <Download className="h-5 w-5" />
          Legg til på Hjem-skjerm
        </Button>
      </div>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Installer App
            </DialogTitle>
            <DialogDescription className="text-left space-y-4 pt-4">
              {isIOS && (
                <div className="space-y-2">
                  <p className="font-medium">For iOS (Safari):</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Trykk på Del-knappen (firkant med pil opp) nederst i Safari</li>
                    <li>Rull ned og velg "Legg til på Hjem-skjerm"</li>
                    <li>Trykk "Legg til" øverst til høyre</li>
                  </ol>
                </div>
              )}
              
              {isAndroid && (
                <div className="space-y-2">
                  <p className="font-medium">For Android (Chrome):</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Trykk på meny-knappen (tre prikker) øverst til høyre</li>
                    <li>Velg "Legg til på startskjermen" eller "Installer app"</li>
                    <li>Bekreft installasjonen</li>
                  </ol>
                </div>
              )}
              
              {!isIOS && !isAndroid && (
                <div className="space-y-2">
                  <p className="font-medium">Installasjonsinstruksjoner:</p>
                  <p className="text-sm">
                    Bruk nettleserens meny for å legge til denne appen på hjemskjermen din.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
