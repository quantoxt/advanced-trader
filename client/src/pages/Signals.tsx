import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Activity, Bot, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Signals() {
  const { user } = useAuth();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD");

  const utils = trpc.useUtils();
  const { data: strategies } = trpc.strategies.list.useQuery();
  const { data: signals, isLoading } = trpc.signals.list.useQuery({ limit: 50 });
  const { data: symbols } = trpc.market.symbols.useQuery();

  const generateMutation = trpc.signals.generate.useMutation({
    onSuccess: (data) => {
      utils.signals.list.invalidate();
      setIsGenerateOpen(false);
      toast.success(`Signal generated: ${data.action.toUpperCase()} ${selectedSymbol} with ${data.confidence.toFixed(0)}% confidence`);
    },
    onError: (error) => {
      toast.error(`Failed to generate signal: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!selectedStrategy) {
      toast.error("Please select a strategy");
      return;
    }
    generateMutation.mutate({
      strategyId: selectedStrategy,
      symbol: selectedSymbol,
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "buy":
        return "text-green-600 bg-green-50";
      case "sell":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "buy":
        return TrendingUp;
      case "sell":
        return TrendingDown;
      default:
        return Activity;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Bot className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {APP_TITLE}
                </span>
              </div>
            </Link>
            <div className="hidden md:flex gap-4">
              <Link href="/">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Dashboard</span>
              </Link>
              <Link href="/strategies">
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Strategies</span>
              </Link>
              <Link href="/signals">
                <span className="text-sm font-medium text-primary cursor-pointer">Signals</span>
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
            <h1 className="text-4xl font-bold mb-2">Trading Signals</h1>
            <p className="text-muted-foreground">Generate and monitor trading signals from your strategies</p>
          </div>
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Zap className="mr-2 h-4 w-4" />
                Generate Signal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Trading Signal</DialogTitle>
                <DialogDescription>
                  Select a strategy and symbol to generate a new trading signal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="strategy">Strategy</Label>
                  <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies?.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          {strategy.name} ({strategy.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="symbol">Trading Symbol</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {symbols?.map((symbol) => (
                        <SelectItem key={symbol.symbol} value={symbol.symbol}>
                          {symbol.symbol} - {symbol.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending || !selectedStrategy} className="w-full">
                  {generateMutation.isPending ? "Generating..." : "Generate Signal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Signals List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading signals...</p>
          </div>
        ) : signals && signals.length > 0 ? (
          <div className="space-y-4">
            {signals.map((signal) => {
              const ActionIcon = getActionIcon(signal.action);
              const confidence = parseFloat(signal.confidence);
              const price = parseFloat(signal.price);
              const sentiment = signal.sentiment ? parseFloat(signal.sentiment) : 0;

              return (
                <Card key={signal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${getActionColor(signal.action)}`}>
                          <ActionIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{signal.symbol}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase ${getActionColor(signal.action)}`}>
                              {signal.action}
                            </span>
                            <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
                              {confidence.toFixed(0)}% Confidence
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Price</div>
                              <div className="font-medium">${price.toFixed(4)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Sentiment</div>
                              <div className={`font-medium ${sentiment >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {sentiment.toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Status</div>
                              <div className="font-medium capitalize">{signal.executed}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Time</div>
                              <div className="font-medium">
                                {signal.timestamp ? new Date(signal.timestamp).toLocaleTimeString() : "N/A"}
                              </div>
                            </div>
                          </div>
                          {signal.indicators && (
                            <div className="bg-muted rounded-lg p-3">
                              <div className="text-xs font-medium text-muted-foreground mb-2">Technical Indicators</div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(JSON.parse(signal.indicators)).map(([key, value]: [string, any]) => {
                                  if (typeof value === "object") {
                                    return Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                                      <span key={`${key}-${subKey}`} className="text-xs bg-white px-2 py-1 rounded">
                                        {key}.{subKey}: {typeof subValue === "number" ? subValue.toFixed(2) : subValue}
                                      </span>
                                    ));
                                  }
                                  return (
                                    <span key={key} className="text-xs bg-white px-2 py-1 rounded">
                                      {key}: {typeof value === "number" ? value.toFixed(2) : value}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Signals Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate your first trading signal from a strategy
              </p>
              <Button onClick={() => setIsGenerateOpen(true)}>
                <Zap className="mr-2 h-4 w-4" />
                Generate Your First Signal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Signal Interpretation Guide */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Understanding Trading Signals</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Buy Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Indicates a potential upward price movement. Consider entering a long position.
                </p>
                <div className="text-xs space-y-2">
                  <div><strong>High Confidence (80%+):</strong> Strong bullish indicators align</div>
                  <div><strong>Medium Confidence (60-80%):</strong> Moderate bullish signals</div>
                  <div><strong>Low Confidence (&lt;60%):</strong> Weak signals, proceed with caution</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Sell Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Indicates a potential downward price movement. Consider entering a short position or closing longs.
                </p>
                <div className="text-xs space-y-2">
                  <div><strong>High Confidence (80%+):</strong> Strong bearish indicators align</div>
                  <div><strong>Medium Confidence (60-80%):</strong> Moderate bearish signals</div>
                  <div><strong>Low Confidence (&lt;60%):</strong> Weak signals, proceed with caution</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Hold Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  No clear directional bias. Market conditions are neutral or unclear.
                </p>
                <div className="text-xs space-y-2">
                  <div><strong>Action:</strong> Maintain current positions or stay in cash</div>
                  <div><strong>Reason:</strong> Conflicting indicators or ranging market</div>
                  <div><strong>Strategy:</strong> Wait for clearer signals before entering</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

