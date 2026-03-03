import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Activity, AlertCircle, Bot, CheckCircle2, Link as LinkIcon, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BrokerConnect() {
  const { user } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("MetaQuotes-Demo");
  const [customServer, setCustomServer] = useState("");
  const [useCustomServer, setUseCustomServer] = useState(false);
  const [accountType, setAccountType] = useState<"demo" | "live">("demo");

  const utils = trpc.useUtils();
  const { data: mt5Status, isLoading: statusLoading } = trpc.brokers.getMT5Status.useQuery();
  const { data: connections } = trpc.brokers.list.useQuery();

  const connectMutation = trpc.brokers.connectMT5.useMutation({
    onSuccess: (data) => {
      utils.brokers.getMT5Status.invalidate();
      utils.brokers.list.invalidate();
      toast.success(`Successfully connected to MT5! Balance: $${data.account?.balance.toFixed(2)}`);
      setPassword(""); // Clear password for security
    },
    onError: (error) => {
      toast.error(`Connection failed: ${error.message}`);
    },
  });

  const disconnectMutation = trpc.brokers.disconnectMT5.useMutation({
    onSuccess: () => {
      utils.brokers.getMT5Status.invalidate();
      utils.brokers.list.invalidate();
      toast.success("Disconnected from MT5");
    },
  });

  const handleConnect = () => {
    const serverToUse = useCustomServer ? customServer : server;
    if (!login || !password || !serverToUse) {
      toast.error("Please fill in all fields");
      return;
    }

    const loginNumber = parseInt(login);
    if (isNaN(loginNumber)) {
      toast.error("Login must be a valid number");
      return;
    }

    connectMutation.mutate({
      login: loginNumber,
      password,
      server: serverToUse,
      broker: "MT5", // Generic - works with any MT5 broker
      accountType,
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
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
                <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Signals</span>
              </Link>
              <Link href="/broker">
                <span className="text-sm font-medium text-primary cursor-pointer">Connect Broker</span>
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
          <h1 className="text-4xl font-bold mb-2">Connect Your Broker</h1>
          <p className="text-muted-foreground">Link your MT5 account to enable automated trading</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Connection Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  MT5 Account Connection
                </CardTitle>
                <CardDescription>
                  Connect your MT5 account (any broker) to start automated trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mt5Status?.connected ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Connected</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your MT5 account is connected and ready for trading
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Connected</AlertTitle>
                    <AlertDescription>
                      Enter your MT5 credentials below to connect
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select value={accountType} onValueChange={(v: "demo" | "live") => setAccountType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo Account</SelectItem>
                        <SelectItem value="live">Live Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="login">MT5 Login Number</Label>
                    <Input
                      id="login"
                      type="text"
                      placeholder="Enter your MT5 login number"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      disabled={mt5Status?.connected}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">MT5 Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your MT5 password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={mt5Status?.connected}
                    />
                  </div>

                  <div>
                    <Label htmlFor="server">MT5 Server</Label>
                    <Select value={useCustomServer ? "custom" : server} onValueChange={(v) => {
                      if (v === "custom") {
                        setUseCustomServer(true);
                      } else {
                        setUseCustomServer(false);
                        setServer(v);
                      }
                    }} disabled={mt5Status?.connected}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MetaQuotes-Demo">MetaQuotes-Demo</SelectItem>
                        <SelectItem value="MetaQuotes-Demo-Server">MetaQuotes-Demo-Server</SelectItem>
                        <SelectItem value="ACYSecurities-Demo">ACYSecurities-Demo</SelectItem>
                        <SelectItem value="ACYSecurities-Live">ACYSecurities-Live</SelectItem>
                        <SelectItem value="custom">Custom Server (type manually)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select your MT5 server. Check your MT5 platform if unsure.
                    </p>
                  </div>

                  {useCustomServer && (
                    <div>
                      <Label htmlFor="customServer">Custom Server Name</Label>
                      <Input
                        id="customServer"
                        type="text"
                        placeholder="e.g., MyBroker-Demo"
                        value={customServer}
                        onChange={(e) => setCustomServer(e.target.value)}
                        disabled={mt5Status?.connected}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the exact server name from your MT5 platform
                      </p>
                    </div>
                  )}

                  {mt5Status?.connected ? (
                    <Button
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect MT5"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      disabled={connectMutation.isPending}
                      className="w-full"
                    >
                      {connectMutation.isPending ? "Connecting..." : "Connect MT5 Account"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">How to Find Your MT5 Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <strong className="text-primary">1. Login Number:</strong>
                  <p className="text-muted-foreground">Found in your MT5 platform under "Navigator" → "Accounts" or in your broker's welcome email</p>
                </div>
                <div>
                  <strong className="text-primary">2. Password:</strong>
                  <p className="text-muted-foreground">The password you set when creating your MT5 account. Contact your broker's support if forgotten.</p>
                </div>
                <div>
                  <strong className="text-primary">3. Server:</strong>
                  <p className="text-muted-foreground">Shown in MT5 under "Tools" → "Options" → "Server" tab, or when you first login to your account</p>
                </div>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Works with any MT5 broker:</strong> MetaQuotes, IC Markets, Pepperstone, FXCM, OANDA, etc. Select "Custom Server" if your broker isn't listed.
                  </AlertDescription>
                </Alert>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Security Note:</strong> Your credentials are encrypted and never stored in plain text. We recommend starting with a demo account to test the system.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Account Status */}
          <div className="space-y-6">
            {mt5Status?.connected && mt5Status.account && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${mt5Status.account.balance.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Equity</div>
                      <div className="text-2xl font-bold">
                        ${mt5Status.account.equity.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Free Margin</div>
                      <div className="text-lg font-semibold">
                        ${mt5Status.account.freeMargin.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current P&L</div>
                      <div className={`text-lg font-semibold ${mt5Status.account.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${mt5Status.account.profit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-medium">{mt5Status.account.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Broker:</span>
                      <span className="font-medium">{mt5Status.account.company}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-medium">{mt5Status.account.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leverage:</span>
                      <span className="font-medium">1:{mt5Status.account.leverage}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {mt5Status?.connected && mt5Status.positions && mt5Status.positions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Open Positions ({mt5Status.positionCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mt5Status.positions.map((position: any) => (
                      <div key={position.ticket} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">{position.symbol}</div>
                            <div className={`text-xs ${position.type === "buy" ? "text-green-600" : "text-red-600"}`}>
                              {position.type.toUpperCase()} {position.volume} lots
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${position.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ${position.profit.toFixed(2)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Entry: {position.openPrice.toFixed(5)}</div>
                          <div>Current: {position.currentPrice.toFixed(5)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You Can Do After Connecting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">View Real-Time Balance</div>
                    <div className="text-sm text-muted-foreground">Monitor your account balance and equity in real-time</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Execute Automated Trades</div>
                    <div className="text-sm text-muted-foreground">Let the AI bot execute trades based on your strategies</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Track Open Positions</div>
                    <div className="text-sm text-muted-foreground">View all your open positions and their P&L</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Risk Management</div>
                    <div className="text-sm text-muted-foreground">Automatic position sizing and stop-loss management</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

