import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/lib/react-query/provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const paperlogy = localFont({
  src: [
    {
      path: "../../public/fonts/Paperlogy-4Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Paperlogy-6SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Paperlogy-7Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Paperlogy-8ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-paperlogy",
});

export const metadata: Metadata = {
  title: "SDC Lab Dashboard",
  description: "서울시립대학교 SDC Lab 연구실 관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${paperlogy.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
