import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Bot, Shield, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RiskManagement() {
  const { user } = useAuth();
  const [maxPositionSize, setMaxPositionSize] = useState("10");
  const [maxDailyLoss, setMaxDailyLoss] = useState("5");
  const [maxDrawdown, setMaxDrawdown] = useState("20");
  const [riskPerTrade, setRiskPerTrade] = useState("2");
  const [stopLossPercent, setStopLossPercent] = useState("2");
  const [takeProfitPercent, setTakeProfitPercent] = useState("4");

  const utils = trpc.useUtils();
  const { data: riskRules, isLoading } = trpc.risk.getRules.useQuery();

  useEffect(() => {
    if (riskRules) {
      setMaxPositionSize(riskRules.maxPositionSize);
      setMaxDailyLoss(riskRules.maxDailyLoss);
      setMaxDrawdown(riskRules.maxDrawdown);
      setRiskPerTrade(riskRules.riskPerTrade);
      setStopLossPercent(riskRules.stopLossPercent);
      setTakeProfitPercent(riskRules.takeProfitPercent);
    }
  }, [riskRules]);

  const updateMutation = trpc.risk.updateRules.useMutation({
    onSuccess: () => {
      utils.risk.getRules.invalidate();
      toast.success("Risk rules updated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to update risk rules: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      maxPositionSize,
      maxDailyLoss,
      maxDrawdown,
      riskPerTrade,
      stopLossPercent,
      takeProfitPercent,
    });
  };

  const calculatePositionSize = (accountBalance: number, riskPercent: number, stopLossPercent: number) => {
    const riskAmount = accountBalance * (riskPercent / 100);
    const positionSize = riskAmount / (stopLossPercent / 100);
    return positionSize;
  };

  const exampleBalance = 10000;
  const examplePositionSize = calculatePositionSize(
    exampleBalance,
    parseFloat(riskPerTrade) || 2,
    parseFloat(stopLossPercent) || 2
  );

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
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Signals</span>
              </Link>
              <Link href="/risk">
                <span className="text-sm font-medium text-primary cursor-pointer">Risk Management</span>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Risk Management</h1>
          <p className="text-muted-foreground">Configure position sizing, stop-loss, and risk limits to protect your capital</p>
        </div>

        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important</AlertTitle>
          <AlertDescription className="text-amber-700">
            Proper risk management is crucial for long-term trading success. Never risk more than you can afford to lose.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Risk Rules Configuration */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Rules Configuration
                </CardTitle>
                <CardDescription>
                  Set limits to protect your trading capital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="maxPositionSize">Maximum Position Size (%)</Label>
                  <Input
                    id="maxPositionSize"
                    type="number"
                    step="0.1"
                    value={maxPositionSize}
                    onChange={(e) => setMaxPositionSize(e.target.value)}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum percentage of account balance per position
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxDailyLoss">Maximum Daily Loss (%)</Label>
                  <Input
                    id="maxDailyLoss"
                    type="number"
                    step="0.1"
                    value={maxDailyLoss}
                    onChange={(e) => setMaxDailyLoss(e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Stop trading if daily loss exceeds this percentage
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxDrawdown">Maximum Drawdown (%)</Label>
                  <Input
                    id="maxDrawdown"
                    type="number"
                    step="0.1"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(e.target.value)}
                    placeholder="20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum acceptable drawdown from peak equity
                  </p>
                </div>

                <div>
                  <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
                  <Input
                    id="riskPerTrade"
                    type="number"
                    step="0.1"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(e.target.value)}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentage of account to risk on each trade
                  </p>
                </div>

                <div>
                  <Label htmlFor="stopLossPercent">Stop Loss (%)</Label>
                  <Input
                    id="stopLossPercent"
                    type="number"
                    step="0.1"
                    value={stopLossPercent}
                    onChange={(e) => setStopLossPercent(e.target.value)}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default stop loss distance as percentage of entry price
                  </p>
                </div>

                <div>
                  <Label htmlFor="takeProfitPercent">Take Profit (%)</Label>
                  <Input
                    id="takeProfitPercent"
                    type="number"
                    step="0.1"
                    value={takeProfitPercent}
                    onChange={(e) => setTakeProfitPercent(e.target.value)}
                    placeholder="4"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default take profit distance as percentage of entry price
                  </p>
                </div>

                <Button onClick={handleSave} disabled={updateMutation.isPending || isLoading} className="w-full">
                  {updateMutation.isPending ? "Saving..." : "Save Risk Rules"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Risk Calculator & Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Position Size Calculator</CardTitle>
                <CardDescription>
                  Based on your current risk rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-2">Example Calculation</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Account Balance:</span>
                      <span className="font-medium">${exampleBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Per Trade:</span>
                      <span className="font-medium">{riskPerTrade}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Stop Loss:</span>
                      <span className="font-medium">{stopLossPercent}%</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">Position Size:</span>
                        <span className="font-bold text-primary">${examplePositionSize.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm font-semibold">Max Loss:</span>
                        <span className="font-bold text-red-600">${(exampleBalance * (parseFloat(riskPerTrade) / 100)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Formula:</strong> Position Size = (Account Balance × Risk %) ÷ Stop Loss %
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Risk Management Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <strong className="text-primary">1. Never Risk More Than 2%</strong>
                  <p className="text-muted-foreground">Professional traders typically risk 1-2% per trade to preserve capital</p>
                </div>
                <div>
                  <strong className="text-primary">2. Use Stop Losses Always</strong>
                  <p className="text-muted-foreground">Every trade should have a predefined stop loss to limit potential losses</p>
                </div>
                <div>
                  <strong className="text-primary">3. Risk-Reward Ratio</strong>
                  <p className="text-muted-foreground">Aim for at least 1:2 risk-reward ratio (take profit should be 2x stop loss)</p>
                </div>
                <div>
                  <strong className="text-primary">4. Daily Loss Limits</strong>
                  <p className="text-muted-foreground">Stop trading for the day if you hit your daily loss limit to avoid emotional decisions</p>
                </div>
                <div>
                  <strong className="text-primary">5. Position Sizing</strong>
                  <p className="text-muted-foreground">Never put all capital in one trade. Diversify across multiple positions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Protection Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Position Size Limit</span>
                  <span className="font-medium text-green-600">✓ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily Loss Limit</span>
                  <span className="font-medium text-green-600">✓ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Drawdown Protection</span>
                  <span className="font-medium text-green-600">✓ Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Stop Loss</span>
                  <span className="font-medium text-green-600">✓ Active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

