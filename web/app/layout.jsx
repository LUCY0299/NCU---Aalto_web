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

const BASE_URL = "https://ncu-aalto-web.onrender.com";

const DEFAULT_METADATA = {
  title: "NCU × Aalto EMBA",
  description: "National Central University × Aalto University Executive MBA Program",
};

// 在伺服器端動態抓取後台 branding 設定的分頁標題與 favicon，
// 讓後台編輯人員修改 favicon_title / favicon 後，前台能反映最新結果。
export async function generateMetadata() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/pages/layout`, {
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_METADATA;

    const data = await res.json();
    const brandingSection = data?.sections?.find(
      (s) => s.section_key === "branding"
    );
    if (!brandingSection?.content_fields) return DEFAULT_METADATA;

    const fields = brandingSection.content_fields.filter(
      (f) => f.locale === "zh-TW"
    );

    let faviconTitle = "";
    let faviconUrl = "";
    fields.forEach((f) => {
      if (f.field_key === "favicon_title") faviconTitle = f.field_value;
      if (f.field_key === "favicon") faviconUrl = f.field_value;
    });

    const fullFaviconUrl = faviconUrl
      ? faviconUrl.startsWith("http")
        ? faviconUrl
        : `${BASE_URL}${faviconUrl}`
      : null;

    return {
      title: faviconTitle || DEFAULT_METADATA.title,
      description: DEFAULT_METADATA.description,
      ...(fullFaviconUrl ? { icons: { icon: fullFaviconUrl } } : {}),
    };
  } catch (err) {
    console.error("❌ 無法載入動態 SEO 設定，改用預設值", err);
    return DEFAULT_METADATA;
  }
}

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