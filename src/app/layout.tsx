import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/lib/react-query/provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// 주요 웨이트(400, 700)만 preload, 나머지는 필요 시 지연 로드
// 모바일 환경에서 ~637KB → ~320KB로 초기 preload 감소
const paperlogy = localFont({
  src: [
    {
      path: "../../public/fonts/Paperlogy-4Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Paperlogy-6SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Paperlogy-7Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Paperlogy-8ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-paperlogy",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "SDC Lab Dashboard",
  description: "서울시립대학교 SDC Lab 연구실 관리 대시보드",
    verification: {
          google: "dS1jVXOd0wo_B7FSkhNBWahCmAj8X1voud-Ga_jDnB0",
        },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${paperlogy.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </QueryProvider>
          <WebVitalsReporter />
        </ThemeProvider>
      </body>
    </html>
  );
}
