"use client"; // Next.js 標記為客戶端元件 (因為有使用 useEffect 操作瀏覽器 DOM)

import React, { useEffect } from "react";

const BASE_URL = "https://ncu-aalto-web.onrender.com";

// 自動偵測網址是否為英文版頁面
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US";
        }
    }
    return "zh-TW";
};

/**
 * 動態更新瀏覽器標籤標題與 Favicon 的隱形元件
 * 請把這個元件放到每個頁面的最上方 (不會佔用畫面空間)
 */
export default function DynamicSEO({
    // 將 Framer 的 Property Controls 轉為預設 Props
    locale: propLocale = "auto",
}) {
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    useEffect(() => {
        // 去後台抓 layout 頁面的資料
        fetch(`${BASE_URL}/api/v1/pages/layout?t=${new Date().getTime()}`, {
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data || !data.sections) return;

                // 找到 branding 區塊
                const brandingSection = data.sections.find(
                    (s) => s.section_key === "branding"
                );
                if (!brandingSection || !brandingSection.content_fields) return;

                // 濾出符合目前語系的欄位
                const fields = brandingSection.content_fields.filter(
                    (f) => f.locale === currentLocale
                );

                // 找出標題與 Favicon 的值
                let faviconTitle = "";
                let faviconUrl = "";

                fields.forEach((f) => {
                    if (f.field_key === "favicon_title")
                        faviconTitle = f.field_value;
                    if (f.field_key === "favicon") faviconUrl = f.field_value;
                });

                // 1. 動態替換網頁標題
                if (faviconTitle) {
                    document.title = faviconTitle;
                }

                // 2. 動態替換標籤頁 Logo (Favicon)
                if (faviconUrl) {
                    const fullFaviconUrl = faviconUrl.startsWith("http")
                        ? faviconUrl
                        : `${BASE_URL}${faviconUrl}`;

                    // 尋找現有的 icon 標籤，沒有就建立一個
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement("link");
                        link.rel = "icon";
                        document.head.appendChild(link);
                    }
                    link.href = fullFaviconUrl;
                }
            })
            .catch((err) => console.error("❌ 無法載入動態 SEO 設定", err));
    }, [currentLocale]);

    // 這是一個「隱形」的元件，不需要渲染任何實際的 UI 畫面
    return null;
}