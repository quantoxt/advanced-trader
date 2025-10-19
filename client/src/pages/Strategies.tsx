import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bot, Brain, Pause, Play, Plus, Settings, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Strategies() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: "",
    type: "momentum" as any,
    parameters: {} as any,
  });

  const utils = trpc.useUtils();
  const { data: strategies, isLoading } = trpc.strategies.list.useQuery();

  const createMutation = trpc.strategies.create.useMutation({
    onSuccess: () => {
      utils.strategies.list.invalidate();
      setIsCreateOpen(false);
      setNewStrategy({ name: "", type: "momentum", parameters: {} });
      toast.success("Strategy created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create strategy: ${error.message}`);
    },
  });

  const updateMutation = trpc.strategies.update.useMutation({
    onSuccess: () => {
      utils.strategies.list.invalidate();
      toast.success("Strategy updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update strategy: ${error.message}`);
    },
  });

  const deleteMutation = trpc.strategies.delete.useMutation({
    onSuccess: () => {
      utils.strategies.list.invalidate();
      toast.success("Strategy deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to delete strategy: ${error.message}`);
    },
  });

  const handleCreate = () => {
    const params = getDefaultParameters(newStrategy.type);
    createMutation.mutate({
      name: newStrategy.name,
      type: newStrategy.type,
      parameters: params,
    });
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateMutation.mutate({ id, status: newStatus as any });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this strategy?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getDefaultParameters = (type: string) => {
    switch (type) {
      case "momentum":
        return { fastPeriod: 12, slowPeriod: 26, rsiPeriod: 14 };
      case "mean_reversion":
        return { bbPeriod: 20, bbStdDev: 2, rsiPeriod: 14 };
      case "breakout":
        return { atrPeriod: 14, atrMultiplier: 2 };
      case "ml_based":
        return { lookbackPeriod: 100 };
      default:
        return {};
    }
  };

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case "momentum":
        return TrendingUp;
      case "mean_reversion":
        return Brain;
      case "breakout":
        return Bot;
      default:
        return Settings;
    }
  };

  const getStrategyDescription = (type: string) => {
    switch (type) {
      case "momentum":
        return "EMA crossover with RSI confirmation for trend following";
      case "mean_reversion":
        return "Bollinger Bands with RSI for oversold/overbought conditions";
      case "breakout":
        return "ATR-based volatility breakout detection";
      case "ml_based":
        return "Machine learning model combining multiple indicators";
      case "sentiment":
        return "Market sentiment analysis from news and social media";
      case "arbitrage":
        return "Cross-exchange price discrepancy exploitation";
      default:
        return "Custom trading strategy";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="flex items-center gap-2">
                <Bot className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {APP_TITLE}
                </span>
              </a>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Dashboard</span>
              </Link>
              <Link href="/strategies">
                <span className="text-sm font-medium text-primary cursor-pointer">Strategies</span>
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
          <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Trading Strategies</h1>
            <p className="text-muted-foreground">Create and manage your algorithmic trading strategies</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create Strategy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Strategy</DialogTitle>
                <DialogDescription>
                  Configure a new trading strategy with your preferred algorithm
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Strategy Name</Label>
                  <Input
                    id="name"
                    placeholder="My Momentum Strategy"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Algorithm Type</Label>
                  <Select value={newStrategy.type} onValueChange={(value) => setNewStrategy({ ...newStrategy, type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentum">Momentum (EMA + RSI)</SelectItem>
                      <SelectItem value="mean_reversion">Mean Reversion (Bollinger + RSI)</SelectItem>
                      <SelectItem value="breakout">Breakout (ATR-based)</SelectItem>
                      <SelectItem value="ml_based">ML-Based (Multi-indicator)</SelectItem>
                      <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                      <SelectItem value="arbitrage">Arbitrage</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">
                    {getStrategyDescription(newStrategy.type)}
                  </p>
                </div>
                <Button onClick={handleCreate} disabled={!newStrategy.name || createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Creating..." : "Create Strategy"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Strategies Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading strategies...</p>
          </div>
        ) : strategies && strategies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => {
              const Icon = getStrategyIcon(strategy.type);
              const isActive = strategy.status === "active";

              return (
                <Card key={strategy.id} className={`hover:shadow-lg transition-all ${isActive ? "border-green-500 border-2" : ""}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isActive ? "bg-green-100" : "bg-muted"}`}>
                          <Icon className={`h-6 w-6 ${isActive ? "text-green-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{strategy.name}</CardTitle>
                          <CardDescription className="capitalize">{strategy.type.replace("_", " ")}</CardDescription>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {strategy.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {getStrategyDescription(strategy.type)}
                    </p>
                    
                    {strategy.performance && (
                      <div className="bg-muted rounded-lg p-3 mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Performance</div>
                        <div className="text-sm font-medium">
                          {JSON.parse(strategy.performance).winRate || "N/A"}% Win Rate
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isActive ? "destructive" : "default"}
                        onClick={() => toggleStatus(strategy.id, strategy.status)}
                        disabled={updateMutation.isPending}
                        className="flex-1"
                      >
                        {isActive ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(strategy.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Strategies Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first trading strategy to start generating signals
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Strategy
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Strategy Types Info */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Available Strategy Types</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                type: "momentum",
                name: "Momentum Strategy",
                description: "Uses EMA crossovers with RSI confirmation to identify strong trending markets. Best for trending markets with clear directional movement.",
                indicators: ["EMA 12/26", "RSI 14", "MACD"],
              },
              {
                type: "mean_reversion",
                name: "Mean Reversion",
                description: "Identifies oversold and overbought conditions using Bollinger Bands and RSI. Ideal for range-bound markets.",
                indicators: ["Bollinger Bands", "RSI 14"],
              },
              {
                type: "breakout",
                name: "Breakout Strategy",
                description: "Detects volatility breakouts using ATR. Captures explosive moves when price breaks key levels with high volatility.",
                indicators: ["ATR 14", "Support/Resistance"],
              },
              {
                type: "ml_based",
                name: "ML-Based Strategy",
                description: "Advanced machine learning model that combines multiple indicators with weighted scoring for optimal signal generation.",
                indicators: ["All Technical Indicators", "ML Scoring"],
              },
              {
                type: "sentiment",
                name: "Sentiment Analysis",
                description: "Analyzes market sentiment from news, social media, and market data to predict price movements.",
                indicators: ["News Sentiment", "Social Media", "Market Momentum"],
              },
              {
                type: "arbitrage",
                name: "Arbitrage Strategy",
                description: "Exploits price discrepancies across different exchanges or markets for risk-free profit opportunities.",
                indicators: ["Cross-Exchange Prices", "Spread Analysis"],
              },
            ].map((strategyType, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{strategyType.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{strategyType.description}</p>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Key Indicators:</div>
                    <div className="flex flex-wrap gap-2">
                      {strategyType.indicators.map((indicator, j) => (
                        <span key={j} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

