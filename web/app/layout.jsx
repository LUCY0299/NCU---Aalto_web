import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NCU × Aalto EMBA",
  description: "National Central University × Aalto University Executive MBA Program",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        {/* 全站導覽列 */}
        <Navbar />

        {/* 各頁面內容 */}
        <main style={{ flex: 1, minHeight: "100vh" }}>
          {children}
        </main>

        {/* 全站 CTA Section */}
        <CTASection />

        {/* 全站頁尾 */}
        <Footer />
      </body>
    </html>
  );
}