"use client";

import { useSignalsTicker } from "@/shared/hooks/use-api-data";

/* ═══════════════════════════════════════════════════════════════════════════
   SIGNALS TICKER — Floating marquee of ranked governance signals
   ═══════════════════════════════════════════════════════════════════════════ */

export function SignalsTicker() {
  const { data, isLoading } = useSignalsTicker();

  if (isLoading || !data?.items?.length) {
    return null; // Don't show empty ticker
  }

  const items = data.items;

  // Duplicate items for seamless loop
  const tickerItems = [...items, ...items];

  // 8 minutes (480 seconds) to cycle through all signals
  const animationDuration = 480;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-raised)]/95 backdrop-blur-sm border-t border-[var(--color-border-default)]">
      {/* ENS gradient line at top of ticker */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-ens-blue)]/30 to-transparent" />
      <div className="relative overflow-hidden h-8">
        {/* Gradient fades on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--color-bg-raised)] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--color-bg-raised)] to-transparent z-10" />

        {/* Scrolling content */}
        <div
          className="flex items-center h-full animate-ticker hover:pause-ticker"
          style={{ animationDuration: `${animationDuration}s`, width: 'max-content' }}
        >
          {tickerItems.map((item, index) => (
            <a
              key={`${item.id}-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 shrink-0 hover:bg-[var(--color-bg-raised)] h-full transition-colors"
            >
              {/* Source icon */}
              <span className="text-[var(--color-text-muted)]">
                {item.source === "x" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ) : item.source === "discourse" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.486 2 2 6.486 2 12c0 5.515 4.486 10 10 10s10-4.485 10-10c0-5.514-4.486-10-10-10zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                  </svg>
                ) : item.source === "github" ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                ) : (
                  <span className="w-3 h-3 rounded-full bg-[var(--color-text-muted)]" />
                )}
              </span>

              {/* Headline */}
              <span className="text-[11px] text-[var(--color-text-secondary)] whitespace-nowrap">
                {item.headline}
              </span>

              {/* Separator */}
              <span className="text-[var(--color-border-default)] ml-2">|</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SignalsTicker;
