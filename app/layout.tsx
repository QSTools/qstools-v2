import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarNavigation from "@/components/layout/SidebarNavigation";
import { SETUP_NAV_GATING_ENABLED } from "@/lib/config/setupFlowConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QS Tools",
  description: "Commercial Decision Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-screen bg-background">
          {!SETUP_NAV_GATING_ENABLED ? (
            <div className="w-72 border-r p-4">
              <SidebarNavigation />
            </div>
          ) : null}

          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}