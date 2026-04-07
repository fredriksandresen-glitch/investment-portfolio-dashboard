import React, { Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import PortfolioOverview from '@/components/PortfolioOverview';
import ScenarioAnalysis from '@/components/ScenarioAnalysis';
import HistoricalPerformance from '@/components/HistoricalPerformance';
import MonthlyYield from '@/components/MonthlyYield';
import RiskMetrics from '@/components/RiskMetrics';
import NewsSection from '@/components/NewsSection';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useDailyHistoryAppend } from '@/hooks/useDailyHistoryAppend';
import { RootErrorBoundary } from '@/components/RootErrorBoundary';
import { FatalErrorScreen } from '@/components/FatalErrorScreen';
import { GlobalErrorStateProvider } from '@/components/GlobalErrorState';
import { GlobalErrorBanner } from '@/components/GlobalErrorBanner';
import { useGlobalErrorCapture } from '@/hooks/useGlobalErrorCapture';
import { SafeAppShell } from '@/components/SafeAppShell';

function DashboardContent() {
  const [assetFilter, setAssetFilter] = useState<'all' | 'crypto' | 'stocks'>('all');
  
  // Initialize daily history tracking (safe - won't throw)
  useDailyHistoryAppend();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header assetFilter={assetFilter} onFilterChange={setAssetFilter} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <PortfolioOverview assetFilter={assetFilter} />
        
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analysis">Scenario Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="yield">Monthly Yield</TabsTrigger>
            <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-6">
            <ScenarioAnalysis />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <HistoricalPerformance assetFilter={assetFilter} />
          </TabsContent>
          
          <TabsContent value="yield" className="space-y-6">
            <MonthlyYield />
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-6">
            <RiskMetrics />
          </TabsContent>
          
          <TabsContent value="news" className="space-y-6">
            <NewsSection />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      <Toaster />
    </div>
  );
}

function AppWithErrorCapture() {
  // Capture global errors and unhandled rejections
  useGlobalErrorCapture();

  return (
    <>
      <GlobalErrorBanner />
      <Suspense fallback={<SafeAppShell />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <RootErrorBoundary
      fallback={(error, errorInfo, reset) => (
        <FatalErrorScreen error={error} errorInfo={errorInfo} onReset={reset} />
      )}
    >
      <GlobalErrorStateProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AppWithErrorCapture />
        </ThemeProvider>
      </GlobalErrorStateProvider>
    </RootErrorBoundary>
  );
}
