interface CoinGeckoPriceData {
  usd: number;
  usd_24h_change: number;
}

interface CoinGeckoResponse {
  bitcoin?: CoinGeckoPriceData;
  'internet-computer'?: CoinGeckoPriceData;
  'spx6900'?: CoinGeckoPriceData;
}

interface FinnhubQuote {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

interface ExchangeRateResponse {
  rates: {
    NOK: number;
  };
  base: string;
  date: string;
}

export interface PriceData {
  price: number;
  change24h: number;
  status: 'success' | 'fallback';
  message: string;
  timestamp: number;
}

export interface ExchangeRateData {
  rate: number;
  timestamp: number;
  source: 'live' | 'cached' | 'default';
  status: 'success' | 'fallback';
  message: string;
}

const FALLBACK_PRICES: Record<string, PriceData> = {
  ICP: { 
    price: 4.36, 
    change24h: 2.40, 
    status: 'fallback', 
    message: 'Bruker standardpris (CoinGecko API utilgjengelig)', 
    timestamp: Date.now() 
  },
  BTC: { 
    price: 118632, 
    change24h: 1.89, 
    status: 'fallback', 
    message: 'Bruker standardpris (CoinGecko API utilgjengelig)', 
    timestamp: Date.now() 
  },
  SPX: { 
    price: 1.11, 
    change24h: 19.20, 
    status: 'fallback', 
    message: 'Bruker standardpris (CoinGecko API utilgjengelig)', 
    timestamp: Date.now() 
  },
  BMNR: { 
    price: 52.59, 
    change24h: -2.42, 
    status: 'fallback', 
    message: 'Bruker standardpris (Finnhub API utilgjengelig)', 
    timestamp: Date.now() 
  },
  MSTR: { 
    price: 322.21, 
    change24h: 0.00, 
    status: 'fallback', 
    message: 'Bruker standardpris (Finnhub API utilgjengelig)', 
    timestamp: Date.now() 
  },
  SBET: { 
    price: 17.26, 
    change24h: 7.88, 
    status: 'fallback', 
    message: 'Bruker standardpris (Finnhub API utilgjengelig)', 
    timestamp: Date.now() 
  },
};

const DEFAULT_EXCHANGE_RATE: ExchangeRateData = {
  rate: 9.96,
  timestamp: Date.now(),
  source: 'default',
  status: 'fallback',
  message: 'Bruker standard vekslingskurs (ExchangeRate API utilgjengelig)',
};

const FINNHUB_API_KEY = 'd3fsbq9r01qqbh542lbgd3fsbq9r01qqbh542lc0';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let cachedExchangeRate: ExchangeRateData | null = null;
let cachedPrices: Record<string, PriceData> = {};

export async function fetchExchangeRate(): Promise<ExchangeRateData> {
  const startTime = Date.now();
  console.log('[PriceService] 🔄 Fetching USD/NOK exchange rate from exchangerate-api.com...');
  
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error(`[PriceService] ❌ Exchange Rate API error: ${response.status} ${response.statusText} (${elapsed}ms)`);
      throw new Error(`Exchange Rate API error: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (data.rates && data.rates.NOK) {
      const exchangeRateData: ExchangeRateData = {
        rate: data.rates.NOK,
        timestamp: Date.now(),
        source: 'live',
        status: 'success',
        message: `Live vekslingskurs fra exchangerate-api.com (oppdatert ${data.date})`,
      };
      
      cachedExchangeRate = exchangeRateData;
      console.log(`[PriceService] ✅ Exchange rate fetched successfully: 1 USD = ${data.rates.NOK.toFixed(4)} NOK (${elapsed}ms)`);
      
      return exchangeRateData;
    } else {
      console.error('[PriceService] ❌ NOK rate not found in API response');
      throw new Error('NOK rate not found in response');
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[PriceService] ❌ Exchange rate fetch failed (${elapsed}ms):`, error);
    
    if (cachedExchangeRate && cachedExchangeRate.status === 'success') {
      const cacheAge = Date.now() - cachedExchangeRate.timestamp;
      const cacheAgeMinutes = Math.floor(cacheAge / 60000);
      
      console.warn(`[PriceService] ⚠️ Using cached exchange rate from ${cacheAgeMinutes} minutes ago`);
      
      return {
        ...cachedExchangeRate,
        source: 'cached',
        message: `Bruker cachet vekslingskurs fra ${cacheAgeMinutes} minutter siden (API utilgjengelig)`,
      };
    }
    
    console.warn('[PriceService] ⚠️ Falling back to default exchange rate: 1 USD = 9.96 NOK');
    return DEFAULT_EXCHANGE_RATE;
  }
}

export async function fetchCryptoPrices(): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  const startTime = Date.now();
  
  console.log('[PriceService] 🔄 Fetching crypto prices from CoinGecko API...');
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,internet-computer,spx6900&vs_currencies=usd&include_24hr_change=true',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error(`[PriceService] ❌ CoinGecko API error: ${response.status} ${response.statusText} (${elapsed}ms)`);
      
      if (response.status === 429) {
        console.error('[PriceService] ❌ Rate limit exceeded on CoinGecko API');
      }
      
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();
    console.log(`[PriceService] ✅ CoinGecko API response received (${elapsed}ms)`);

    // Process Bitcoin
    if (data.bitcoin && data.bitcoin.usd) {
      results.BTC = {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change || 0,
        status: 'success',
        message: 'Hentet fra CoinGecko API',
        timestamp: Date.now(),
      };
      cachedPrices.BTC = results.BTC;
      console.log(`[PriceService] ✅ BTC: $${data.bitcoin.usd.toFixed(2)} (${data.bitcoin.usd_24h_change?.toFixed(2)}%)`);
    } else {
      console.warn('[PriceService] ⚠️ BTC data missing in response, using fallback');
      results.BTC = cachedPrices.BTC || FALLBACK_PRICES.BTC;
    }

    // Process Internet Computer
    if (data['internet-computer'] && data['internet-computer'].usd) {
      results.ICP = {
        price: data['internet-computer'].usd,
        change24h: data['internet-computer'].usd_24h_change || 0,
        status: 'success',
        message: 'Hentet fra CoinGecko API',
        timestamp: Date.now(),
      };
      cachedPrices.ICP = results.ICP;
      console.log(`[PriceService] ✅ ICP: $${data['internet-computer'].usd.toFixed(2)} (${data['internet-computer'].usd_24h_change?.toFixed(2)}%)`);
    } else {
      console.warn('[PriceService] ⚠️ ICP data missing in response, using fallback');
      results.ICP = cachedPrices.ICP || FALLBACK_PRICES.ICP;
    }

    // Process SPX
    if (data.spx6900 && data.spx6900.usd) {
      results.SPX = {
        price: data.spx6900.usd,
        change24h: data.spx6900.usd_24h_change || 0,
        status: 'success',
        message: 'Hentet fra CoinGecko API',
        timestamp: Date.now(),
      };
      cachedPrices.SPX = results.SPX;
      console.log(`[PriceService] ✅ SPX: $${data.spx6900.usd.toFixed(2)} (${data.spx6900.usd_24h_change?.toFixed(2)}%)`);
    } else {
      console.warn('[PriceService] ⚠️ SPX data missing in response, using fallback');
      results.SPX = cachedPrices.SPX || FALLBACK_PRICES.SPX;
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[PriceService] ❌ Crypto prices fetch failed (${elapsed}ms):`, error);
    console.warn('[PriceService] ⚠️ Using cached or fallback prices for all crypto assets');
    
    results.BTC = cachedPrices.BTC || FALLBACK_PRICES.BTC;
    results.ICP = cachedPrices.ICP || FALLBACK_PRICES.ICP;
    results.SPX = cachedPrices.SPX || FALLBACK_PRICES.SPX;
  }

  return results;
}

async function fetchFinnhubQuote(symbol: string): Promise<PriceData | null> {
  const startTime = Date.now();
  
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    
    console.log(`[PriceService] 🔄 Fetching ${symbol} from Finnhub...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error(`[PriceService] ❌ Finnhub API error for ${symbol}: ${response.status} ${response.statusText} (${elapsed}ms)`);
      
      if (response.status === 429) {
        console.error(`[PriceService] ❌ Rate limit exceeded on Finnhub API for ${symbol}`);
      }
      
      return null;
    }

    const data: FinnhubQuote = await response.json();

    if (!data.c || data.c === 0) {
      console.warn(`[PriceService] ⚠️ ${symbol} returned zero or null price (${elapsed}ms)`);
      return null;
    }

    const changePercent = data.dp || 0;

    const result: PriceData = {
      price: Number(data.c.toFixed(2)),
      change24h: Number(changePercent.toFixed(2)),
      status: 'success',
      message: 'Hentet fra Finnhub API',
      timestamp: Date.now(),
    };

    console.log(`[PriceService] ✅ ${symbol}: $${result.price.toFixed(2)} (${result.change24h.toFixed(2)}%) (${elapsed}ms)`);

    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[PriceService] ❌ Error fetching ${symbol} (${elapsed}ms):`, error);
    return null;
  }
}

export async function fetchStockPrice(symbol: string): Promise<PriceData> {
  console.log(`[PriceService] 🔄 Starting stock price fetch for ${symbol}...`);
  
  try {
    // Try primary symbol
    let result = await fetchFinnhubQuote(symbol);
    
    if (result) {
      cachedPrices[symbol] = result;
      return result;
    }
    
    // For OTC stocks, try alternative formats
    if (symbol === 'BMNR' || symbol === 'SBET') {
      console.log(`[PriceService] ⚠️ ${symbol} not found, trying alternative OTC formats...`);
      
      const alternatives = [`${symbol}:US`, `${symbol}.PK`, `${symbol}.OB`, `OTCMKTS:${symbol}`];
      
      for (const altSymbol of alternatives) {
        await delay(1500); // Rate limiting
        result = await fetchFinnhubQuote(altSymbol);
        if (result) {
          console.log(`[PriceService] ✅ ${symbol} found using alternative format: ${altSymbol}`);
          cachedPrices[symbol] = result;
          return result;
        }
      }
      
      console.warn(`[PriceService] ⚠️ ${symbol} not found in any OTC format`);
    }
  } catch (error) {
    console.error(`[PriceService] ❌ Stock price fetch failed for ${symbol}:`, error);
  }
  
  // Use cached price if available
  if (cachedPrices[symbol] && cachedPrices[symbol].status === 'success') {
    const cacheAge = Date.now() - cachedPrices[symbol].timestamp;
    const cacheAgeMinutes = Math.floor(cacheAge / 60000);
    console.warn(`[PriceService] ⚠️ Using cached price for ${symbol} from ${cacheAgeMinutes} minutes ago`);
    
    return {
      ...cachedPrices[symbol],
      message: `Bruker cachet pris fra ${cacheAgeMinutes} minutter siden (API utilgjengelig)`,
    };
  }
  
  // Fall back to default
  const fallbackMessage = symbol === 'BMNR' || symbol === 'SBET' 
    ? `${symbol} OTC-ticker ikke funnet i Finnhub - Bruker standardpris`
    : `${symbol} ticker ikke funnet - Bruker standardpris`;
  
  console.warn(`[PriceService] ⚠️ Falling back to default price for ${symbol}`);
  
  return {
    ...FALLBACK_PRICES[symbol],
    message: fallbackMessage,
    timestamp: Date.now(),
  };
}

export async function fetchAllStockPrices(): Promise<Record<string, PriceData>> {
  const symbols = ['MSTR', 'BMNR', 'SBET'];
  const results: Record<string, PriceData> = {};

  console.log('[PriceService] 🔄 Fetching all stock prices...');

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    
    try {
      const data = await fetchStockPrice(symbol);
      results[symbol] = data;
      
      // Rate limiting between requests
      if (i < symbols.length - 1) {
        await delay(1500);
      }
    } catch (error) {
      console.error(`[PriceService] ❌ Failed to fetch ${symbol}:`, error);
      results[symbol] = cachedPrices[symbol] || FALLBACK_PRICES[symbol];
    }
  }

  console.log('[PriceService] ✅ Stock price fetch complete');
  return results;
}

export async function fetchAllPrices(): Promise<Record<string, PriceData>> {
  console.log('[PriceService] 🚀 Starting comprehensive price fetch...');
  const startTime = Date.now();
  
  try {
    const [cryptoPrices, stockPrices] = await Promise.all([
      fetchCryptoPrices(),
      fetchAllStockPrices(),
    ]);

    const allPrices = {
      ...cryptoPrices,
      ...stockPrices,
    };
    
    const elapsed = Date.now() - startTime;
    const successCount = Object.values(allPrices).filter(p => p.status === 'success').length;
    const totalCount = Object.keys(allPrices).length;
    
    console.log(`[PriceService] ✅ Price fetch complete: ${successCount}/${totalCount} successful (${elapsed}ms)`);
    
    // Log summary
    Object.entries(allPrices).forEach(([symbol, data]) => {
      const statusIcon = data.status === 'success' ? '✅' : '⚠️';
      console.log(`[PriceService] ${statusIcon} ${symbol}: ${data.status} - ${data.message}`);
    });
    
    return allPrices;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[PriceService] ❌ Critical error in fetchAllPrices (${elapsed}ms):`, error);
    console.warn('[PriceService] ⚠️ Returning all fallback prices');
    return FALLBACK_PRICES;
  }
}
