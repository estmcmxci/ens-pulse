import { GovernanceOverview } from "@/features/governance/components/GovernanceOverview";
import { GovernanceStats } from "@/features/governance/components/GovernanceStats";
import { HistoricalContext } from "@/features/historical-context/components/HistoricalContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { BarChart3 } from "lucide-react";

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-in stagger-1">
        <h1 className="text-3xl font-700 tracking-tight text-[var(--color-text-primary)]">Governance</h1>
        <p className="label mt-2">
          Active proposals, voting analytics, and governance participation
        </p>
        <div className="divider-ens mt-4" />
      </div>

      {/* Stats Overview - Now using real data */}
      <GovernanceStats />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GovernanceOverview />
        </div>
        <div>
          <HistoricalContext proposalId="EP5.3" />
        </div>
      </div>

      {/* Governance Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ens-blue" />
            <CardTitle>Governance Analytics</CardTitle>
          </div>
          <Badge variant="info">Powered by Dune</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>Governance analytics charts will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
