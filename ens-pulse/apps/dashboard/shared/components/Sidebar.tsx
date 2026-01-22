"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Vote,
  Wallet,
  Globe,
  History,
  Users,
  Newspaper,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Custom", href: "/custom", icon: LayoutGrid },
  { name: "Governance", href: "/governance", icon: Vote },
  { name: "Treasury", href: "/treasury", icon: Wallet },
  { name: "Context", href: "/context", icon: Globe },
  { name: "Historical", href: "/historical", icon: History },
  { name: "Delegates", href: "/delegates", icon: Users },
  { name: "Newsletter", href: "/newsletter", icon: Newspaper },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-ens-blue to-ens-purple flex items-center justify-center">
            <span className="text-white font-bold text-sm">ENS</span>
          </div>
          <span className="font-semibold text-lg">Pulse</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-ens-blue/10 text-ens-blue"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <div className="mt-3 px-3 text-xs text-muted-foreground">
          <p>ENS Pulse v0.1.0</p>
          <p className="mt-1">Block: Loading...</p>
        </div>
      </div>
    </aside>
  );
}
