import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Bot, Brain, Play, Square, Zap, TrendingUp, Shield, Activity } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AutoTrading() {
  const { user, loading } = useAuth();
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [isGenerating, setIsGenerating] = useState(false);

  const utils = trpc.useUtils();
  
  const { data: portfolio } = trpc.portfolio.get.useQuery();
  const { data: autoStatus } = trpc.autoGenerate.getAutoTradingStatus.useQuery();
  const { data: strategies } = trpc.strategies.list.useQuery();

  const syncMT5Mutation = trpc.portfolio.syncWithMT5.useMutation({
    onSuccess: (data) => {
      toast.success(`MT5 synced! Balance: $${data.balance.toLocaleString()}`);
      utils.portfolio.get.invalidate();
    },
    onError: (error) => {
      toast.error(`MT5 sync failed: ${error.message}`);
    },
  });

  const generateStrategiesMutation = trpc.autoGenerate.generateStrategies.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.strategies.list.invalidate();
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(`Failed to generate strategies: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const startAutoTradingMutation = trpc.autoGenerate.startAutoTrading.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.autoGenerate.getAutoTradingStatus.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to start auto trading: ${error.message}`);
    },
  });

  const stopAutoTradingMutation = trpc.autoGenerate.stopAutoTrading.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.autoGenerate.getAutoTradingStatus.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to stop auto trading: ${error.message}`);
    },
  });

  const handleGenerateStrategies = () => {
    setIsGenerating(true);
    generateStrategiesMutation.mutate({ riskTolerance });
  };

  const handleStartAutoTrading = () => {
    startAutoTradingMutation.mutate();
  };

  const handleStopAutoTrading = () => {
    stopAutoTradingMutation.mutate();
  };

  const handleSyncMT5 = () => {
    syncMT5Mutation.mutate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeStrategies = strategies?.filter(s => s.status === "active").length || 0;
  const isAutoTradingActive = autoStatus?.running || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Bot className="h-5 w-5" />
                Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Auto Trading
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio ? parseFloat(portfolio.balance).toLocaleString() : "0"}
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={handleSyncMT5}
                disabled={syncMT5Mutation.isPending}
              >
                {syncMT5Mutation.isPending ? "Syncing..." : "Sync with MT5"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Strategies</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStrategies}</div>
              <p className="text-xs text-muted-foreground">
                Total: {strategies?.length || 0} strategies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto Trading Status</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isAutoTradingActive ? "text-green-600" : "text-gray-400"}`}>
                {isAutoTradingActive ? "ACTIVE" : "STOPPED"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAutoTradingActive ? "Bot is trading" : "Bot is idle"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Auto Strategy Generation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI Strategy Generator
            </CardTitle>
            <CardDescription>
              Automatically generate individual optimized strategies for EACH trading pair (15 pairs total) based on the best techniques for that specific pair
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Risk Tolerance</label>
                <Select value={riskTolerance} onValueChange={(v: any) => setRiskTolerance(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (Lower Risk)</SelectItem>
                    <SelectItem value="moderate">Moderate (Balanced)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (Higher Risk)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {riskTolerance === "conservative" && "Smaller positions, lower drawdown tolerance"}
                  {riskTolerance === "moderate" && "Balanced risk/reward ratio"}
                  {riskTolerance === "aggressive" && "Larger positions, higher profit potential"}
                </p>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerateStrategies}
                  disabled={isGenerating || generateStrategiesMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating || generateStrategiesMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Strategies...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate 15 Individual Strategies
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                What You'll Get:
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>7 Forex Strategies</strong> - Individual strategies for EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, USDCAD, NZDUSD</li>
                <li>• <strong>8 Crypto Strategies</strong> - Individual strategies for BTC, ETH, BNB, SOL, ADA, XRP, DOGE, MATIC</li>
                <li>• <strong>15 Total Strategies</strong> - Each pair gets its own optimized algorithm (momentum, breakout, scalping, swing, ML, etc.)</li>
                <li>• <strong>Best Techniques</strong> - Algorithm selected based on pair volatility, trend, and liquidity characteristics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Auto Trading Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Automated Trading Engine
            </CardTitle>
            <CardDescription>
              Start auto-trading to automatically generate signals and execute trades when confidence ≥ 80%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div>
                <h4 className="font-semibold mb-1">Auto Trading Engine</h4>
                <p className="text-sm text-muted-foreground">
                  {isAutoTradingActive
                    ? "Bot is actively scanning markets and executing high-confidence trades"
                    : "Start the engine to begin automated trading"}
                </p>
              </div>
              <div className="flex gap-2">
                {!isAutoTradingActive ? (
                  <Button
                    onClick={handleStartAutoTrading}
                    disabled={startAutoTradingMutation.isPending || activeStrategies === 0}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Auto Trading
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopAutoTrading}
                    disabled={stopAutoTradingMutation.isPending}
                    size="lg"
                    variant="destructive"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Auto Trading
                  </Button>
                )}
              </div>
            </div>

            {activeStrategies === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You need at least one active strategy before starting auto trading.
                  Generate strategies above or create your own.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-semibold text-sm mb-1">Risk Protected</h4>
                <p className="text-xs text-muted-foreground">
                  All trades follow your risk management rules
                </p>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <Brain className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-semibold text-sm mb-1">AI-Powered</h4>
                <p className="text-xs text-muted-foreground">
                  Advanced algorithms analyze markets 24/7
                </p>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <Zap className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-semibold text-sm mb-1">Auto Execution</h4>
                <p className="text-xs text-muted-foreground">
                  Trades execute instantly when confidence ≥ 80%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

