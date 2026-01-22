import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ENS Pulse | World Monitor",
  description:
    "Never vote on a proposal without understanding the world it exists in. Real-time context for ENS governance decisions.",
  keywords: ["ENS", "Ethereum Name Service", "governance", "DAO", "world monitor", "context"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--color-bg-base)] antialiased">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1 p-4 max-w-[1800px] mx-auto w-full">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
