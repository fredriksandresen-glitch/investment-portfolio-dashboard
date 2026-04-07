import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePortfolio } from '@/hooks/useQueries';

interface ScenarioConfig {
  name: string;
  description: string;
  defaultGrowthRate: number;
  color: string;
}

const scenarios: ScenarioConfig[] = [
  {
    name: 'Base Case',
    description: 'Conservative growth based on historical averages',
    defaultGrowthRate: 8,
    color: 'blue'
  },
  {
    name: 'Bull Case',
    description: 'Optimistic growth in favorable market conditions',
    defaultGrowthRate: 25,
    color: 'green'
  },
  {
    name: 'Bear Case',
    description: 'Conservative scenario during market downturns',
    defaultGrowthRate: -15,
    color: 'red'
  }
];

// Helper function to format currency values
function formatCurrency(value: number, currency: 'USD' | 'NOK' = 'USD'): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return currency === 'USD' ? '$0' : 'kr 0';
  
  if (currency === 'USD') {
    return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else {
    return `kr ${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

// Helper function to format percentage
function formatPercentage(value: number): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return '0.0%';
  return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(1)}%`;
}

export default function ScenarioAnalysis() {
  const { data: portfolio } = usePortfolio();
  const [growthRates, setGrowthRates] = useState<Record<string, number>>({
    'Base Case': 8,
    'Bull Case': 25,
    'Bear Case': -15
  });

  const currentPortfolioValue = portfolio?.totalValueUSD || 0;

  const calculateProjectedValue = (growthRate: number, months: number): number => {
    const monthlyRate = growthRate / 100 / 12;
    const projectedValue = currentPortfolioValue * Math.pow(1 + monthlyRate, months);
    return Number(projectedValue.toFixed(2));
  };

  const timeframes = [3, 6, 12, 24, 36];

  if (!portfolio) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust growth rate assumptions to see projected portfolio values under different market conditions.
            Current portfolio value: {formatCurrency(currentPortfolioValue, 'USD')}
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="Base Case" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {scenarios.map((scenario) => (
            <TabsTrigger key={scenario.name} value={scenario.name}>
              {scenario.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {scenarios.map((scenario) => (
          <TabsContent key={scenario.name} value={scenario.name} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {scenario.name}
                  <Badge 
                    variant={
                      growthRates[scenario.name] > 0 ? "default" : 
                      growthRates[scenario.name] < 0 ? "destructive" : "secondary"
                    }
                  >
                    {growthRates[scenario.name] > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                    {growthRates[scenario.name] < 0 && <TrendingDown className="h-3 w-3 mr-1" />}
                    {growthRates[scenario.name] === 0 && <Minus className="h-3 w-3 mr-1" />}
                    {growthRates[scenario.name]}% Annual
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Growth Rate Slider */}
                <div className="space-y-2">
                  <Label>Annual Growth Rate: {growthRates[scenario.name]}%</Label>
                  <Slider
                    value={[growthRates[scenario.name]]}
                    onValueChange={(value) => 
                      setGrowthRates(prev => ({ ...prev, [scenario.name]: value[0] }))
                    }
                    max={50}
                    min={-30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-30%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>

                {/* Projections Table */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Projected Portfolio Values</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timeframe</TableHead>
                        <TableHead>Projected Value (USD)</TableHead>
                        <TableHead>Projected Value (NOK)</TableHead>
                        <TableHead>Total Return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeframes.map((months) => {
                        const projectedValue = calculateProjectedValue(growthRates[scenario.name], months);
                        const totalReturn = currentPortfolioValue > 0 ? 
                          ((projectedValue - currentPortfolioValue) / currentPortfolioValue * 100) : 0;
                        
                        return (
                          <TableRow key={months}>
                            <TableCell className="font-medium">
                              {months} month{months > 1 ? 's' : ''}
                            </TableCell>
                            <TableCell>{formatCurrency(projectedValue, 'USD')}</TableCell>
                            <TableCell>{formatCurrency(projectedValue * 9.95, 'NOK')}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={totalReturn >= 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {formatPercentage(totalReturn)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Asset Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Asset Projections (12 months)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>Projected Value</TableHead>
                        <TableHead>Projected Return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.assets.map((asset) => {
                        const currentValue = asset.value;
                        const projectedValue = currentValue * Math.pow(1 + growthRates[scenario.name] / 100 / 12, 12);
                        const assetReturn = currentValue > 0 ? 
                          ((projectedValue - currentValue) / currentValue * 100) : 0;
                        
                        return (
                          <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell>{formatCurrency(currentValue, 'USD')}</TableCell>
                            <TableCell>{formatCurrency(projectedValue, 'USD')}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={assetReturn >= 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {formatPercentage(assetReturn)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Scenario Explanation */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Scenario Assumptions</h4>
                  <p className="text-sm text-muted-foreground">
                    {scenario.name === 'Base Case' && 
                      'Based on historical market performance and conservative growth estimates. Assumes steady economic conditions with moderate inflation and stable interest rates.'
                    }
                    {scenario.name === 'Bull Case' && 
                      'Assumes favorable market conditions with strong economic growth, technological innovation driving asset prices, and positive investor sentiment.'
                    }
                    {scenario.name === 'Bear Case' && 
                      'Conservative scenario accounting for potential market corrections, economic uncertainty, or adverse regulatory changes affecting asset values.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
