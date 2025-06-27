import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/components/SessionProvider";
import AppHeader from "@/components/AppHeader";
import { FaShieldAlt } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Reputation Lookup | Online Reputation Analysis",
  description: "Comprehensive AI-powered online reputation analysis across social media and web sources",
  keywords: "AI, reputation, social media, analysis, digital footprint",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-gray-900 to-black min-h-screen`}
      >
        <NextAuthProvider>
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="py-6 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800">
              <div className="container mx-auto px-4 text-center text-gray-400 flex items-center justify-center">
                <FaShieldAlt className="mr-2 text-indigo-500" />
                <p>© {new Date().getFullYear()} AI Reputation Lookup | Privacy-First Analysis</p>
              </div>
            </footer>
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
