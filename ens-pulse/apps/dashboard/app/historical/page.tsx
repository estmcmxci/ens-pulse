import { HistoricalContext } from "@/features/historical-context/components/HistoricalContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { History, TrendingUp, Calendar, Database } from "lucide-react";

export default function HistoricalPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Historical Context</h1>
        <p className="text-muted-foreground mt-1">
          Understand how conditions have changed since proposals were created
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-blue/10">
              <History className="h-5 w-5 text-ens-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold">156</p>
              <p className="text-xs text-muted-foreground">Proposals Tracked</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-purple/10">
              <Database className="h-5 w-5 text-ens-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold">1,240</p>
              <p className="text-xs text-muted-foreground">Snapshots</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">+28%</p>
              <p className="text-xs text-muted-foreground">ETH Since Start</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">2+ Years</p>
              <p className="text-xs text-muted-foreground">Of Data</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Historical Context for Recent Proposals */}
        <HistoricalContext proposalId="EP5.3" />
        <HistoricalContext proposalId="EP5.2" />
      </div>

      {/* Treasury Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <CardTitle>Treasury Value Timeline</CardTitle>
          </div>
          <Badge variant="info">Key Decision Points</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                date: "Nov 2024",
                event: "Term 5 Budget Approved",
                value: "$52M",
                change: "+5%",
              },
              {
                date: "Sep 2024",
                event: "ENS Labs Funding",
                value: "$49M",
                change: "-8%",
              },
              {
                date: "Jun 2024",
                event: "Q2 Working Group Budgets",
                value: "$53M",
                change: "+12%",
              },
              {
                date: "Mar 2024",
                event: "Term 4 Budget Approved",
                value: "$47M",
                change: "+3%",
              },
              {
                date: "Jan 2024",
                event: "Public Goods Round 2",
                value: "$46M",
                change: "-2%",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground w-20">
                    {item.date}
                  </div>
                  <div>
                    <p className="font-medium">{item.event}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.value}</p>
                  <p
                    className={`text-sm ${item.change.startsWith("+") ? "text-success" : "text-danger"}`}
                  >
                    {item.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>How Historical Context Works</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm prose-invert max-w-none">
          <p className="text-muted-foreground">
            Every proposal in ENS governance exists in a specific moment in
            time. Market conditions, treasury balances, and gas prices at the
            time a proposal was created may be very different from today.
          </p>
          <p className="text-muted-foreground mt-3">
            Historical Context automatically captures key metrics when a
            proposal is created and compares them to current values. This helps
            you understand:
          </p>
          <ul className="text-muted-foreground mt-3 space-y-2">
            <li>
              How ETH price changes affect the real value of requested budgets
            </li>
            <li>
              Whether treasury runway has improved or declined since the
              proposal
            </li>
            <li>Whether gas costs make certain operations more/less viable</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
