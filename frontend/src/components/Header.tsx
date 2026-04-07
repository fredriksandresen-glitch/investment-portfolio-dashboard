import { Moon, Sun, TrendingUp, Filter, Download, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLivePrices, useExchangeRate } from '@/hooks/useQueries';

interface HeaderProps {
  assetFilter: 'all' | 'crypto' | 'stocks';
  onFilterChange: (filter: 'all' | 'crypto' | 'stocks') => void;
}

export default function Header({ assetFilter, onFilterChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { data: livePrices, isLoading: pricesLoading, isError: pricesError } = useLivePrices();
  const { data: exchangeRate, isLoading: rateLoading, isError: rateError } = useExchangeRate();

  const handleExportPDF = () => {
    console.log('Exporting PDF...');
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV...');
  };

  // Count successful API fetches
  const successfulPrices = livePrices ? Object.values(livePrices).filter(price => price.status === 'success').length : 0;
  const totalPrices = livePrices ? Object.keys(livePrices).length : 0;
  const fallbackPrices = livePrices ? Object.values(livePrices).filter(price => price.status === 'fallback').length : 0;
  
  const hasSuccessfulFetch = successfulPrices > 0;
  const isExchangeRateLive = exchangeRate?.source === 'live';
  const isFullyLive = hasSuccessfulFetch && isExchangeRateLive;
  const isPartiallyLive = hasSuccessfulFetch || isExchangeRateLive;

  const getStatusBadge = () => {
    if (pricesLoading || rateLoading) {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
          Loading...
        </Badge>
      );
    }

    if (isFullyLive) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-green-600 border-green-600 cursor-help">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">✅ All APIs working</p>
                <p className="text-xs">Prices: {successfulPrices}/{totalPrices} live</p>
                <p className="text-xs">Exchange rate: Live</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (isPartiallyLive) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-amber-600 border-amber-600 cursor-help">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-2 animate-pulse" />
                Partial Live
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">⚠️ Some APIs unavailable</p>
                <p className="text-xs">Prices: {successfulPrices}/{totalPrices} live, {fallbackPrices} fallback</p>
                <p className="text-xs">Exchange rate: {isExchangeRateLive ? 'Live' : 'Fallback'}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-red-600 border-red-600 cursor-help">
              <AlertCircle className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">❌ APIs unavailable</p>
              <p className="text-xs">Using default prices</p>
              <p className="text-xs">Check console for details</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Investment Portfolio</h1>
                <p className="text-sm text-muted-foreground">Professional Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={assetFilter} onValueChange={onFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportPDF}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {getStatusBadge()}
          </div>
        </div>
      </div>
    </header>
  );
}
