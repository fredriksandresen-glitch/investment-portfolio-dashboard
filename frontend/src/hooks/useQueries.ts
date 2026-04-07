import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeActor } from './useSafeActor';
import type { Asset, HistoricalDataPoint as BackendHistoricalDataPoint, UserPortfolio } from '@/backend';
import { fetchAllPrices, fetchExchangeRate, type PriceData, type ExchangeRateData } from '@/lib/priceService';
import { format, parse, isValid } from 'date-fns';
import { buildQueryKey } from '@/lib/reactQueryKey';
import { logQueryEvent } from '@/lib/queryDiagnostics';

export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  type: 'crypto' | 'stock';
  quantity: number;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  value: number;
  allocation: number;
  isStaked?: boolean;
  stakedAmount?: number;
  unstakedAmount?: number;
  annualYield?: number;
  customPrice?: number;
  apiStatus?: string;
  apiMessage?: string;
}

export interface PortfolioData {
  totalValueUSD: number;
  totalValueNOK: number;
  assets: PortfolioAsset[];
  lastUpdate: Date;
  exchangeRate: ExchangeRateData;
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
  volume: number;
}

export interface HistoricalPortfolioDataPoint {
  date: string;
  dateTimestamp: number;
  value: number;
}

// Default hardcoded assets for immediate display
const DEFAULT_ASSETS: Asset[] = [
  {
    id: 'ICP',
    name: 'Internet Computer',
    quantity: 15500.0,
    price: 4.36,
    type: 'crypto',
    isStaked: true,
    stakedAmount: 8500.0,
    annualYield: 14.2,
    customPrice: undefined,
    priceChange24h: 2.40,
    apiStatus: 'fallback',
    lastUpdated: BigInt(Date.now() * 1000000),
  },
  {
    id: 'BTC',
    name: 'Bitcoin',
    quantity: 0.09,
    price: 118632.0,
    type: 'crypto',
    isStaked: false,
    stakedAmount: 0.0,
    annualYield: 0.0,
    customPrice: undefined,
    priceChange24h: 1.89,
    apiStatus: 'fallback',
    lastUpdated: BigInt(Date.now() * 1000000),
  },
  {
    id: 'SPX',
    name: 'SPX6900',
    quantity: 1000.0,
    price: 1.11,
    type: 'crypto',
    isStaked: false,
    stakedAmount: 0.0,
    annualYield: 0.0,
    customPrice: undefined,
    priceChange24h: 19.20,
    apiStatus: 'fallback',
    lastUpdated: BigInt(Date.now() * 1000000),
  },
  {
    id: 'BMNR',
    name: 'Bitdeer Technologies',
    quantity: 700.0,
    price: 52.59,
    type: 'stock',
    isStaked: false,
    stakedAmount: 0.0,
    annualYield: 0.0,
    customPrice: undefined,
    priceChange24h: -2.42,
    apiStatus: 'fallback',
    lastUpdated: BigInt(Date.now() * 1000000),
  },
  {
    id: 'MSTR',
    name: 'MicroStrategy',
    quantity: 9.0,
    price: 322.21,
    type: 'stock',
    isStaked: false,
    stakedAmount: 0.0,
    annualYield: 0.0,
    customPrice: undefined,
    priceChange24h: 0.0,
    apiStatus: 'fallback',
    lastUpdated: BigInt(Date.now() * 1000000),
  },
  {
    id: 'SBET',
    name: 'SharpLink Gaming',
    quantity: 653.0,
    price: 17.26,
    type: 'stock',
    isStaked: false,
    stakedAmount: 0.0,
    annualYield: 0.0,
    customPrice: undefined,
    priceChange24h: 7.88,
    apiStatus: 'fallback',
    lastUpdated: BigInt(Date.now() * 1000000),
  },
];

const DEFAULT_HISTORICAL_DATA: BackendHistoricalDataPoint[] = [
  { date: '2024-01-23', value: 276582.0 },
  { date: '2024-02-27', value: 393238.0 },
  { date: '2024-03-25', value: 512416.0 },
  { date: '2024-07-05', value: 983495.0 },
  { date: '2024-09-11', value: 1113401.0 },
  { date: '2024-10-23', value: 1308072.0 },
  { date: '2024-11-22', value: 1802928.0 },
  { date: '2025-02-04', value: 1622377.0 },
  { date: '2025-03-15', value: 1256164.0 },
  { date: '2025-04-15', value: 1444567.0 },
  { date: '2025-05-15', value: 1296673.0 },
];

// Default exchange rate for immediate display
const DEFAULT_EXCHANGE_RATE: ExchangeRateData = {
  rate: 9.96,
  timestamp: Date.now(),
  source: 'default' as const,
  status: 'fallback' as const,
  message: 'Using default exchange rate',
};

/**
 * Safely parse and normalize historical date strings.
 * Accepts ISO (yyyy-MM-dd) and legacy formats (dd/MM/yyyy).
 * Returns a valid Date object or null if parsing fails.
 */
function parseHistoricalDate(dateString: string): Date | null {
  try {
    // Try ISO format first (yyyy-MM-dd)
    let parsed = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) {
      return parsed;
    }

    // Try legacy format (dd/MM/yyyy)
    parsed = parse(dateString, 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) {
      return parsed;
    }

    // Try other common formats
    parsed = parse(dateString, 'MM/dd/yyyy', new Date());
    if (isValid(parsed)) {
      return parsed;
    }

    console.warn(`[parseHistoricalDate] Could not parse date: "${dateString}"`);
    return null;
  } catch (error) {
    console.error(`[parseHistoricalDate] Error parsing date "${dateString}":`, error);
    return null;
  }
}

/**
 * Normalize a date string to ISO format (yyyy-MM-dd).
 * Returns the normalized string or the original if parsing fails.
 */
function normalizeDateString(dateString: string): string {
  const parsed = parseHistoricalDate(dateString);
  if (parsed) {
    return format(parsed, 'yyyy-MM-dd');
  }
  return dateString;
}

// Fetch live exchange rate - auto-refetch every 5 minutes
export function useExchangeRate() {
  return useQuery<ExchangeRateData>({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      console.log('[useExchangeRate] 🔄 Fetching exchange rate...');
      try {
        const rate = await fetchExchangeRate();
        console.log(`[useExchangeRate] ✅ Exchange rate: ${rate.status} - ${rate.message}`);
        return rate;
      } catch (error) {
        console.error('[useExchangeRate] ❌ Error:', error);
        return DEFAULT_EXCHANGE_RATE;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount, use cached data
    refetchOnReconnect: true,
    retry: 1,
    initialData: DEFAULT_EXCHANGE_RATE,
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
}

// Fetch live prices from APIs - auto-refetch every 5 minutes
export function useLivePrices() {
  return useQuery<Record<string, PriceData>>({
    queryKey: ['live-prices'],
    queryFn: async () => {
      console.log('[useLivePrices] 🔄 Fetching all live prices...');
      try {
        const prices = await fetchAllPrices();
        const successCount = Object.values(prices).filter((p) => p.status === 'success').length;
        const totalCount = Object.keys(prices).length;
        console.log(`[useLivePrices] ✅ Fetched ${successCount}/${totalCount} prices successfully`);
        return prices;
      } catch (error) {
        console.error('[useLivePrices] ❌ Error:', error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount, use cached data
    refetchOnReconnect: true,
    retry: 1,
    initialData: {},
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
}

function convertAssetToPortfolioAsset(
  asset: Asset,
  livePrices: Record<string, PriceData> | undefined
): PortfolioAsset {
  try {
    const livePrice = livePrices?.[asset.id];

    let currentPrice = asset.price;
    let priceChange24h = asset.priceChange24h;
    let apiStatus = asset.apiStatus || 'fallback';
    let apiMessage = 'Using default price';

    if (asset.customPrice) {
      currentPrice = asset.customPrice;
      apiStatus = 'custom';
      apiMessage = 'Custom price';
      console.log(`[convertAsset] ${asset.id}: Using custom price $${currentPrice.toFixed(2)}`);
    } else if (livePrice && livePrice.status === 'success') {
      currentPrice = livePrice.price;
      priceChange24h = livePrice.change24h;
      apiStatus = livePrice.status;
      apiMessage = livePrice.message;
      console.log(
        `[convertAsset] ${asset.id}: Using live price $${currentPrice.toFixed(2)} (${priceChange24h.toFixed(2)}%)`
      );
    } else if (livePrice && livePrice.status === 'fallback') {
      currentPrice = livePrice.price;
      priceChange24h = livePrice.change24h;
      apiStatus = livePrice.status;
      apiMessage = livePrice.message;
      console.log(`[convertAsset] ${asset.id}: Using fallback price $${currentPrice.toFixed(2)} - ${apiMessage}`);
    } else {
      console.log(`[convertAsset] ${asset.id}: Using backend default price $${currentPrice.toFixed(2)}`);
    }

    const quantity = asset.quantity || 0;
    const stakedAmount = asset.stakedAmount || 0;
    const value = quantity * currentPrice;
    const unstakedAmount = asset.isStaked ? quantity - stakedAmount : quantity;

    return {
      id: asset.id,
      name: asset.name,
      symbol: asset.id,
      type: asset.type as 'crypto' | 'stock',
      quantity: Number(quantity.toFixed(6)),
      currentPrice: Number(currentPrice.toFixed(2)),
      priceChange24h: Number(priceChange24h.toFixed(2)),
      priceChange7d: 0,
      priceChange30d: 0,
      value: Number(value.toFixed(2)),
      allocation: 0,
      isStaked: asset.isStaked,
      stakedAmount: Number(stakedAmount.toFixed(6)),
      unstakedAmount: Number(unstakedAmount.toFixed(6)),
      annualYield: asset.annualYield || 0,
      customPrice: asset.customPrice,
      apiStatus,
      apiMessage,
    };
  } catch (error) {
    console.error(`[convertAsset] ❌ Error converting asset ${asset.id}:`, error);
    // Return safe default asset on error
    return {
      id: asset.id,
      name: asset.name,
      symbol: asset.id,
      type: asset.type as 'crypto' | 'stock',
      quantity: asset.quantity || 0,
      currentPrice: asset.price || 0,
      priceChange24h: asset.priceChange24h || 0,
      priceChange7d: 0,
      priceChange30d: 0,
      value: (asset.quantity || 0) * (asset.price || 0),
      allocation: 0,
      isStaked: asset.isStaked,
      stakedAmount: asset.stakedAmount || 0,
      unstakedAmount: asset.quantity || 0,
      annualYield: asset.annualYield || 0,
      customPrice: asset.customPrice,
      apiStatus: 'fallback',
      apiMessage: 'Error loading price',
    };
  }
}

export function useCallerPortfolio() {
  const { actor, isFetching, isReady } = useSafeActor();

  return useQuery<UserPortfolio>({
    queryKey: ['caller-portfolio'],
    queryFn: async () => {
      if (!actor) {
        console.warn('[useCallerPortfolio] ⚠️ Actor not available, using defaults');
        return {
          assets: DEFAULT_ASSETS,
          historicalData: DEFAULT_HISTORICAL_DATA,
          lastModified: BigInt(Date.now() * 1000000),
          totalValue: 0.0,
          annualReturn: 0.0,
          totalChange24h: 0.0,
        };
      }
      try {
        logQueryEvent('Fetching caller portfolio from backend');
        console.log('[useCallerPortfolio] 🔄 Fetching portfolio from backend...');
        const portfolio = await actor.getCallerPortfolio();
        console.log(`[useCallerPortfolio] ✅ Fetched portfolio with ${portfolio.assets.length} assets`);
        return portfolio;
      } catch (error) {
        console.error('[useCallerPortfolio] ❌ Error:', error);
        return {
          assets: DEFAULT_ASSETS,
          historicalData: DEFAULT_HISTORICAL_DATA,
          lastModified: BigInt(Date.now() * 1000000),
          totalValue: 0.0,
          annualReturn: 0.0,
          totalChange24h: 0.0,
        };
      }
    },
    enabled: isReady && !isFetching,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount, use cached data
    initialData: {
      assets: DEFAULT_ASSETS,
      historicalData: DEFAULT_HISTORICAL_DATA,
      lastModified: BigInt(Date.now() * 1000000),
      totalValue: 0.0,
      annualReturn: 0.0,
      totalChange24h: 0.0,
    },
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
}

export function usePortfolio() {
  const { data: userPortfolio, dataUpdatedAt: portfolioUpdatedAt } = useCallerPortfolio();
  const { data: livePrices, dataUpdatedAt: pricesUpdatedAt } = useLivePrices();
  const { data: exchangeRate, dataUpdatedAt: rateUpdatedAt } = useExchangeRate();

  // Build a stable query key using only update timestamps (not the full data objects)
  // This prevents unnecessary recomputation when data objects are recreated but values haven't changed
  const queryKey = buildQueryKey('portfolio', portfolioUpdatedAt, pricesUpdatedAt, rateUpdatedAt);

  return useQuery<PortfolioData>({
    queryKey,
    queryFn: async (): Promise<PortfolioData> => {
      try {
        console.log('[usePortfolio] 🔄 Building portfolio data...');

        if (!userPortfolio || !userPortfolio.assets || userPortfolio.assets.length === 0) {
          console.warn('[usePortfolio] ⚠️ No assets available, using defaults');
          const currentExchangeRate = exchangeRate || DEFAULT_EXCHANGE_RATE;

          const portfolioAssets = DEFAULT_ASSETS.map((asset) => convertAssetToPortfolioAsset(asset, livePrices));

          let totalValueUSD = 0;
          portfolioAssets.forEach((asset) => {
            totalValueUSD += asset.value;
          });

          const totalValueNOK = totalValueUSD * currentExchangeRate.rate;

          portfolioAssets.forEach((asset) => {
            asset.allocation = totalValueUSD > 0 ? (asset.value / totalValueUSD) * 100 : 0;
          });

          return {
            totalValueUSD: Number(totalValueUSD.toFixed(2)),
            totalValueNOK: Number(totalValueNOK.toFixed(2)),
            assets: portfolioAssets,
            lastUpdate: new Date(),
            exchangeRate: currentExchangeRate,
          };
        }

        const currentExchangeRate = exchangeRate || DEFAULT_EXCHANGE_RATE;

        console.log(`[usePortfolio] 📊 Converting ${userPortfolio.assets.length} assets with live prices...`);
        const portfolioAssets = userPortfolio.assets.map((asset) => convertAssetToPortfolioAsset(asset, livePrices));

        let totalValueUSD = 0;
        portfolioAssets.forEach((asset) => {
          totalValueUSD += asset.value;
        });

        const totalValueNOK = totalValueUSD * currentExchangeRate.rate;

        portfolioAssets.forEach((asset) => {
          asset.allocation = totalValueUSD > 0 ? (asset.value / totalValueUSD) * 100 : 0;
        });

        console.log(
          `[usePortfolio] ✅ Portfolio built: $${totalValueUSD.toFixed(2)} USD / kr ${totalValueNOK.toFixed(0)} NOK`
        );

        return {
          totalValueUSD: Number(totalValueUSD.toFixed(2)),
          totalValueNOK: Number(totalValueNOK.toFixed(2)),
          assets: portfolioAssets,
          lastUpdate: new Date(),
          exchangeRate: currentExchangeRate,
        };
      } catch (error) {
        console.error('[usePortfolio] ❌ Error building portfolio:', error);
        // Return safe default portfolio on error
        const currentExchangeRate = exchangeRate || DEFAULT_EXCHANGE_RATE;
        const portfolioAssets = DEFAULT_ASSETS.map((asset) => convertAssetToPortfolioAsset(asset, livePrices));

        let totalValueUSD = 0;
        portfolioAssets.forEach((asset) => {
          totalValueUSD += asset.value;
        });

        const totalValueNOK = totalValueUSD * currentExchangeRate.rate;

        portfolioAssets.forEach((asset) => {
          asset.allocation = totalValueUSD > 0 ? (asset.value / totalValueUSD) * 100 : 0;
        });

        return {
          totalValueUSD: Number(totalValueUSD.toFixed(2)),
          totalValueNOK: Number(totalValueNOK.toFixed(2)),
          assets: portfolioAssets,
          lastUpdate: new Date(),
          exchangeRate: currentExchangeRate,
        };
      }
    },
    enabled: true,
    staleTime: 30 * 1000, // Consider computed portfolio fresh for 30 seconds
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount, use cached data
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
}

export function useUpdateAssetQuantity() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, quantity }: { assetId: string; quantity: number }) => {
      if (!actor) throw new Error('Actor not available');

      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      console.log(`[useUpdateAssetQuantity] 🔄 Updating ${assetId} quantity to ${quantity}...`);
      await actor.updateAssetQuantity(assetId, quantity);
      console.log(`[useUpdateAssetQuantity] ✅ Updated ${assetId} quantity`);
    },
    onSuccess: async () => {
      logQueryEvent('Asset quantity updated - invalidating portfolio queries');
      console.log('[useUpdateAssetQuantity] 🔄 Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['caller-portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      console.log('[useUpdateAssetQuantity] ✅ Queries invalidated');
    },
    onError: (error) => {
      console.error('[useUpdateAssetQuantity] ❌ Mutation failed:', error);
    },
  });
}

export function useUpdateCustomPrice() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, price }: { assetId: string; price: number | null }) => {
      if (!actor) throw new Error('Actor not available');

      if (price !== null && price < 0) {
        throw new Error('Price cannot be negative');
      }

      console.log(`[useUpdateCustomPrice] 🔄 Updating ${assetId} custom price to ${price ? `$${price}` : 'null'}...`);
      await actor.updateAssetCustomPrice(assetId, price);
      console.log(`[useUpdateCustomPrice] ✅ Updated ${assetId} custom price`);
    },
    onSuccess: async () => {
      logQueryEvent('Custom price updated - invalidating portfolio queries');
      console.log('[useUpdateCustomPrice] 🔄 Invalidating queries...');
      await queryClient.invalidateQueries({ queryKey: ['caller-portfolio'] });
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      console.log('[useUpdateCustomPrice] ✅ Queries invalidated');
    },
    onError: (error) => {
      console.error('[useUpdateCustomPrice] ❌ Mutation failed:', error);
    },
  });
}

export function useResetToDefault() {
  const { actor } = useSafeActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useResetToDefault] 🔄 Resetting portfolio to defaults...');
      await actor.resetPortfolioToDefaults();
      console.log('[useResetToDefault] ✅ Portfolio reset complete');
    },
    onSuccess: async () => {
      logQueryEvent('Portfolio reset - invalidating all queries');
      console.log('[useResetToDefault] 🔄 Invalidating and refetching all queries...');
      await queryClient.invalidateQueries();
      console.log('[useResetToDefault] ✅ All data refetched');
    },
  });
}

export function useHistoricalData(symbol: string) {
  const { data: livePrices } = useLivePrices();

  return useQuery<HistoricalDataPoint[]>({
    queryKey: ['historical-data', symbol],
    queryFn: async (): Promise<HistoricalDataPoint[]> => {
      try {
        const data: HistoricalDataPoint[] = [];
        const now = new Date();
        const basePrice = livePrices?.[symbol]?.price || 100;

        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          const volatility = 0.05;
          const seed = symbol.charCodeAt(0) + i;
          const randomChange = Math.sin(seed) * volatility;
          const price = basePrice * (1 + randomChange * (i / 30));

          data.push({
            date: date.toISOString().split('T')[0],
            price: Number(price.toFixed(2)),
            volume: Math.floor(Math.abs(Math.sin(seed * 2)) * 1000000) + 100000,
          });
        }

        return data;
      } catch (error) {
        console.error(`[useHistoricalData] ❌ Error generating historical data for ${symbol}:`, error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useHistoricalPortfolioData() {
  const { actor } = useSafeActor();
  const { data: userPortfolio, dataUpdatedAt: portfolioUpdatedAt } = useCallerPortfolio();

  // Use stable query key based on update timestamp
  const queryKey = buildQueryKey('historical-portfolio-data', portfolioUpdatedAt);

  return useQuery<HistoricalPortfolioDataPoint[]>({
    queryKey,
    queryFn: async (): Promise<HistoricalPortfolioDataPoint[]> => {
      try {
        if (!actor) {
          console.warn('[useHistoricalPortfolioData] ⚠️ Actor not available, using defaults');
          const defaultPoints: HistoricalPortfolioDataPoint[] = DEFAULT_HISTORICAL_DATA.map(
            (point: BackendHistoricalDataPoint) => {
              const normalizedDate = normalizeDateString(point.date);
              const parsed = parseHistoricalDate(normalizedDate);

              if (!parsed) {
                console.warn(`[useHistoricalPortfolioData] Skipping invalid date: "${point.date}"`);
                return null;
              }

              return {
                date: normalizedDate,
                dateTimestamp: parsed.getTime(),
                value: point.value,
              };
            }
          ).filter((p): p is HistoricalPortfolioDataPoint => p !== null);

          defaultPoints.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
          return defaultPoints;
        }

        console.log('[useHistoricalPortfolioData] 🔄 Fetching historical data from backend...');
        const userPortfolioData = await actor.getCallerPortfolio();
        const backendData = userPortfolioData.historicalData;
        console.log(`[useHistoricalPortfolioData] 📥 Received ${backendData.length} data points from backend`);

        const historicalPoints: HistoricalPortfolioDataPoint[] = backendData
          .map((point: BackendHistoricalDataPoint) => {
            const normalizedDate = normalizeDateString(point.date);
            const parsed = parseHistoricalDate(normalizedDate);

            if (!parsed) {
              console.warn(`[useHistoricalPortfolioData] Skipping invalid date: "${point.date}"`);
              return null;
            }

            return {
              date: normalizedDate,
              dateTimestamp: parsed.getTime(),
              value: point.value,
            };
          })
          .filter((p): p is HistoricalPortfolioDataPoint => p !== null);

        historicalPoints.sort((a, b) => a.dateTimestamp - b.dateTimestamp);

        console.log(`[useHistoricalPortfolioData] 📊 Processed ${historicalPoints.length} historical points`);

        if (historicalPoints.length > 0) {
          const firstDate = historicalPoints[0].date;
          const lastDate = historicalPoints[historicalPoints.length - 1].date;
          console.log(`[useHistoricalPortfolioData] 📅 Date range: ${firstDate} to ${lastDate}`);
        }

        return historicalPoints;
      } catch (error) {
        console.error('[useHistoricalPortfolioData] ❌ Error fetching historical data:', error);

        const defaultPoints: HistoricalPortfolioDataPoint[] = DEFAULT_HISTORICAL_DATA.map(
          (point: BackendHistoricalDataPoint) => {
            const normalizedDate = normalizeDateString(point.date);
            const parsed = parseHistoricalDate(normalizedDate);

            if (!parsed) {
              console.warn(`[useHistoricalPortfolioData] Skipping invalid date: "${point.date}"`);
              return null;
            }

            return {
              date: normalizedDate,
              dateTimestamp: parsed.getTime(),
              value: point.value,
            };
          }
        ).filter((p): p is HistoricalPortfolioDataPoint => p !== null);

        defaultPoints.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
        return defaultPoints;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  });
}
