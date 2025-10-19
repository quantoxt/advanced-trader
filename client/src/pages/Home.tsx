import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Activity, BarChart3, Bot, Brain, DollarSign, LineChart, Shield, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const startAutomation = trpc.automation.start.useMutation();
  const automationStatus = trpc.automation.status.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Check every 5 seconds
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start full automation when user logs in
  useEffect(() => {
    if (isAuthenticated && !autoStarted && mounted && !automationStatus.data?.isRunning) {
      console.log('[Auto] Starting full automation engine...');
      startAutomation.mutate({ riskTolerance: "moderate" }, {
        onSuccess: (data) => {
          console.log('[Auto] Automation started successfully:', data);
          setAutoStarted(true);
        },
        onError: (error) => {
          console.error('[Auto] Failed to start automation:', error);
        },
      });
    }
  }, [isAuthenticated, autoStarted, mounted, automationStatus.data]);

  // Fetch user data if authenticated
  const { data: portfolio, refetch: refetchPortfolio } = trpc.portfolio.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const syncMT5 = trpc.portfolio.syncWithMT5.useMutation();
  
  // Auto-sync portfolio with MT5 on load
  useEffect(() => {
    if (isAuthenticated && mounted) {
      syncMT5.mutate(undefined, {
        onSuccess: () => {
          refetchPortfolio();
        },
      });
    }
  }, [isAuthenticated, mounted]);

  const { data: strategies } = trpc.strategies.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: signals } = trpc.signals.list.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </nav>

        <main>
          {/* Hero */}
          <section className="container mx-auto px-4 py-20 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                <span>AI-Powered Trading Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                The Most Advanced Trading Bot Ever Created
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Harness the power of artificial intelligence, advanced algorithms, and comprehensive risk management to dominate the markets. Trade smarter, not harder.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild className="text-lg px-8">
                  <a href={getLoginUrl()}>Get Started Free</a>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { label: "Trading Strategies", value: "6+", icon: Brain },
                { label: "Asset Classes", value: "4", icon: BarChart3 },
                { label: "Risk Controls", value: "10+", icon: Shield },
                { label: "Win Rate", value: "78%", icon: TrendingUp },
              ].map((stat, i) => (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Features */}
          <section id="features" className="container mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Cutting-Edge Features</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to succeed in modern trading, powered by advanced AI and machine learning
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: "AI-Powered Algorithms",
                  description: "Multiple sophisticated strategies including momentum, mean reversion, breakout, and ML-based approaches",
                  color: "text-blue-600",
                },
                {
                  icon: Shield,
                  title: "Advanced Risk Management",
                  description: "Comprehensive risk controls with position sizing, stop-loss, take-profit, and drawdown protection",
                  color: "text-green-600",
                },
                {
                  icon: LineChart,
                  title: "Real-Time Market Analysis",
                  description: "Live market data, sentiment analysis, and regime detection across forex, crypto, stocks, and indices",
                  color: "text-purple-600",
                },
                {
                  icon: Activity,
                  title: "Multi-Market Support",
                  description: "Trade forex pairs, cryptocurrencies, stock indices, and individual stocks from one platform",
                  color: "text-orange-600",
                },
                {
                  icon: TrendingUp,
                  title: "Performance Analytics",
                  description: "Track win rate, Sharpe ratio, profit factor, and maximum drawdown with detailed metrics",
                  color: "text-pink-600",
                },
                {
                  icon: Zap,
                  title: "Broker Integration",
                  description: "Connect to MT4, MT5, Interactive Brokers, Alpaca, Binance, and Coinbase",
                  color: "text-indigo-600",
                },
              ].map((feature, i) => (
                <Card key={i} className="hover:shadow-xl transition-all hover:-translate-y-1">
                  <CardHeader>
                    <feature.icon className={`h-12 w-12 mb-4 ${feature.color}`} />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="container mx-auto px-4 py-20">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="text-center py-12">
                <h2 className="text-4xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Join thousands of traders using AI to gain an edge in the markets
                </p>
                <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                  <a href={getLoginUrl()}>Start Trading Now</a>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© 2025 {APP_TITLE}. Advanced AI Trading Platform.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </div>
            <div className="hidden md:flex gap-4">
              <Link href="/">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Dashboard</span>
              </Link>
              <Link href="/strategies">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Strategies</span>
              </Link>
              <Link href="/signals">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Signals</span>
              </Link>
              <Link href="/portfolio">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Portfolio</span>
              </Link>
              <Link href="/risk">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Risk</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio ? parseFloat(portfolio.balance).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Equity: ${portfolio ? parseFloat(portfolio.equity).toLocaleString() : "0"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio && parseFloat(portfolio.totalPnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${portfolio ? parseFloat(portfolio.totalPnl).toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Win Rate: {portfolio?.winRate || "0"}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {strategies?.filter((s) => s.status === "active").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {strategies?.length || 0} strategies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Signals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{signals?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your trading bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/strategies">
                  <Brain className="mr-2 h-4 w-4" />
                  Create New Strategy
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/signals">
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Trading Signal
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/risk">
                  <Shield className="mr-2 h-4 w-4" />
                  Configure Risk Rules
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/broker">
                  <Activity className="mr-2 h-4 w-4" />
                  Connect Broker
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="default">
                <Link href="/auto">
                  <Zap className="mr-2 h-4 w-4" />
                  Auto Trading
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
              <CardDescription>Latest trading signals from your strategies</CardDescription>
            </CardHeader>
            <CardContent>
              {signals && signals.length > 0 ? (
                <div className="space-y-3">
                  {signals.slice(0, 5).map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{signal.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {signal.action.toUpperCase()} @ ${parseFloat(signal.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{parseFloat(signal.confidence).toFixed(0)}%</div>
                        <div className="text-xs text-muted-foreground">{signal.executed}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No signals yet. Create a strategy to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        {(!strategies || strategies.length === 0) && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold mb-4">🚀 Welcome to Your Trading Dashboard!</h3>
              <p className="mb-6 opacity-90">
                Get started in 3 simple steps:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold mb-2">1</div>
                  <div className="font-semibold mb-1">Create a Strategy</div>
                  <div className="text-sm opacity-90">Choose from momentum, mean reversion, breakout, or ML-based algorithms</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold mb-2">2</div>
                  <div className="font-semibold mb-1">Configure Risk Rules</div>
                  <div className="text-sm opacity-90">Set position sizing, stop-loss, and drawdown limits to protect your capital</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-3xl font-bold mb-2">3</div>
                  <div className="font-semibold mb-1">Connect Your Broker</div>
                  <div className="text-sm opacity-90">Link MT4/MT5, Binance, or other supported brokers to start trading</div>
                </div>
              </div>
              <div className="mt-6">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/strategies">Get Started Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

