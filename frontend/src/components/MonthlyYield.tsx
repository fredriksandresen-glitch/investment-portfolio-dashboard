import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Coins, TrendingUp, DollarSign } from 'lucide-react';
import { usePortfolio } from '@/hooks/useQueries';

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

// Helper function to format numbers
function formatNumber(value: number, decimals: number = 1): string {
  const numValue = Number(value);
  if (isNaN(numValue)) return '0';
  return numValue.toFixed(decimals);
}

export default function MonthlyYield() {
  const { data: portfolio } = usePortfolio();
  
  // Get ICP asset data
  const icpAsset = portfolio?.assets.find(asset => asset.id === 'ICP');
  
  // Use the actual staked amount from the asset (8,500 staked, 7,000 liquid)
  const icpStaked = icpAsset?.stakedAmount || 8500;
  const icpLiquid = icpAsset?.unstakedAmount || 7000;
  const icpTotal = icpAsset?.quantity || 15500;
  const annualRate = icpAsset?.annualYield || 14.2;
  const monthlyRate = annualRate / 12;
  const currentIcpPrice = icpAsset?.currentPrice || 4.36;

  // Get live exchange rate from portfolio
  const exchangeRate = portfolio?.exchangeRate.rate || 9.96;

  // ICP price slider state (default to current price)
  const [icpPriceSlider, setIcpPriceSlider] = useState<number>(currentIcpPrice);

  // Calculate monthly yield using slider price and live exchange rate
  const monthlyYieldICP = icpStaked * monthlyRate / 100;
  const monthlyYieldUSD = monthlyYieldICP * icpPriceSlider;
  const monthlyYieldNOK = monthlyYieldUSD * exchangeRate;

  // Generate 12 months of projected yields with compound interest
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() + i);
    
    // Compound the staked amount
    const compoundedAmount = icpStaked * Math.pow(1 + monthlyRate / 100, i + 1);
    const monthlyYield = compoundedAmount * (monthlyRate / 100);
    
    return {
      month: month.toLocaleDateString('no-NO', { month: 'short', year: '2-digit' }),
      yieldICP: monthlyYield,
      yieldUSD: monthlyYield * icpPriceSlider,
      yieldNOK: monthlyYield * icpPriceSlider * exchangeRate,
      totalStaked: compoundedAmount
    };
  });

  const yearlyProjection = {
    totalYieldICP: icpStaked * (annualRate / 100),
    totalYieldUSD: icpStaked * (annualRate / 100) * icpPriceSlider,
    totalYieldNOK: icpStaked * (annualRate / 100) * icpPriceSlider * exchangeRate
  };

  return (
    <div className="space-y-6">
      {/* ICP Price Slider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Juster ICP-pris for avkastningsberegning</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="icp-price-slider">ICP-pris (USD)</Label>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(icpPriceSlider, 'USD')}
              </span>
            </div>
            <Slider
              id="icp-price-slider"
              min={0}
              max={200}
              step={0.5}
              value={[icpPriceSlider]}
              onValueChange={(value) => setIcpPriceSlider(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>Nåværende pris: {formatCurrency(currentIcpPrice, 'USD')}</span>
              <span>$200</span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Bruk glidebryteren for å se hvordan forskjellige ICP-priser påvirker din månedlige og årlige avkastning fra staking.
              Vekslingskurs: 1 USD = {exchangeRate.toFixed(4)} NOK {portfolio?.exchangeRate.source === 'live' ? '🟢' : '🟡'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staket ICP</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(icpStaked, 0)}</div>
            <p className="text-xs text-muted-foreground">
              @ {formatNumber(annualRate, 1)}% APY (8 år)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlig Avkastning (ICP)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(monthlyYieldICP, 1)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(monthlyRate, 2)}% månedlig
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlig Avkastning (USD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyYieldUSD, 'USD')}</div>
            <p className="text-xs text-muted-foreground">
              @ {formatCurrency(icpPriceSlider, 'USD')} per ICP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Månedlig Avkastning (NOK)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyYieldNOK, 'NOK')}</div>
            <p className="text-xs text-muted-foreground">
              Vekslingskurs: {exchangeRate.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ICP Breakdown */}
      {icpAsset && (
        <Card>
          <CardHeader>
            <CardTitle>ICP Beholdningsoversikt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground">Staket ICP</h4>
                <p className="text-2xl font-bold">{formatNumber(icpStaked, 0)}</p>
                <p className="text-xs text-muted-foreground">Tjener {formatNumber(annualRate, 1)}% APY</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground">Likvid ICP</h4>
                <p className="text-2xl font-bold">{formatNumber(icpLiquid, 0)}</p>
                <p className="text-xs text-muted-foreground">Tilgjengelig for handel</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground">Total ICP</h4>
                <p className="text-2xl font-bold">{formatNumber(icpTotal, 0)}</p>
                <p className="text-xs text-muted-foreground">Kombinerte beholdninger</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Yield Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projisert Månedlig Avkastning (12 Måneder)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sammensatt månedlig med {formatNumber(annualRate, 1)}% årlig rente
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'yieldUSD') return [formatCurrency(value, 'USD'), 'Månedlig Avkastning (USD)'];
                    return [formatNumber(value, 1), 'Månedlig Avkastning (ICP)'];
                  }}
                />
                <Bar dataKey="yieldUSD" fill="#0088FE" name="yieldUSD" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Månedlig Avkastningsdetaljer</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Måned</TableHead>
                <TableHead>Total Staket (ICP)</TableHead>
                <TableHead>Månedlig Avkastning (ICP)</TableHead>
                <TableHead>Månedlig Avkastning (USD)</TableHead>
                <TableHead>Månedlig Avkastning (NOK)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.slice(0, 6).map((data, index) => (
                <TableRow key={data.month}>
                  <TableCell className="font-medium">{data.month}</TableCell>
                  <TableCell>{formatNumber(data.totalStaked, 0)}</TableCell>
                  <TableCell>{formatNumber(data.yieldICP, 1)}</TableCell>
                  <TableCell>{formatCurrency(data.yieldUSD, 'USD')}</TableCell>
                  <TableCell>{formatCurrency(data.yieldNOK, 'NOK')}</TableCell>
                  <TableCell>
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {index === 0 ? "Nåværende" : "Projisert"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Annual Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Årlig Avkastningsprognose</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground">Total Årlig Avkastning (ICP)</h4>
              <p className="text-2xl font-bold">{formatNumber(yearlyProjection.totalYieldICP, 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground">Total Årlig Avkastning (USD)</h4>
              <p className="text-2xl font-bold">{formatCurrency(yearlyProjection.totalYieldUSD, 'USD')}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground">Total Årlig Avkastning (NOK)</h4>
              <p className="text-2xl font-bold">{formatCurrency(yearlyProjection.totalYieldNOK, 'NOK')}</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="text-sm font-medium mb-2">Staking-informasjon</h4>
            <p className="text-sm text-muted-foreground">
              ICP staking-belønninger beregnes basert på nettverksdeltakelse og kan endres. 
              Den nåværende renten på {formatNumber(annualRate, 1)}% APY er sammensatt månedlig for en 8-års staking-periode. 
              Faktiske belønninger kan variere basert på nettverksforhold og staking-varighet.
              Vekslingskurs: 1 USD = {exchangeRate.toFixed(4)} NOK.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
