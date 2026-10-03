import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

import { 
  StorefrontAnnouncement, 
  StorefrontNavbar, 
  StorefrontFooter 
} from "@/components/layout/StorefrontElements";

import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Legacy XI | Premium Football Jerseys",
  description: "Exclusive and premium football jerseys.",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans antialiased bg-white text-black selection:bg-black selection:text-white min-h-screen flex flex-col overflow-x-hidden`}
      >
        <QueryProvider>
          <StorefrontAnnouncement />
          <StorefrontNavbar />
          <main className="flex-grow flex flex-col w-full">
            {children}
          </main>
          <StorefrontFooter />
        </QueryProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
