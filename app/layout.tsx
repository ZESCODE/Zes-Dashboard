import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});
import "./frost-overrides.css";
import "./dark-bg.css";
import { Metadata } from "next";
import { V0Provider } from "@/lib/v0-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";
import Widget from "@/components/dashboard/widget";
import Notifications from "@/components/dashboard/notifications";
import { ThemeProvider } from "@/components/terminal/theme-provider";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { MobileChat } from "@/components/chat/mobile-chat";
import Chat from "@/components/chat";
import CommandPaletteWrapper from "@/components/dashboard/command-palette-wrapper";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import FrostInjector from "@/components/dashboard/frost-injector";

const mockData = mockDataJson as MockData;

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false;

export const metadata: Metadata = {
  title: {
    template: "%s – ZES",
    default: "ZES Orchestration Dashboard",
  },
  description:
    "ZES Orchestration Dashboard — real-time monitoring, agent orchestration, and system control.",
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable} dark`} suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <FrostInjector />
          <V0Provider isV0={isV0}>
          <SidebarProvider>
            {/* Mobile Header - only visible on mobile */}
            <MobileHeader mockData={mockData} />

            {/* Desktop Layout */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
              <div className="hidden lg:block col-span-2 sticky top-0 h-screen">
                <DashboardSidebar />
              </div>
              <div className="col-span-1 lg:col-span-7 pb-14 lg:pb-0">
                {children}
              </div>
              <div className="col-span-3 hidden lg:block">
                <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-y-auto">
                  <div className="flex items-center justify-end px-4">
                    <NotificationBell />
                  </div>
                  <Widget widgetData={mockData.widgetData} />
                  <Notifications
                    initialNotifications={mockData.notifications}
                  />
                  <Chat />
                </div>
              </div>
            </div>

            {/* Mobile Chat - floating CTA with drawer */}
            <MobileChat />
          </SidebarProvider>
          <CommandPaletteWrapper />
        </V0Provider>
        </ThemeProvider>
        <MobileBottomNav />
      </body>
    </html>
  );
}
