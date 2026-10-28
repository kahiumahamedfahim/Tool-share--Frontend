import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NotificationProvider from "@/app/components/notifications/NotificationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ToolShare | Rent tools from your community",
    template: "%s | ToolShare",
  },
  description:
    "Find tools and equipment to rent from your community, or list the tools you already own.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
