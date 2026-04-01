import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regime — Daily Market Intelligence",
  description: "Know what to do with your money today. Institutional-grade regime detection for Indian retail investors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: "#080b10", color: "#f0f6fc" }}>
        {children}
      </body>
    </html>
  );
}
