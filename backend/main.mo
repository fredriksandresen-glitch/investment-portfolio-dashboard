import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import OutCall "http-outcalls/outcall";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Principal "mo:base/Principal";
import AccessControl "authorization/access-control";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Array "mo:base/Array";
import Iter "mo:base/Iter";



actor InvestmentDashboard {
  type Asset = {
    id : Text;
    name : Text;
    quantity : Float;
    price : Float;
    type_ : Text;
    isStaked : Bool;
    stakedAmount : Float;
    annualYield : Float;
    customPrice : ?Float;
    priceChange24h : Float;
    apiStatus : Text;
    lastUpdated : Time.Time;
  };

  type ApiStatus = {
    status : Text;
    timestamp : Time.Time;
    message : Text;
  };

  type HistoricalDataPoint = {
    date : Text;
    value : Float;
  };

  type ExchangeRate = {
    rate : Float;
    timestamp : Time.Time;
    source : Text;
    status : Text;
    message : Text;
  };

  type UserProfile = {
    name : Text;
    displayCurrency : Text;
    themePreference : Text;
  };

  type UserPortfolio = {
    assets : [Asset];
    historicalData : [HistoricalDataPoint];
    lastModified : Time.Time;
    totalValue : Float;
    annualReturn : Float;
    totalChange24h : Float;
  };

  type HistoricalData = {
    dataPoints : [HistoricalDataPoint];
    lastModified : Time.Time;
    validationStatus : Text;
  };

  type DailyHistoryState = {
    lastRecordedDate : Text;
    lastRecordedTimestamp : Time.Time;
  };

  let storage = Storage.new();
  include MixinStorage(storage);

  // Initialize access control
  let accessControlState = AccessControl.initState();

  // Map helpers
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var priceCache : OrderedMap.Map<Text, Text> = textMap.empty<Text>();
  var apiStatus : OrderedMap.Map<Text, ApiStatus> = textMap.empty<ApiStatus>();
  var lastUpdate : Time.Time = 0;
  var exchangeRate : ExchangeRate = {
    rate = 9.96;
    timestamp = 0;
    source = "default";
    status = "fallback";
    message = "Default exchange rate";
  };

  // Default asset configuration
  let defaultAssets : [Asset] = [
    {
      id = "ICP";
      name = "Internet Computer";
      quantity = 15500.0;
      price = 4.36;
      type_ = "crypto";
      isStaked = true;
      stakedAmount = 8500.0;
      annualYield = 14.2;
      customPrice = null;
      priceChange24h = 2.40;
      apiStatus = "fallback";
      lastUpdated = Time.now();
    },
    {
      id = "BTC";
      name = "Bitcoin";
      quantity = 0.09;
      price = 118632.0;
      type_ = "crypto";
      isStaked = false;
      stakedAmount = 0.0;
      annualYield = 0.0;
      customPrice = null;
      priceChange24h = 1.89;
      apiStatus = "fallback";
      lastUpdated = Time.now();
    },
    {
      id = "SPX";
      name = "SPX6900";
      quantity = 1000.0;
      price = 1.11;
      type_ = "crypto";
      isStaked = false;
      stakedAmount = 0.0;
      annualYield = 0.0;
      customPrice = null;
      priceChange24h = 19.20;
      apiStatus = "fallback";
      lastUpdated = Time.now();
    },
    {
      id = "BMNR";
      name = "Bitdeer Technologies";
      quantity = 700.0;
      price = 52.59;
      type_ = "stock";
      isStaked = false;
      stakedAmount = 0.0;
      annualYield = 0.0;
      customPrice = null;
      priceChange24h = -2.42;
      apiStatus = "fallback";
      lastUpdated = Time.now();
    },
    {
      id = "MSTR";
      name = "MicroStrategy";
      quantity = 9.0;
      price = 322.21;
      type_ = "stock";
      isStaked = false;
      stakedAmount = 0.0;
      annualYield = 0.0;
      customPrice = null;
      priceChange24h = 0.0;
      apiStatus = "fallback";
      lastUpdated = Time.now();
    },
    {
      id = "SBET";
      name = "SharpLink Gaming";
      quantity = 653.0;
      price = 17.26;
      type_ = "stock";
      isStaked = false;
      stakedAmount = 0.0;
      annualYield = 0.0;
      customPrice = null;
      priceChange24h = 7.88;
      apiStatus = "fallback";
      lastUpdated = Time.now();
    },
  ];

  let defaultHistoricalData : [HistoricalDataPoint] = [
    { date = "2024-01-23"; value = 276582.0 },
    { date = "2024-02-27"; value = 393238.0 },
    { date = "2024-03-25"; value = 512416.0 },
    { date = "2024-07-05"; value = 983495.0 },
    { date = "2024-09-11"; value = 1113401.0 },
    { date = "2024-10-23"; value = 1308072.0 },
    { date = "2024-11-22"; value = 1802928.0 },
    { date = "2025-02-04"; value = 1622377.0 },
    { date = "2025-03-15"; value = 1256164.0 },
    { date = "2025-04-15"; value = 1444567.0 },
    { date = "2025-05-15"; value = 1296673.0 },
  ];

  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty<UserProfile>();
  var userPortfolios : OrderedMap.Map<Principal, UserPortfolio> = principalMap.empty<UserPortfolio>();
  var historicalData : HistoricalData = {
    dataPoints = defaultHistoricalData;
    lastModified = Time.now();
    validationStatus = "default-loaded";
  };

  var dailyHistoryState : DailyHistoryState = {
    lastRecordedDate = "unknown";
    lastRecordedTimestamp = 0;
  };

  // ============================================================================
  // ACCESS CONTROL FUNCTIONS
  // ============================================================================

  public shared ({ caller }) func initializeAccessControl() : async () {
    Debug.print("Access control initialized for caller: " # debug_show (caller));
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ============================================================================
  // USER PROFILE FUNCTIONS (User-level access)
  // ============================================================================

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // ============================================================================
  // USER PORTFOLIO FUNCTIONS (User-level access)
  // ============================================================================

  public query ({ caller }) func getCallerPortfolio() : async UserPortfolio {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access portfolios");
    };

    switch (principalMap.get(userPortfolios, caller)) {
      case (?portfolio) { portfolio };
      case null {
        // Return default portfolio for new users
        {
          assets = defaultAssets;
          historicalData = historicalData.dataPoints;
          lastModified = Time.now();
          totalValue = 0.0;
          annualReturn = 0.0;
          totalChange24h = 0.0;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerPortfolio(portfolio : UserPortfolio) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save portfolios");
    };
    userPortfolios := principalMap.put(userPortfolios, caller, portfolio);
  };

  public shared ({ caller }) func updateAssetQuantity(assetId : Text, newQuantity : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update their portfolio");
    };

    let currentPortfolio = switch (principalMap.get(userPortfolios, caller)) {
      case (?p) { p };
      case null {
        {
          assets = defaultAssets;
          historicalData = historicalData.dataPoints;
          lastModified = Time.now();
          totalValue = 0.0;
          annualReturn = 0.0;
          totalChange24h = 0.0;
        };
      };
    };

    let updatedAssets = Array.map<Asset, Asset>(
      currentPortfolio.assets,
      func(asset : Asset) : Asset {
        if (asset.id == assetId) {
          {
            id = asset.id;
            name = asset.name;
            quantity = newQuantity;
            price = asset.price;
            type_ = asset.type_;
            isStaked = asset.isStaked;
            stakedAmount = asset.stakedAmount;
            annualYield = asset.annualYield;
            customPrice = asset.customPrice;
            priceChange24h = asset.priceChange24h;
            apiStatus = asset.apiStatus;
            lastUpdated = Time.now();
          };
        } else {
          asset;
        };
      },
    );

    let updatedPortfolio = {
      assets = updatedAssets;
      historicalData = currentPortfolio.historicalData;
      lastModified = Time.now();
      totalValue = 0.0;
      annualReturn = 0.0;
      totalChange24h = 0.0;
    };

    userPortfolios := principalMap.put(userPortfolios, caller, updatedPortfolio);
  };

  public shared ({ caller }) func updateAssetCustomPrice(assetId : Text, customPrice : ?Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update their portfolio");
    };

    let currentPortfolio = switch (principalMap.get(userPortfolios, caller)) {
      case (?p) { p };
      case null {
        {
          assets = defaultAssets;
          historicalData = historicalData.dataPoints;
          lastModified = Time.now();
          totalValue = 0.0;
          annualReturn = 0.0;
          totalChange24h = 0.0;
        };
      };
    };

    let updatedAssets = Array.map<Asset, Asset>(
      currentPortfolio.assets,
      func(asset : Asset) : Asset {
        if (asset.id == assetId) {
          {
            id = asset.id;
            name = asset.name;
            quantity = asset.quantity;
            price = asset.price;
            type_ = asset.type_;
            isStaked = asset.isStaked;
            stakedAmount = asset.stakedAmount;
            annualYield = asset.annualYield;
            customPrice;
            priceChange24h = asset.priceChange24h;
            apiStatus = asset.apiStatus;
            lastUpdated = Time.now();
          };
        } else {
          asset;
        };
      },
    );

    let updatedPortfolio = {
      assets = updatedAssets;
      historicalData = currentPortfolio.historicalData;
      lastModified = Time.now();
      totalValue = 0.0;
      annualReturn = 0.0;
      totalChange24h = 0.0;
    };

    userPortfolios := principalMap.put(userPortfolios, caller, updatedPortfolio);
  };

  public shared ({ caller }) func resetPortfolioToDefaults() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can reset their portfolio");
    };

    let defaultPortfolio = {
      assets = defaultAssets;
      historicalData = historicalData.dataPoints;
      lastModified = Time.now();
      totalValue = 0.0;
      annualReturn = 0.0;
      totalChange24h = 0.0;
    };

    userPortfolios := principalMap.put(userPortfolios, caller, defaultPortfolio);
  };

  // ============================================================================
  // DAILY HISTORY TRACKING (Admin-only - modifies global historical data)
  // ============================================================================

  func extractDateFromTimestamp(timestamp : Time.Time) : Text {
    let nanosPerDay : Int = 24 * 60 * 60 * 1000000000;
    let nowNanos : Int = timestamp % nanosPerDay;

    let hours = (nowNanos / 1000000000) / 3600;
    let minutes = (nowNanos / 1000000000) / 60 % 60;
    Debug.print("Current time " # debug_show (hours) # ":" # debug_show (minutes) # " nanos " # debug_show (nowNanos));

    // Offset to Europe/Oslo (CET/CEST) is UTC+1 = 1 hour = 3600s = 3.6e12 nano
    let localNanos = nowNanos + 1 * 3600_000_000_000;

    // Format nano timestamp as iso-date (yyyy-MM-dd) in Norway timezone
    let currentTime = Int.abs(localNanos) / 1000000000;
    let days = currentTime / (24 * 3600);
    let nanoDay = days * 24 * 3600 * 1000000000;
    let date = Int.abs(nanoDay) / 1000000000;
    Int.toText(date);
  };

  public shared ({ caller }) func checkAndAppendDailyHistoricalPoint() : async () {
    // CRITICAL: This function modifies global historical data and all user portfolios
    // Only admins or the system itself should be able to trigger this
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can append daily historical points");
    };

    // Extract current date from timestamp and compare to last recorded date
    let currentDate : Text = extractDateFromTimestamp(Time.now());

    // Only append new point if current date is different from last recorded
    if (currentDate != dailyHistoryState.lastRecordedDate) {

      // Calculate current portfolio value (in USD)
      var totalValue : Float = 0.0;
      for (asset in defaultAssets.vals()) {
        let effectivePrice = switch (asset.customPrice) {
          case (?custom) { custom };
          case null { asset.price };
        };
        totalValue += asset.quantity * effectivePrice;
      };

      // Add new historical point to shared historical data
      let buffer = Buffer.Buffer<HistoricalDataPoint>(historicalData.dataPoints.size() + 1);
      for (point in historicalData.dataPoints.vals()) {
        buffer.add(point);
      };
      buffer.add({ date = currentDate; value = totalValue });

      historicalData := {
        dataPoints = Buffer.toArray(buffer);
        lastModified = Time.now();
        validationStatus = "daily-tracking";
      };

      // Add new historical point to each user's portfolio
      for ((user, portfolio) in principalMap.entries(userPortfolios)) {
        let userBuffer = Buffer.Buffer<HistoricalDataPoint>(portfolio.historicalData.size() + 1);
        for (point in portfolio.historicalData.vals()) {
          userBuffer.add(point);
        };
        userBuffer.add({
          date = currentDate;
          value = totalValue; // Use same value for all users for now
        });

        let updatedPortfolio = {
          assets = portfolio.assets;
          historicalData = Buffer.toArray(userBuffer);
          lastModified = Time.now();
          totalValue = portfolio.totalValue;
          annualReturn = portfolio.annualReturn;
          totalChange24h = portfolio.totalChange24h;
        };

        userPortfolios := principalMap.put(userPortfolios, user, updatedPortfolio);
      };

      // Update last recorded date in daily state
      dailyHistoryState := {
        lastRecordedDate = currentDate;
        lastRecordedTimestamp = Time.now();
      };
      Debug.print("Daily historical point appended for date " # currentDate # " with value = " # debug_show (totalValue));
    };
  };

  // ============================================================================
  // PUBLIC QUERY FUNCTIONS (Guest access allowed - read-only public data)
  // ============================================================================

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query func getSharedHistoricalData() : async [HistoricalDataPoint] {
    historicalData.dataPoints;
  };

  public query func getExchangeRate() : async ExchangeRate {
    exchangeRate;
  };

  public query func getDefaultAssets() : async [Asset] {
    defaultAssets;
  };

  public query func healthCheck() : async Text {
    "READY";
  };

  // ============================================================================
  // ADMIN QUERY FUNCTIONS (Admin-only - internal system status)
  // ============================================================================

  public query ({ caller }) func getApiStatus() : async [(Text, ApiStatus)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view API status");
    };
    Iter.toArray(textMap.entries(apiStatus));
  };

  public query ({ caller }) func getLastUpdateTime() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view update time");
    };
    Int.toText(lastUpdate);
  };

  public query ({ caller }) func getExchangeRateStatus() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view exchange rate status");
    };
    exchangeRate.status;
  };

  public query ({ caller }) func getDailyTrackingStatus() : async DailyHistoryState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view daily tracking status");
    };
    dailyHistoryState;
  };

  // ============================================================================
  // CALCULATION HELPER FUNCTIONS (User-level access)
  // ============================================================================

  public query ({ caller }) func calculateTotalPortfolioValue(assets : [Asset]) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can calculate portfolio values");
    };

    var total : Float = 0.0;
    for (asset in assets.vals()) {
      let effectivePrice = switch (asset.customPrice) {
        case (?custom) { custom };
        case null { asset.price };
      };
      total += asset.quantity * effectivePrice;
    };
    total;
  };

  public query ({ caller }) func calculateAnnualReturn(currentValue : Float) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can calculate annual returns");
    };

    // Using weighted average approach for annual return
    let samplePoints = [
      1308072.0, // 23/10/2024
      1802928.0, // 22/11/2024
      1622377.0, // 04/02/2025
      1256164.0, // 15/03/2025
      1444567.0, // 15/04/2025
      1296673.0, // 15/05/2025
    ];

    let oldValue = Array.foldLeft<Float, Float>(
      samplePoints,
      0.0,
      func(acc, val) { acc + val },
    ) / Float.fromInt(samplePoints.size());

    let returnRate = (currentValue - oldValue) / oldValue;
    returnRate * 100.0; // Convert to percentage
  };

  public query ({ caller }) func calculatePortfolioChange24h(assets : [Asset]) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can calculate portfolio changes");
    };

    // Weighted average of 24h changes
    var totalValue : Float = 0.0;
    var weightedSum : Float = 0.0;

    for (asset in assets.vals()) {
      let effectivePrice = switch (asset.customPrice) {
        case (?custom) { custom };
        case null { asset.price };
      };
      let value = asset.quantity * effectivePrice;
      totalValue += value;
      weightedSum += value * asset.priceChange24h;
    };

    if (totalValue == 0.0) {
      0.0;
    } else {
      weightedSum / totalValue;
    };
  };

  // ============================================================================
  // ADMIN DATA MANAGEMENT FUNCTIONS (admin-only access)
  // ============================================================================

  public shared ({ caller }) func addSharedHistoricalDataPoint(date : Text, value : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add historical data points");
    };

    let buffer = Buffer.Buffer<HistoricalDataPoint>(historicalData.dataPoints.size() + 1);
    for (point in historicalData.dataPoints.vals()) {
      buffer.add(point);
    };
    buffer.add({ date; value });

    historicalData := {
      dataPoints = Buffer.toArray(buffer);
      lastModified = Time.now();
      validationStatus = "updated";
    };
    Debug.print("Shared historical data point added for date = " # date # " value = " # debug_show (value));
  };

  public shared ({ caller }) func updateApiStatus(assetId : Text, status : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update API status");
    };

    let newStatus = {
      status;
      timestamp = Time.now();
      message;
    };
    apiStatus := textMap.put(apiStatus, assetId, newStatus);
  };

  public shared ({ caller }) func cachePriceData(asset : Text, data : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can cache price data");
    };

    priceCache := textMap.put(priceCache, asset, data);
  };

  public shared ({ caller }) func updateLastFetchTime() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update fetch time");
    };

    lastUpdate := Time.now();
  };

  public shared ({ caller }) func setExchangeRate(rate : Float, source : Text, status : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can set exchange rate");
    };

    exchangeRate := {
      rate;
      timestamp = Time.now();
      source;
      status;
      message;
    };
  };

  // ============================================================================
  // SYSTEM FUNCTIONS (admin-only access for external API calls)
  // ============================================================================

  public shared ({ caller }) func fetchCryptoPrices() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can fetch crypto prices");
    };

    let url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,internet-computer,spx6900&vs_currencies=usd&include_24hr_change=true";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchStockPrices() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can fetch stock prices");
    };

    let url = "https://finnhub.io/api/v1/quote?symbol=BMNR&token=d3fsbq9r01qqbh542lbgd3fsbq9r01qqbh542lc0";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchExchangeRates() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can fetch exchange rates");
    };

    let url = "https://api.exchangerate-api.com/v4/latest/USD";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func updateAllPrices() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update all prices");
    };

    ignore await fetchCryptoPrices();
    ignore await fetchStockPrices();
    ignore await fetchExchangeRates();
    lastUpdate := Time.now();
    Debug.print("All prices updated at " # Int.toText(lastUpdate));
  };
};
