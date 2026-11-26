import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Reputation Lookup",
  description: "AI-powered online reputation analysis across social media and public web sources.",
  keywords: "AI, reputation, social media, analysis, digital footprint",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {children}
          </main>
          <footer
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <div
              className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between"
              style={{ color: "var(--text-3)", fontSize: "0.75rem" }}
            >
              <span>© {new Date().getFullYear()} AI Reputation Lookup</span>
              <span>Privacy-first analysis</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
