import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 900; // 15 minutes

interface Signal {
  content_id: string;
  title: string;
  url: string;
  source_type: string;
  author: string;
  published_at: string;
  score: {
    total: number;
    relevance: number;
    impact: number;
  };
  draft: {
    headline: string;
    variants: {
      five_bullet_line: string;
    };
  };
}

interface TickerItem {
  id: string;
  headline: string;
  source: "x" | "discourse" | "github" | "other";
  author: string;
  score: number;
  url: string;
  publishedAt: string;
}

export async function GET() {
  try {
    // Read the signals file
    const filePath = path.join(process.cwd(), "signals_ranked.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const signals: Signal[] = JSON.parse(fileContent);

    // Sort by date (most recent first) and include all signals
    const sorted = signals
      .sort((a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );

    // Transform to ticker format
    const tickerItems: TickerItem[] = sorted.map((signal) => ({
      id: signal.content_id,
      headline: (
        signal.draft?.variants?.five_bullet_line ||
        signal.draft?.headline ||
        signal.title.slice(0, 100)
      ).replace(/^- /, ""),
      source:
        signal.source_type === "x"
          ? "x"
          : signal.source_type === "discourse"
          ? "discourse"
          : signal.source_type === "github"
          ? "github"
          : "other",
      author: signal.author,
      score: Math.round((signal.score?.total || 0) * 100),
      url: signal.url,
      publishedAt: signal.published_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: tickerItems,
        count: tickerItems.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error reading signals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load signals" },
      { status: 500 }
    );
  }
}
