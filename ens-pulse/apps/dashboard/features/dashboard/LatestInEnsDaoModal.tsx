"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useSignalsTicker, type TickerItem } from "@/shared/hooks/use-api-data";

const BULLETS_KEY = "ens-pulse-bullets-seen";

export function getBulletsSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(BULLETS_KEY) === "1";
  } catch {
    return true;
  }
}

export function setBulletsSeen(): void {
  try {
    sessionStorage.setItem(BULLETS_KEY, "1");
  } catch {
    /* noop */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Source → dot color (matches hero ticker palette)
   ═══════════════════════════════════════════════════════════════════════════ */

const SOURCE_COLOR: Record<string, string> = {
  discourse: "#5298ff",
  github:    "#a099ff",
  x:         "#06b6d4",
  other:     "#e8a946",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Deduplication — word-overlap Jaccard similarity.
   Signals from different sources often cover the same story; this picks
   the highest-scored version and skips near-duplicates.
   ═══════════════════════════════════════════════════════════════════════════ */

const STOP_WORDS = new Set([
  "a","an","the","and","or","of","to","in","for","on","is","it","by","with","at","from","as","this","that",
]);

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  return new Set(words.filter((w) => !STOP_WORDS.has(w) && w.length > 1));
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const w of a) if (b.has(w)) overlap++;
  return overlap / Math.min(a.size, b.size);
}

const SIMILARITY_THRESHOLD = 0.5;

function pickDiverse(items: TickerItem[], count: number): TickerItem[] {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const picked: { item: TickerItem; tokens: Set<string> }[] = [];

  for (const item of sorted) {
    if (picked.length >= count) break;
    const tokens = tokenize(item.headline);
    const isDupe = picked.some((p) => similarity(p.tokens, tokens) >= SIMILARITY_THRESHOLD);
    if (!isDupe) picked.push({ item, tokens });
  }

  return picked.map((p) => p.item);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Static fallback — shown while loading or if the fetch fails
   ═══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_ITEMS = [
  { text: "Governance proposal updates and voting deadlines.", color: "#5298ff" },
  { text: "Treasury and budget highlights.", color: "#e8a946" },
  { text: "Key delegate and community signals.", color: "#a099ff" },
  { text: "Upcoming meetings and calendar.", color: "#f59e0b" },
  { text: "Notable forum and social discussion.", color: "#06b6d4" },
];

const SIGNAL_COUNT = 5;

interface LatestInEnsDaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LatestInEnsDaoModal({ open, onOpenChange }: LatestInEnsDaoModalProps) {
  const { data, isLoading } = useSignalsTicker();

  const handleOpenChange = (next: boolean) => {
    if (!next) setBulletsSeen();
    onOpenChange(next);
  };

  // Pick top 5 diverse signals (deduplicated by headline similarity)
  const signals: { text: string; color: string; url?: string }[] =
    data?.items && data.items.length > 0
      ? pickDiverse(data.items, SIGNAL_COUNT).map((item) => ({
          text: item.headline,
          color: SOURCE_COLOR[item.source] || SOURCE_COLOR.other,
          url: item.url,
        }))
      : FALLBACK_ITEMS;

  const isLive = !isLoading && data?.items && data.items.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[101] w-[min(calc(100vw-2rem),440px)]",
            "translate-x-[-50%] translate-y-[-50%]",
            "rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]",
            "p-0 overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=open]:duration-300"
          )}
          style={{
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(82,152,255,0.12) inset, 0 0 60px rgba(82,152,255,0.07)",
          }}
          onPointerDownOutside={() => handleOpenChange(false)}
          onEscapeKeyDown={() => handleOpenChange(false)}
        >
          {/* ── Top accent gradient bar ── */}
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-ens-blue), var(--color-ens-purple))",
            }}
          />

          {/* ── Header row ── */}
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              {/* Live signal dot */}
              <span className="relative flex h-2 w-2">
                {isLive && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-40"
                    style={{ background: "var(--color-ens-blue)" }}
                  />
                )}
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{
                    background: isLive
                      ? "var(--color-ens-blue)"
                      : "var(--color-text-muted)",
                  }}
                />
              </span>
              <Dialog.Title className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
                Signal Feed
              </Dialog.Title>
            </div>
            <Dialog.Close
              className={cn(
                "p-1.5 rounded-md text-[var(--color-text-muted)]",
                "hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]",
                "transition-all duration-150"
              )}
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Dialog.Close>
          </div>

          {/* ── Title + subtitle ── */}
          <div className="px-5 pb-3">
            <h2 className="text-base font-medium tracking-tight text-[var(--color-text-primary)]">
              The Latest in ENS DAO
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {isLive
                ? `Top ${signals.length} signals by relevance`
                : "Loading signals\u2026"}
            </p>
          </div>

          {/* ── Gradient divider ── */}
          <div
            className="mx-5 h-px"
            style={{
              background:
                "linear-gradient(90deg, var(--color-border-default), transparent)",
            }}
          />

          {/* ── Signal items ── */}
          <Dialog.Description asChild>
            <div className="px-5 py-3.5">
              {signals.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 py-2.5 rounded-md -mx-2 px-2",
                    "animate-in fade-in-0 slide-in-from-bottom-1",
                    "no-underline",
                    item.url
                      ? "hover:bg-[var(--color-bg-overlay)] transition-colors cursor-pointer"
                      : "cursor-default"
                  )}
                  style={{
                    animationDelay: `${100 + i * 60}ms`,
                    animationFillMode: "backwards",
                    animationDuration: "350ms",
                  }}
                  onClick={item.url ? undefined : (e) => e.preventDefault()}
                >
                  {/* Colored signal dot */}
                  <span
                    className="block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}40`,
                    }}
                  />
                  <span className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {item.text}
                  </span>
                </a>
              ))}
            </div>
          </Dialog.Description>

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {isLive ? `${signals.length} signals` : "---"}
            </span>
            <button
              onClick={() => handleOpenChange(false)}
              type="button"
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-md",
                "transition-all duration-150 cursor-pointer"
              )}
              style={{
                color: "var(--color-ens-blue)",
                background: "rgba(82,152,255,0.08)",
                border: "1px solid rgba(82,152,255,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(82,152,255,0.14)";
                e.currentTarget.style.borderColor = "rgba(82,152,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(82,152,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(82,152,255,0.15)";
              }}
            >
              Dismiss
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
