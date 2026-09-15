import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NCU Aalto EMBA", // 這裡可以順便改成你的專案名稱
  description: "National Central University × Aalto University Executive MBA Program",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-TW" // 建議將 lang="en" 改為 "zh-TW"，對 SEO 與瀏覽器翻譯較友善
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}