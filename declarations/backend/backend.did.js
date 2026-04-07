export const idlFactory = ({ IDL }) => {
  const PortfolioReturn = IDL.Record({
    'endDate' : IDL.Text,
    'endValue' : IDL.Float64,
    'startValue' : IDL.Float64,
    'annualReturn' : IDL.Float64,
    'totalReturn' : IDL.Float64,
    'startDate' : IDL.Text,
  });
  const PortfolioSummary = IDL.Record({
    'totalValue' : IDL.Float64,
    'weightedChange24h' : IDL.Float64,
    'totalChange24h' : IDL.Float64,
    'assetCount' : IDL.Nat,
  });
  const YieldProjection = IDL.Record({
    'annualYieldIcp' : IDL.Float64,
    'annualYieldNok' : IDL.Float64,
    'annualYieldUsd' : IDL.Float64,
    'monthlyYieldIcp' : IDL.Float64,
    'monthlyYieldNok' : IDL.Float64,
    'monthlyYieldUsd' : IDL.Float64,
    'icpPrice' : IDL.Float64,
  });
  const Time = IDL.Int;
  const ApiStatus = IDL.Record({
    'status' : IDL.Text,
    'message' : IDL.Text,
    'timestamp' : Time,
  });
  const Asset = IDL.Record({
    'id' : IDL.Text,
    'apiStatus' : IDL.Text,
    'name' : IDL.Text,
    'type' : IDL.Text,
    'customPrice' : IDL.Opt(IDL.Float64),
    'isStaked' : IDL.Bool,
    'priceChange24h' : IDL.Float64,
    'quantity' : IDL.Float64,
    'annualYield' : IDL.Float64,
    'price' : IDL.Float64,
    'stakedAmount' : IDL.Float64,
  });
  const ExchangeRate = IDL.Record({
    'status' : IDL.Text,
    'source' : IDL.Text,
    'rate' : IDL.Float64,
    'message' : IDL.Text,
    'timestamp' : Time,
  });
  const HistoricalDataPoint = IDL.Record({
    'value' : IDL.Float64,
    'date' : IDL.Text,
  });
  const http_header = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const http_request_result = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  const TransformationInput = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : http_request_result,
  });
  const TransformationOutput = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(http_header),
  });
  return IDL.Service({
    'addHistoricalDataPoint' : IDL.Func([IDL.Text, IDL.Float64], [], []),
    'addMonthlyDataPoint' : IDL.Func([IDL.Text, IDL.Float64], [], []),
    'cachePriceData' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'calculatePortfolioReturn' : IDL.Func([], [PortfolioReturn], ['query']),
    'calculatePortfolioSummary' : IDL.Func([], [PortfolioSummary], ['query']),
    'calculateStakedYield' : IDL.Func([], [IDL.Float64], []),
    'calculateTotalPortfolioValue' : IDL.Func([], [IDL.Float64], []),
    'calculateYieldProjection' : IDL.Func([], [YieldProjection], ['query']),
    'deleteHistoricalDataPoint' : IDL.Func([IDL.Text], [], []),
    'deleteMonthlyDataPoint' : IDL.Func([IDL.Text], [], []),
    'fetchCryptoPrices' : IDL.Func([], [IDL.Text], []),
    'fetchExchangeRates' : IDL.Func([], [IDL.Text], []),
    'fetchStockPrices' : IDL.Func([], [IDL.Text], []),
    'getApiStatus' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, ApiStatus))],
        ['query'],
      ),
    'getAssetCount' : IDL.Func([], [IDL.Text], ['query']),
    'getAssets' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, Asset))],
        ['query'],
      ),
    'getCachedPrices' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getExchangeRate' : IDL.Func([], [ExchangeRate], ['query']),
    'getHistoricalData' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, HistoricalDataPoint))],
        ['query'],
      ),
    'getIcpPriceSlider' : IDL.Func([], [IDL.Float64], ['query']),
    'getLastUpdateTime' : IDL.Func([], [IDL.Text], ['query']),
    'getPriceCacheSize' : IDL.Func([], [IDL.Text], ['query']),
    'getUserPreferences' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getUserPreferencesCount' : IDL.Func([], [IDL.Text], ['query']),
    'resetHistoricalData' : IDL.Func([], [], []),
    'resetMonthlyData' : IDL.Func([], [], []),
    'resetToDefault' : IDL.Func([], [], []),
    'setIcpPriceSlider' : IDL.Func([IDL.Float64], [], []),
    'setUserPreference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'transform' : IDL.Func(
        [TransformationInput],
        [TransformationOutput],
        ['query'],
      ),
    'updateAllPrices' : IDL.Func([], [], []),
    'updateApiStatus' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
    'updateAssetPrice' : IDL.Func(
        [IDL.Text, IDL.Float64, IDL.Float64, IDL.Text],
        [],
        [],
      ),
    'updateAssetQuantity' : IDL.Func([IDL.Text, IDL.Float64], [IDL.Bool], []),
    'updateCustomPrice' : IDL.Func([IDL.Text, IDL.Float64], [IDL.Bool], []),
    'updateExchangeRate' : IDL.Func([], [], []),
    'updateHistoricalDataPoint' : IDL.Func([IDL.Text, IDL.Float64], [], []),
    'updateHistoricalWithCurrentTotal' : IDL.Func([IDL.Text], [], []),
    'updateLastFetchTime' : IDL.Func([], [], []),
    'updateMonthlyDataPoint' : IDL.Func([IDL.Text, IDL.Float64], [], []),
    'verifyAndCorrectTotalValue' : IDL.Func([], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
