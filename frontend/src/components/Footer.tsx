import { Heart } from 'lucide-react';
import PWAInstallButton from './PWAInstallButton';

export default function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Disclaimer */}
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Important Disclaimer
            </h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
              This is for informational purposes only; not financial advice. Data from third-party APIs may have delays.
              Cryptocurrency and stock investments involve significant risk, and you should do your own research 
              before making investment decisions. Past performance does not guarantee future results.
            </p>
          </div>

          {/* Data Sources */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Data sources: CoinGecko (cryptocurrency prices), Yahoo Finance (stock prices), ExchangeRate-API (currency conversion)
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleString('en-US')}
            </p>
          </div>

          {/* PWA Install Button - Only visible on mobile */}
          <PWAInstallButton />

          {/* Copyright */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground flex items-center justify-center space-x-1">
              <span>© 2025. Built with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>using</span>
              <a 
                href="https://caffeine.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
