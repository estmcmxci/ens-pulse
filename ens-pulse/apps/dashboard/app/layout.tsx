import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import HeroOverlay from "@/features/dashboard/HeroOverlay";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ens-pulse.vercel.app"),
  title: "ENS Pulse | DAO Monitor",
  description:
    "Never vote on a proposal without understanding the world it exists in. Real-time context for ENS governance decisions.",
  keywords: ["ENS", "Ethereum Name Service", "governance", "DAO", "world monitor", "context"],
  openGraph: {
    title: "ENS Pulse | DAO Monitor",
    description: "Real-time context for ENS governance decisions. Never vote on a proposal without understanding the world it exists in.",
    siteName: "ENS Pulse",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ENS Pulse — DAO Monitor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ENS Pulse | DAO Monitor",
    description: "Real-time context for ENS governance decisions. Never vote on a proposal without understanding the world it exists in.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--color-bg-base)] antialiased">
        {/* Atmospheric background layer */}
        <div className="atmosphere" aria-hidden="true" />
        <Providers>
          <div className="min-h-screen flex flex-col relative z-[1]">
            <main className="flex-1 px-3 py-6 sm:px-4 md:px-8 max-w-[1800px] mx-auto w-full">{children}</main>
          </div>
        </Providers>
        {/* Hero overlay — first-visit landing, reveals dashboard on CTA click */}
        <HeroOverlay />
      </body>
    </html>
  );
}
