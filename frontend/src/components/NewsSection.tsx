import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Clock, TrendingUp } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  asset: string;
}

// Mock news data
const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin Reaches New Monthly High Amid Institutional Adoption',
    summary: 'Bitcoin surged to a new monthly high as major institutions continue to add cryptocurrency to their portfolios.',
    source: 'CoinDesk',
    publishedAt: '2024-01-15T10:30:00Z',
    url: '#',
    sentiment: 'positive',
    asset: 'BTC'
  },
  {
    id: '2',
    title: 'SPX Memecoin Shows Strong Performance in Q4',
    summary: 'SPX memecoin demonstrates resilience with steady growth throughout the fourth quarter.',
    source: 'CoinTelegraph',
    publishedAt: '2024-01-15T08:15:00Z',
    url: '#',
    sentiment: 'positive',
    asset: 'SPX'
  },
  {
    id: '3',
    title: 'Internet Computer Protocol Announces Major Partnership',
    summary: 'ICP announces strategic partnership with leading cloud provider to expand decentralized computing capabilities.',
    source: 'Decrypt',
    publishedAt: '2024-01-14T16:45:00Z',
    url: '#',
    sentiment: 'positive',
    asset: 'ICP'
  },
  {
    id: '4',
    title: 'BMNR Reports Strong Q4 Earnings, Beats Expectations',
    summary: 'BMNR reported quarterly earnings that exceeded analyst expectations, driven by strong operational performance.',
    source: 'Reuters',
    publishedAt: '2024-01-14T14:20:00Z',
    url: '#',
    sentiment: 'positive',
    asset: 'BMNR'
  },
  {
    id: '5',
    title: 'MicroStrategy Stock Volatility Continues Amid Bitcoin Holdings',
    summary: 'MSTR shares experienced volatility as investors weigh Bitcoin exposure against operational performance.',
    source: 'Bloomberg',
    publishedAt: '2024-01-14T12:00:00Z',
    url: '#',
    sentiment: 'neutral',
    asset: 'MSTR'
  },
  {
    id: '6',
    title: 'SharpLink Gaming (SBET) Expands Gaming Portfolio',
    summary: 'SBET announces expansion into new gaming markets with strategic acquisitions and partnerships.',
    source: 'Gaming Business',
    publishedAt: '2024-01-13T18:30:00Z',
    url: '#',
    sentiment: 'positive',
    asset: 'SBET'
  }
];

export default function NewsSection() {
  const [selectedAsset, setSelectedAsset] = useState<string>('all');

  const filteredNews = selectedAsset === 'all' 
    ? mockNews 
    : mockNews.filter(news => news.asset === selectedAsset);

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Positive</Badge>;
      case 'negative':
        return <Badge variant="destructive">Negative</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const assets = ['all', 'BTC', 'ICP', 'SPX', 'BMNR', 'MSTR', 'SBET'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Market News & Analysis</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest news and updates for your portfolio assets
          </p>
        </CardHeader>
      </Card>

      <Tabs value={selectedAsset} onValueChange={setSelectedAsset} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {assets.map((asset) => (
            <TabsTrigger key={asset} value={asset}>
              {asset === 'all' ? 'All' : asset}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedAsset} className="space-y-4">
          {filteredNews.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No news available for this asset</p>
              </CardContent>
            </Card>
          ) : (
            filteredNews.map((news) => (
              <Card key={news.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{news.asset}</Badge>
                        {getSentimentBadge(news.sentiment)}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(news.publishedAt)}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold leading-tight">
                        {news.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {news.summary}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          Source: {news.source}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={news.url} target="_blank" rel="noopener noreferrer">
                            Read More
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* News Summary */}
      <Card>
        <CardHeader>
          <CardTitle>News Sentiment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Positive News</h4>
              <p className="text-2xl font-bold text-green-600">
                {mockNews.filter(n => n.sentiment === 'positive').length}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {((mockNews.filter(n => n.sentiment === 'positive').length / mockNews.length) * 100).toFixed(0)}% of total
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-950/20">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Neutral News</h4>
              <p className="text-2xl font-bold text-gray-600">
                {mockNews.filter(n => n.sentiment === 'neutral').length}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {((mockNews.filter(n => n.sentiment === 'neutral').length / mockNews.length) * 100).toFixed(0)}% of total
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Negative News</h4>
              <p className="text-2xl font-bold text-red-600">
                {mockNews.filter(n => n.sentiment === 'negative').length}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {((mockNews.filter(n => n.sentiment === 'negative').length / mockNews.length) * 100).toFixed(0)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
