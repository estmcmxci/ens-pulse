"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Settings, Bell, Palette, Database, ExternalLink, RotateCcw } from "lucide-react";
import { useSettings } from "@/shared/hooks/use-settings";
import { cn } from "@/shared/lib/utils";

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    notifications,
    setNotification,
    resetSettings,
  } = useSettings();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure ENS Pulse dashboard settings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => resetSettings()}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-success" />
              <CardTitle>Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Choose your preferred color scheme
              </p>
              <div className="flex gap-2">
                <Button
                  variant={theme === "dark" ? "secondary" : "outline"}
                  size="sm"
                  className={cn("flex-1", theme === "dark" && "ring-2 ring-ens-blue")}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === "light" ? "secondary" : "outline"}
                  size="sm"
                  className={cn("flex-1", theme === "light" && "ring-2 ring-ens-blue")}
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>
                <Button
                  variant={theme === "system" ? "secondary" : "outline"}
                  size="sm"
                  className={cn("flex-1", theme === "system" && "ring-2 ring-ens-blue")}
                  onClick={() => setTheme("system")}
                >
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-ens-purple" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">New Proposals</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when new proposals are created
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-ens-blue cursor-pointer"
                checked={notifications.proposals}
                onChange={(e) => setNotification("proposals", e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Pending Transactions</p>
                <p className="text-xs text-muted-foreground">
                  Alert when multisig transactions need signatures
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-ens-blue cursor-pointer"
                checked={notifications.treasury}
                onChange={(e) => setNotification("treasury", e.target.checked)}
              />
            </label>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-warning" />
              <CardTitle>Data Sources</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              API keys are configured via environment variables on the server
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "Ponder Indexer", status: "Connected", url: null },
                { name: "Safe API", status: "Connected", url: "https://safe.global" },
                { name: "Dune Analytics", status: "Connected", url: "https://dune.com" },
                { name: "CoinGecko", status: "Connected", url: "https://coingecko.com" },
                { name: "ENS Node", status: "Connected", url: "https://ensnode.io" },
                { name: "Google Calendar", status: "Not Configured", url: null },
              ].map((source) => (
                <div
                  key={source.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{source.name}</span>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      source.status === "Connected"
                        ? "bg-success/10 text-success"
                        : source.status === "Requires API Key"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {source.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About ENS Pulse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ENS Pulse is a governance intelligence dashboard for ENS Protocol
            participants. It combines on-chain governance data with real-world
            context signals to enable informed decision-making.
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Version 0.1.0</span>
            <a href="https://github.com/your-org/ens-pulse" className="text-ens-blue hover:underline">
              GitHub
            </a>
            <a href="https://docs.ens.domains" className="text-ens-blue hover:underline">
              ENS Docs
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
