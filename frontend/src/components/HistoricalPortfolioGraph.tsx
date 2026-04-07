import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useHistoricalPortfolioData } from '@/hooks/useQueries';
import { format } from 'date-fns';
import { Maximize2, X, Info } from 'lucide-react';

export default function HistoricalPortfolioGraph() {
  const { data: historicalData, isLoading, error } = useHistoricalPortfolioData();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartData = useMemo(() => {
    try {
      if (!historicalData || historicalData.length === 0) return [];
      
      const sorted = [...historicalData].sort((a, b) => a.dateTimestamp - b.dateTimestamp);
      
      return sorted.map(point => {
        const date = new Date(point.dateTimestamp);
        return {
          timestamp: point.dateTimestamp,
          displayDate: format(date, 'dd.MM.yyyy'),
          value: point.value,
          dateString: point.date,
        };
      });
    } catch (error) {
      console.error('[chartData] Error:', error);
      return [];
    }
  }, [historicalData]);

  const formatYAxis = (value: number) => {
    try {
      return `${(value / 1000).toFixed(0)}k`;
    } catch (error) {
      console.error('[formatYAxis] Error:', error);
      return '0k';
    }
  };

  const formatTooltipValue = (value: number) => {
    try {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr`;
    } catch (error) {
      console.error('[formatTooltipValue] Error:', error);
      return '0 kr';
    }
  };

  const formatXAxis = (timestamp: number) => {
    try {
      if (!timestamp || isNaN(timestamp)) return '';
      const date = new Date(timestamp);
      return format(date, 'dd.MM.yy');
    } catch (error) {
      console.error('[formatXAxis] Error:', error);
      return '';
    }
  };

  const toggleFullscreen = () => {
    try {
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('[toggleFullscreen] Error:', error);
    }
  };

  const renderChart = (height: string) => (
    <div className={height}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-muted-foreground"
              scale="time"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--card-foreground))' }}
              formatter={(value: number) => [formatTooltipValue(value), 'Value']}
              labelFormatter={(timestamp: number) => {
                if (!timestamp || isNaN(timestamp)) return 'Invalid date';
                try {
                  const date = new Date(timestamp);
                  return `Date: ${format(date, 'dd MMMM yyyy')}`;
                } catch {
                  return 'Invalid date';
                }
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Portfolio Value (NOK)"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No historical data available
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance Over Time</CardTitle>
          <CardDescription>Historical value in NOK - Updates daily at 18:00 CET</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('[HistoricalPortfolioGraph] Error:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance Over Time</CardTitle>
          <CardDescription>Historical value in NOK - Updates daily at 18:00 CET</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Loading historical data... If this persists, please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance Over Time</CardTitle>
          <CardDescription>Historical value in NOK - Updates daily at 18:00 CET</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No historical data available yet. Data will appear as your portfolio is tracked over time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow" 
        onClick={toggleFullscreen}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Performance Over Time</CardTitle>
              <CardDescription>
                Historical value in NOK - Updates daily at 18:00 CET. Click to expand.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => { 
                e.stopPropagation(); 
                toggleFullscreen(); 
              }}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart('h-80')}
        </CardContent>
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Portfolio Performance Over Time</h2>
                <p className="text-sm text-muted-foreground">
                  Historical value in NOK - Updates daily at 18:00 CET.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
            {renderChart('h-[calc(100vh-120px)]')}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
