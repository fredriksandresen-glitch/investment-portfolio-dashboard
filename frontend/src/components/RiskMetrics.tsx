import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, TrendingUp, PieChart } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

// Helper function to safely format numbers
function formatNumber(value: number, decimals: number = 1): string {
  try {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0';
    return numValue.toFixed(decimals);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '0';
  }
}

// Helper function to safely format percentage
function formatPercentage(value: number): string {
  try {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.0%';
    return `${numValue.toFixed(1)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0.0%';
  }
}

export default function RiskMetrics() {
  // Mock risk calculations (in real app, these would be calculated from historical data)
  // All values are properly typed as numbers
  const riskMetrics = {
    portfolioVolatility: Number(18.5), // Annualized volatility %
    sharpeRatio: Number(1.24), // Risk-adjusted return
    diversificationScore: Number(72), // Out of 100
    maxDrawdown: Number(-12.3), // Maximum historical loss %
    beta: Number(1.15), // Market correlation
    var95: Number(-8.2) // Value at Risk (95% confidence)
  };

  const assetRisks = [
    { asset: 'BTC', volatility: Number(65.2), allocation: Number(35.2), riskContribution: Number(22.9) },
    { asset: 'ICP', volatility: Number(72.1), allocation: Number(48.5), riskContribution: Number(35.0) },
    { asset: 'SPX', volatility: Number(58.7), allocation: Number(21.6), riskContribution: Number(12.7) },
    { asset: 'BMNR', volatility: Number(24.3), allocation: Number(15.1), riskContribution: Number(3.7) },
    { asset: 'MSTR', volatility: Number(45.8), allocation: Number(10.1), riskContribution: Number(4.6) },
    { asset: 'SBET', volatility: Number(42.1), allocation: Number(8.5), riskContribution: Number(3.8) }
  ];

  const riskFactors = [
    { factor: 'Market Risk', value: Number(75), max: Number(100) },
    { factor: 'Liquidity Risk', value: Number(25), max: Number(100) },
    { factor: 'Concentration Risk', value: Number(60), max: Number(100) },
    { factor: 'Volatility Risk', value: Number(80), max: Number(100) },
    { factor: 'Correlation Risk', value: Number(45), max: Number(100) },
    { factor: 'Regulatory Risk', value: Number(55), max: Number(100) }
  ];

  const getRiskLevel = (value: number) => {
    const numValue = Number(value);
    if (numValue < 30) return { level: 'Low', variant: 'default' as const, color: 'text-green-600' };
    if (numValue < 70) return { level: 'Medium', variant: 'secondary' as const, color: 'text-yellow-600' };
    return { level: 'High', variant: 'destructive' as const, color: 'text-red-600' };
  };

  const getSharpeRating = (ratio: number) => {
    const numRatio = Number(ratio);
    if (numRatio > 2) return { rating: 'Excellent', color: 'text-green-600' };
    if (numRatio > 1) return { rating: 'Good', color: 'text-blue-600' };
    if (numRatio > 0.5) return { rating: 'Fair', color: 'text-yellow-600' };
    return { rating: 'Poor', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      {/* Risk Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Volatility</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(riskMetrics.portfolioVolatility)}</div>
            <p className="text-xs text-muted-foreground">
              Annualized volatility
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(riskMetrics.sharpeRatio, 2)}</div>
            <p className={`text-xs ${getSharpeRating(riskMetrics.sharpeRatio).color}`}>
              {getSharpeRating(riskMetrics.sharpeRatio).rating}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversification</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(riskMetrics.diversificationScore, 0)}/100</div>
            <Progress value={riskMetrics.diversificationScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPercentage(riskMetrics.maxDrawdown)}</div>
            <p className="text-xs text-muted-foreground">
              Worst historical loss
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factor Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Factor Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive risk assessment across multiple dimensions
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskFactors}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Risk Level"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Asset Risk Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Risk Contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Volatility</TableHead>
                <TableHead>Risk Contribution</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetRisks.map((asset) => {
                const riskLevel = getRiskLevel(asset.volatility);
                return (
                  <TableRow key={asset.asset}>
                    <TableCell className="font-medium">{asset.asset}</TableCell>
                    <TableCell>{formatPercentage(asset.allocation)}</TableCell>
                    <TableCell>{formatPercentage(asset.volatility)}</TableCell>
                    <TableCell>{formatPercentage(asset.riskContribution)}</TableCell>
                    <TableCell>
                      <Badge variant={riskLevel.variant}>
                        {riskLevel.level}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Risk Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Beta (Market Correlation)</span>
              <span className="text-sm">{formatNumber(riskMetrics.beta, 2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Value at Risk (95%)</span>
              <span className="text-sm text-red-600">{formatPercentage(riskMetrics.var95)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Risk-Free Rate</span>
              <span className="text-sm">4.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  High Concentration Risk
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Consider diversifying beyond crypto assets
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Good Sharpe Ratio
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Risk-adjusted returns are performing well
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Moderate Volatility
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Portfolio volatility is within acceptable range
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
