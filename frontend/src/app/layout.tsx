import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner"; // 1. ON AJOUTE L'IMPORT ICI
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CryptoSim",
  description: "Trading Simulation Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children} 
        
        {/* 2. ON AJOUTE LE TOASTER ICI POUR QU'IL SOIT DISPONIBLE PARTOUT */}
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}