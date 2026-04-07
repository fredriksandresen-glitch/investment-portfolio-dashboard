import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ApiStatus {
  'status' : string,
  'message' : string,
  'timestamp' : Time,
}
export interface Asset {
  'id' : string,
  'apiStatus' : string,
  'name' : string,
  'type' : string,
  'customPrice' : [] | [number],
  'isStaked' : boolean,
  'priceChange24h' : number,
  'quantity' : number,
  'annualYield' : number,
  'price' : number,
  'stakedAmount' : number,
}
export interface ExchangeRate {
  'status' : string,
  'source' : string,
  'rate' : number,
  'message' : string,
  'timestamp' : Time,
}
export interface HistoricalDataPoint { 'value' : number, 'date' : string }
export interface PortfolioReturn {
  'endDate' : string,
  'endValue' : number,
  'startValue' : number,
  'annualReturn' : number,
  'totalReturn' : number,
  'startDate' : string,
}
export interface PortfolioSummary {
  'totalValue' : number,
  'weightedChange24h' : number,
  'totalChange24h' : number,
  'assetCount' : bigint,
}
export type Time = bigint;
export interface TransformationInput {
  'context' : Uint8Array | number[],
  'response' : http_request_result,
}
export interface TransformationOutput {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface YieldProjection {
  'annualYieldIcp' : number,
  'annualYieldNok' : number,
  'annualYieldUsd' : number,
  'monthlyYieldIcp' : number,
  'monthlyYieldNok' : number,
  'monthlyYieldUsd' : number,
  'icpPrice' : number,
}
export interface http_header { 'value' : string, 'name' : string }
export interface http_request_result {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<http_header>,
}
export interface _SERVICE {
  'addHistoricalDataPoint' : ActorMethod<[string, number], undefined>,
  'addMonthlyDataPoint' : ActorMethod<[string, number], undefined>,
  'cachePriceData' : ActorMethod<[string, string], undefined>,
  'calculatePortfolioReturn' : ActorMethod<[], PortfolioReturn>,
  'calculatePortfolioSummary' : ActorMethod<[], PortfolioSummary>,
  'calculateStakedYield' : ActorMethod<[], number>,
  'calculateTotalPortfolioValue' : ActorMethod<[], number>,
  'calculateYieldProjection' : ActorMethod<[], YieldProjection>,
  'deleteHistoricalDataPoint' : ActorMethod<[string], undefined>,
  'deleteMonthlyDataPoint' : ActorMethod<[string], undefined>,
  'fetchCryptoPrices' : ActorMethod<[], string>,
  'fetchExchangeRates' : ActorMethod<[], string>,
  'fetchStockPrices' : ActorMethod<[], string>,
  'getApiStatus' : ActorMethod<[], Array<[string, ApiStatus]>>,
  'getAssetCount' : ActorMethod<[], string>,
  'getAssets' : ActorMethod<[], Array<[string, Asset]>>,
  'getCachedPrices' : ActorMethod<[], Array<[string, string]>>,
  'getExchangeRate' : ActorMethod<[], ExchangeRate>,
  'getHistoricalData' : ActorMethod<[], Array<[string, HistoricalDataPoint]>>,
  'getIcpPriceSlider' : ActorMethod<[], number>,
  'getLastUpdateTime' : ActorMethod<[], string>,
  'getPriceCacheSize' : ActorMethod<[], string>,
  'getUserPreferences' : ActorMethod<[], Array<[string, string]>>,
  'getUserPreferencesCount' : ActorMethod<[], string>,
  'resetHistoricalData' : ActorMethod<[], undefined>,
  'resetMonthlyData' : ActorMethod<[], undefined>,
  'resetToDefault' : ActorMethod<[], undefined>,
  'setIcpPriceSlider' : ActorMethod<[number], undefined>,
  'setUserPreference' : ActorMethod<[string, string], undefined>,
  'transform' : ActorMethod<[TransformationInput], TransformationOutput>,
  'updateAllPrices' : ActorMethod<[], undefined>,
  'updateApiStatus' : ActorMethod<[string, string, string], undefined>,
  'updateAssetPrice' : ActorMethod<[string, number, number, string], undefined>,
  'updateAssetQuantity' : ActorMethod<[string, number], boolean>,
  'updateCustomPrice' : ActorMethod<[string, number], boolean>,
  'updateExchangeRate' : ActorMethod<[], undefined>,
  'updateHistoricalDataPoint' : ActorMethod<[string, number], undefined>,
  'updateHistoricalWithCurrentTotal' : ActorMethod<[string], undefined>,
  'updateLastFetchTime' : ActorMethod<[], undefined>,
  'updateMonthlyDataPoint' : ActorMethod<[string, number], undefined>,
  'verifyAndCorrectTotalValue' : ActorMethod<[], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
