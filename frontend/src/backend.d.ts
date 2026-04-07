import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface ExchangeRate {
    status: string;
    source: string;
    rate: number;
    message: string;
    timestamp: Time;
}
export interface UserPortfolio {
    totalValue: number;
    assets: Array<Asset>;
    lastModified: Time;
    historicalData: Array<HistoricalDataPoint>;
    annualReturn: number;
    totalChange24h: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface DailyHistoryState {
    lastRecordedDate: string;
    lastRecordedTimestamp: Time;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Asset {
    id: string;
    apiStatus: string;
    name: string;
    type: string;
    lastUpdated: Time;
    customPrice?: number;
    isStaked: boolean;
    priceChange24h: number;
    quantity: number;
    annualYield: number;
    price: number;
    stakedAmount: number;
}
export interface HistoricalDataPoint {
    value: number;
    date: string;
}
export interface ApiStatus {
    status: string;
    message: string;
    timestamp: Time;
}
export interface UserProfile {
    name: string;
    themePreference: string;
    displayCurrency: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSharedHistoricalDataPoint(date: string, value: number): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cachePriceData(asset: string, data: string): Promise<void>;
    calculateAnnualReturn(currentValue: number): Promise<number>;
    calculatePortfolioChange24h(assets: Array<Asset>): Promise<number>;
    calculateTotalPortfolioValue(assets: Array<Asset>): Promise<number>;
    checkAndAppendDailyHistoricalPoint(): Promise<void>;
    fetchCryptoPrices(): Promise<string>;
    fetchExchangeRates(): Promise<string>;
    fetchStockPrices(): Promise<string>;
    getApiStatus(): Promise<Array<[string, ApiStatus]>>;
    getCallerPortfolio(): Promise<UserPortfolio>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyTrackingStatus(): Promise<DailyHistoryState>;
    getDefaultAssets(): Promise<Array<Asset>>;
    getExchangeRate(): Promise<ExchangeRate>;
    getExchangeRateStatus(): Promise<string>;
    getLastUpdateTime(): Promise<string>;
    getSharedHistoricalData(): Promise<Array<HistoricalDataPoint>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    healthCheck(): Promise<string>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    resetPortfolioToDefaults(): Promise<void>;
    saveCallerPortfolio(portfolio: UserPortfolio): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setExchangeRate(rate: number, source: string, status: string, message: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAllPrices(): Promise<void>;
    updateApiStatus(assetId: string, status: string, message: string): Promise<void>;
    updateAssetCustomPrice(assetId: string, customPrice: number | null): Promise<void>;
    updateAssetQuantity(assetId: string, newQuantity: number): Promise<void>;
    updateLastFetchTime(): Promise<void>;
}
