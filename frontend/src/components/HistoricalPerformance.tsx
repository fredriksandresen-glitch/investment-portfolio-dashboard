import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio, useHistoricalData } from '@/hooks/useQueries';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HistoricalPerformanceProps {
  assetFilter: 'all' | 'crypto' | 'stocks';
}

// Helper function to format currency values
function formatCurrency(value: number): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return '$0';
  return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper function to format percentage
function formatPercentage(value: number): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return '0.0%';
  return `${Math.abs(numValue).toFixed(1)}%`;
}

export default function HistoricalPerformance({ assetFilter }: HistoricalPerformanceProps) {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();

  const filteredAssets = useMemo(() => {
    if (!portfolio) return [];
    if (assetFilter === 'all') return portfolio.assets;
    return portfolio.assets.filter(asset => asset.type === assetFilter);
  }, [portfolio, assetFilter]);

  // Get historical data for the first few assets (for demo)
  const btcData = useHistoricalData('BTC');
  const icpData = useHistoricalData('ICP');
  const spxData = useHistoricalData('SPX');

  const chartData = useMemo(() => {
    if (!btcData.data || !icpData.data || !spxData.data) return [];
    
    return btcData.data.map((btcPoint, index) => ({
      date: btcPoint.date,
      BTC: btcPoint.price,
      ICP: icpData.data?.[index]?.price || 0,
      SPX: spxData.data?.[index]?.price || 0,
    }));
  }, [btcData.data, icpData.data, spxData.data]);

  if (portfolioLoading || btcData.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Price Performance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Historical price movements for your portfolio assets
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="BTC" 
                  stroke="#f7931a" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ICP" 
                  stroke="#29abe2" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="SPX" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>24h Change</TableHead>
                <TableHead>7d Change</TableHead>
                <TableHead>30d Change</TableHead>
                <TableHead>30d High</TableHead>
                <TableHead>30d Low</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const currentPrice = asset.currentPrice;
                const high30d = currentPrice * 1.15;
                const low30d = currentPrice * 0.85;
                
                return (
                  <TableRow key={asset.symbol}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold">{asset.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(currentPrice)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={asset.priceChange24h >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {asset.priceChange24h >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercentage(asset.priceChange24h)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={asset.priceChange7d >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {asset.priceChange7d >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercentage(asset.priceChange7d)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={asset.priceChange30d >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {asset.priceChange30d >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercentage(asset.priceChange30d)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(high30d)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {formatCurrency(low30d)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Portfolio Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Performer (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">ICP</div>
            <p className="text-xs text-muted-foreground">+15.3% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Worst Performer (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">MSTR</div>
            <p className="text-xs text-muted-foreground">-3.8% this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Return (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+8.2%</div>
            <p className="text-xs text-muted-foreground">+$4,625 total gain</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
