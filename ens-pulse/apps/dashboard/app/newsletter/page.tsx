import { NewsletterSearch } from "@/features/newsletter/components/NewsletterSearch";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Newspaper, Archive, Search, Calendar } from "lucide-react";

export default function NewsletterPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Newsletter Archive</h1>
        <p className="text-muted-foreground mt-1">
          Full-text search across 90+ ENS DAO newsletters
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-blue/10">
              <Newspaper className="h-5 w-5 text-ens-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold">90+</p>
              <p className="text-xs text-muted-foreground">Newsletters</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-ens-purple/10">
              <Archive className="h-5 w-5 text-ens-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold">2+ Years</p>
              <p className="text-xs text-muted-foreground">Of Coverage</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Search className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">Full-Text</p>
              <p className="text-xs text-muted-foreground">Search</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">Weekly</p>
              <p className="text-xs text-muted-foreground">Updates</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsletterSearch />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="https://discuss.ens.domains/c/dao-wide/newsletter/72"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-muted/50 border border-border hover:border-ens-blue/50 transition-colors"
              >
                <p className="font-medium text-sm">Forum Newsletter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  discuss.ens.domains
                </p>
              </a>
              <a
                href="https://paragraph.xyz/@ensdao"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-muted/50 border border-border hover:border-ens-blue/50 transition-colors"
              >
                <p className="font-medium text-sm">Paragraph Newsletter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  paragraph.xyz/@ensdao
                </p>
              </a>
            </CardContent>
          </Card>

          {/* Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "Governance",
                  "Treasury",
                  "Working Groups",
                  "Proposals",
                  "ENS Labs",
                  "Ecosystem",
                  "Public Goods",
                  "Metagov",
                  "Budget",
                  "Stewards",
                ].map((topic) => (
                  <Badge
                    key={topic}
                    variant="default"
                    className="cursor-pointer hover:bg-ens-blue/20"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About the Archive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The ENS DAO Newsletter has been published weekly since January
                2022, covering governance updates, working group activities,
                proposal discussions, and ecosystem news.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                This archive enables full-text search to help you find relevant
                historical context for current governance decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
