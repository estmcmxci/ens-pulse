"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  { name: "Dashboard", href: "/" },
  { name: "Governance", href: "/governance" },
  { name: "Delegates", href: "/delegates" },
  { name: "Treasury", href: "/treasury" },
  { name: "Context", href: "/context" },
  { name: "Historical", href: "/historical" },
  { name: "Newsletter", href: "/newsletter" },
  { name: "Settings", href: "/settings" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px">
          {routes.map((route) => {
            const isActive =
              route.href === "/"
                ? pathname === "/"
                : pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                className={`
                  px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors
                  border-b-2 -mb-px
                  ${
                    isActive
                      ? "border-[var(--color-ens-blue)] text-[var(--color-text-primary)]"
                      : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]"
                  }
                `}
              >
                {route.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
