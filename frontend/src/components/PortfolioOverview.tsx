import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Edit, Loader2, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePortfolio, useUpdateAssetQuantity, useUpdateCustomPrice, useResetToDefault, useLivePrices } from '@/hooks/useQueries';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import HistoricalPortfolioGraph from './HistoricalPortfolioGraph';
import { format } from 'date-fns';

interface PortfolioOverviewProps {
  assetFilter: 'all' | 'crypto' | 'stocks';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function formatCurrency(value: number, currency: 'USD' | 'NOK' = 'USD'): string {
  try {
    const numValue = Number(value);
    if (isNaN(numValue)) return currency === 'USD' ? '$0' : 'kr 0';
    
    if (currency === 'USD') {
      return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `kr ${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  } catch (error) {
    console.error('[formatCurrency] Error:', error);
    return currency === 'USD' ? '$0' : 'kr 0';
  }
}

function formatPercentage(value: number): string {
  try {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.00%';
    const sign = numValue >= 0 ? '+' : '';
    return `${sign}${numValue.toFixed(2)}%`;
  } catch (error) {
    console.error('[formatPercentage] Error:', error);
    return '0.00%';
  }
}

function getStatusIndicator(asset: any) {
  try {
    const status = asset.apiStatus || 'fallback';
    const message = asset.apiMessage || 'Using default price';
    
    if (status === 'success') {
      return {
        color: 'text-green-600',
        dot: '🟢',
        tooltip: message,
      };
    } else if (status === 'custom') {
      return {
        color: 'text-blue-600',
        dot: '🔵',
        tooltip: message,
      };
    } else {
      return {
        color: 'text-red-600',
        dot: '🔴',
        tooltip: message,
      };
    }
  } catch (error) {
    console.error('[getStatusIndicator] Error:', error);
    return {
      color: 'text-gray-600',
      dot: '⚪',
      tooltip: 'Unknown status',
    };
  }
}

export default function PortfolioOverview({ assetFilter }: PortfolioOverviewProps) {
  const { data: portfolio, isLoading, error, isFetching } = usePortfolio();
  const { data: livePrices } = useLivePrices();
  const updateQuantityMutation = useUpdateAssetQuantity();
  const updatePriceMutation = useUpdateCustomPrice();
  const resetMutation = useResetToDefault();
  
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState<{ quantity: string; customPrice: string }>({ 
    quantity: '', 
    customPrice: '' 
  });

  const filteredAssets = useMemo(() => {
    try {
      if (!portfolio) return [];
      if (assetFilter === 'all') return portfolio.assets;
      return portfolio.assets.filter(asset => asset.type === assetFilter);
    } catch (error) {
      console.error('[filteredAssets] Error:', error);
      return [];
    }
  }, [portfolio, assetFilter]);

  const pieChartData = useMemo(() => {
    try {
      return filteredAssets.map(asset => ({
        name: asset.symbol,
        value: asset.value,
        allocation: asset.allocation
      }));
    } catch (error) {
      console.error('[pieChartData] Error:', error);
      return [];
    }
  }, [filteredAssets]);

  const totalValueUSD = useMemo(() => {
    try {
      const sum = filteredAssets.reduce((acc, asset) => acc + asset.value, 0);
      return sum;
    } catch (error) {
      console.error('[totalValueUSD] Error:', error);
      return 0;
    }
  }, [filteredAssets]);

  const totalValueNOK = useMemo(() => {
    try {
      if (!portfolio) return 0;
      const nok = totalValueUSD * portfolio.exchangeRate.rate;
      return nok;
    } catch (error) {
      console.error('[totalValueNOK] Error:', error);
      return 0;
    }
  }, [totalValueUSD, portfolio]);

  const weighted24hChange = useMemo(() => {
    try {
      if (totalValueUSD === 0) return 0;
      
      let weightedSum = 0;
      
      filteredAssets.forEach(asset => {
        const weight = asset.value / totalValueUSD;
        const contribution = asset.priceChange24h * weight;
        weightedSum += contribution;
      });
      
      return weightedSum;
    } catch (error) {
      console.error('[weighted24hChange] Error:', error);
      return 0;
    }
  }, [filteredAssets, totalValueUSD]);

  const apiStatusSummary = useMemo(() => {
    try {
      if (!livePrices) return { success: 0, fallback: 0, total: 0 };
      
      const prices = Object.values(livePrices);
      return {
        success: prices.filter(p => p.status === 'success').length,
        fallback: prices.filter(p => p.status === 'fallback').length,
        total: prices.length,
      };
    } catch (error) {
      console.error('[apiStatusSummary] Error:', error);
      return { success: 0, fallback: 0, total: 0 };
    }
  }, [livePrices]);

  const handleEditAsset = (asset: any) => {
    try {
      setEditingAsset(asset.id);
      setEditValues({
        quantity: asset.quantity.toString(),
        customPrice: asset.customPrice ? asset.customPrice.toString() : '',
      });
      setEditDialogOpen(true);
    } catch (error) {
      console.error('[handleEditAsset] Error:', error);
      toast.error('Failed to open edit dialog');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingAsset) return;
      
      const quantity = parseFloat(editValues.quantity);
      
      if (isNaN(quantity) || quantity < 0) {
        toast.error('Please enter a valid quantity (must be 0 or greater)');
        return;
      }

      // Update custom price first if provided
      if (editValues.customPrice.trim() !== '') {
        const customPrice = parseFloat(editValues.customPrice);
        if (isNaN(customPrice) || customPrice < 0) {
          toast.error('Please enter a valid price (must be 0 or greater)');
          return;
        }
        await updatePriceMutation.mutateAsync({ assetId: editingAsset, price: customPrice });
      } else {
        // Clear custom price if empty
        await updatePriceMutation.mutateAsync({ assetId: editingAsset, price: null });
      }

      // Update quantity
      await updateQuantityMutation.mutateAsync({ assetId: editingAsset, quantity });
      
      setEditDialogOpen(false);
      setEditingAsset(null);
      toast.success('Asset updated successfully');
    } catch (error: any) {
      console.error('[PortfolioOverview] ❌ Error updating asset:', error);
      const errorMessage = error?.message || 'Failed to update asset';
      toast.error(errorMessage);
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      toast.success('Portfolio reset to default values');
    } catch (error) {
      console.error('[PortfolioOverview] ❌ Error resetting portfolio:', error);
      toast.error('Failed to reset portfolio');
    }
  };

  // Always show portfolio with default data, even while loading
  if (!portfolio) {
    return (
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Loading portfolio data...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    console.error('[PortfolioOverview] ❌ Error loading portfolio:', error);
  }

  const exchangeRate = portfolio.exchangeRate;
  const isLiveRate = exchangeRate.source === 'live';
  const isCachedRate = exchangeRate.source === 'cached';
  const lastUpdate = exchangeRate.timestamp ? format(new Date(exchangeRate.timestamp), 'HH:mm:ss') : '-';

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {apiStatusSummary.fallback > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>API Status:</strong> {apiStatusSummary.success}/{apiStatusSummary.total} prices fetched live. 
              {apiStatusSummary.fallback > 0 && ` ${apiStatusSummary.fallback} using default prices.`}
            </AlertDescription>
          </Alert>
        )}

        {!isLiveRate && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Exchange Rate:</strong> {exchangeRate.message}
              {isCachedRate && ` (last updated: ${lastUpdate})`}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value (USD)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValueUSD, 'USD')}</div>
              <p className="text-xs text-muted-foreground">
                {isFetching ? 'Updating...' : apiStatusSummary.success > 0 ? 'Live market prices' : 'Default prices'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value (NOK)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValueNOK, 'NOK')}</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground cursor-help flex items-center space-x-1">
                    <span>1 USD = {exchangeRate.rate.toFixed(4)} NOK</span>
                    {isLiveRate ? (
                      <span className="text-green-600">🟢</span>
                    ) : (
                      <span className="text-amber-600">🟡</span>
                    )}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{exchangeRate.message}</p>
                  {exchangeRate.timestamp && (
                    <p className="text-xs">Updated: {lastUpdate}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Change</CardTitle>
              {weighted24hChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${weighted24hChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(weighted24hChange)}
              </div>
              <p className="text-xs text-muted-foreground">Weighted average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAssets.length}</div>
              <p className="text-xs text-muted-foreground">
                {assetFilter === 'all' ? 'All types' : assetFilter === 'crypto' ? 'Crypto' : 'Stocks'}
              </p>
            </CardContent>
          </Card>
        </div>

        <HistoricalPortfolioGraph />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Portfolio Management</CardTitle>
            <Button variant="outline" onClick={handleReset} disabled={resetMutation.isPending}>
              {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset to Default
            </Button>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, allocation }) => `${name} ${allocation.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [formatCurrency(value, 'USD'), 'Value']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    const statusIndicator = getStatusIndicator(asset);
                    
                    return (
                      <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold">{asset.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{asset.name}</p>
                              {statusIndicator && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help text-sm">
                                      {statusIndicator.dot}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{statusIndicator.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {asset.isStaked && asset.id === 'ICP' ? (
                                <div>
                                  <div>Staked: {asset.stakedAmount} at {formatCurrency(asset.currentPrice, 'USD')} each</div>
                                  <div>Unstaked: {asset.unstakedAmount} at {formatCurrency(asset.currentPrice, 'USD')} each</div>
                                  <div className="font-medium">Total: {asset.quantity} ICP</div>
                                </div>
                              ) : (
                                <div>
                                  {asset.quantity} {asset.symbol} at {formatCurrency(asset.currentPrice, 'USD')} each
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <div>
                            <p className="font-medium">{formatCurrency(asset.value, 'USD')}</p>
                            <div className="flex items-center justify-end space-x-2">
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
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleEditAsset(asset)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No assets available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit {filteredAssets.find(a => a.id === editingAsset)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={editValues.quantity}
                  onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be 0 or greater
                </p>
              </div>
              <div>
                <Label htmlFor="customPrice">Custom Price (USD)</Label>
                <Input
                  id="customPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave empty to use live price"
                  value={editValues.customPrice}
                  onChange={(e) => setEditValues(prev => ({ ...prev, customPrice: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use live market price. Enter a value to override (must be 0 or greater).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={updateQuantityMutation.isPending || updatePriceMutation.isPending}
              >
                {(updateQuantityMutation.isPending || updatePriceMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
