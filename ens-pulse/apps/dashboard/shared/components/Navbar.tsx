"use client";

import { Search, Bell, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6 gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search proposals, delegates, newsletters..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ens-blue/50"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* External Links */}
          <div className="flex items-center gap-2">
            <Link
              href="https://discuss.ens.domains"
              target="_blank"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Forum
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="https://tally.xyz/gov/ens"
              target="_blank"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tally
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-ens-blue" />
          </button>

          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
