import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bot, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Portfolio() {
  const { user, isAuthenticated } = useAuth();
  const { data: portfolio, refetch } = trpc.portfolio.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const syncMT5 = trpc.portfolio.syncWithMT5.useMutation();

  const handleSync = () => {
    syncMT5.mutate(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your portfolio</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
              <Link href="/portfolio">
                <span className="text-sm font-medium text-primary cursor-pointer">Portfolio</span>
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Portfolio Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your trading performance and account balance
            </p>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${parseFloat(portfolio?.balance || "0").toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Equity: ${parseFloat(portfolio?.equity || "0").toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${parseFloat(portfolio?.totalPnl || "0").toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Win Rate: {portfolio?.winRate || "0"}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {portfolio && 'maxDrawdown' in portfolio ? parseFloat(portfolio.maxDrawdown || "0").toFixed(2) : "0.00"}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sync Button */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>MT5 Account Sync</CardTitle>
            <CardDescription>
              Synchronize your portfolio with your MetaTrader 5 account balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSync} disabled={syncMT5.isPending}>
              {syncMT5.isPending ? "Syncing..." : "Sync with MT5"}
            </Button>
            {syncMT5.isSuccess && (
              <p className="text-sm text-green-600 mt-2">✓ Successfully synced with MT5</p>
            )}
            {syncMT5.isError && (
              <p className="text-sm text-red-600 mt-2">✗ Failed to sync. Please check MT5 connection.</p>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your trading account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Balance</span>
                <span className="font-semibold">${parseFloat(portfolio?.balance || "0").toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equity</span>
                <span className="font-semibold">${parseFloat(portfolio?.equity || "0").toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total P&L</span>
                <span className={`font-semibold ${parseFloat(portfolio?.totalPnl || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${parseFloat(portfolio?.totalPnl || "0").toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-semibold">{portfolio?.winRate || "0"}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-semibold">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

