"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SystemSetupProvider } from "@/components/page-components/setup-provider";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleAnalytics from "@/components/tools/ga";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("overflow-hidden overscroll-none", notoSans.className)}
      >
        <GoogleAnalytics />
        <SystemSetupProvider />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <main className="relative flex max-h-screen min-h-screen w-full flex-col overflow-y-auto bg-sidebar p-3">
              {children}
            </main>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
