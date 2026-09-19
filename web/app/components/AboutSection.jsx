"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";

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

export default function AboutSection({
    // 將 Framer 的 Property Controls 轉為預設 Props
    topPadding = 100,
    bottomPadding = 100,
    locale: propLocale = "auto",
}) {
    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 中英文預設字設定
    const defaultTitle =
        currentLocale === "en-US"
            ? "NCU × Finland Aalto EE\nNurturing Global Corporate Leaders with a Nordic Perspective"
            : "中央大學 × 芬蘭 Aalto EE\n用北歐視角培養國際級企業領導者";

    const defaultSubtitle = "Lead with Nordic Vision.";

    const defaultContent =
        currentLocale === "en-US"
            ? "As global enterprises rapidly move towards internationalization and digital transformation..."
            : "當全球企業快速邁向國際化與數位轉型...";

    const [aboutData, setAboutData] = useState({
        title: currentLocale === "en-US" ? "Loading title..." : "載入標題中...",
        subtitle:
            currentLocale === "en-US"
                ? "Loading subtitle..."
                : "載入副標題中...",
        content:
            currentLocale === "en-US" ? "Loading content..." : "載入內文中...",
        imageUrl: "",
        isActive: true,
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // API 請求帶上 locale 參數
        fetch(
            `${BASE_URL}/api/v1/content/home/intro?locale=${currentLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP 錯誤: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (data.is_active === false) {
                    setAboutData((prev) => ({ ...prev, isActive: false }));
                    return;
                }

                const fields = data.fields ? data.fields : data;
                let finalUrl = "";

                if (fields.image_url) {
                    const imgPath = fields.image_url;
                    finalUrl = imgPath.startsWith("http")
                        ? imgPath
                        : `${BASE_URL}${imgPath}`;
                    finalUrl = `${finalUrl}?t=${new Date().getTime()}`;
                } else {
                    finalUrl = " "; // 沒有圖片則留空
                }

                setAboutData({
                    title: fields.title || defaultTitle,
                    subtitle: fields.subtitle || defaultSubtitle,
                    content: fields.content || defaultContent,
                    imageUrl: finalUrl,
                    isActive: true,
                });
                setIsLoaded(true);
            })
            .catch((err) => {
                console.error("❌ About API 連線失敗:", err);
                // 連線失敗時，顯示預設多語系字樣
                setAboutData({
                    title: defaultTitle,
                    subtitle: defaultSubtitle,
                    content: defaultContent,
                    imageUrl: "",
                    isActive: true,
                });
            });
    }, [currentLocale]);

    if (!aboutData.isActive) return null;

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                padding: `var(--page-padding-y) var(--page-padding-x) var(--page-padding-y)`,
                boxSizing: "border-box",
                backgroundColor: "#FFFFFF",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "1200px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "clamp(40px, 6vw, 80px)",
                }}
            >
                {/*左邊欄位：標題、副標題、圖片 */}
                <div
                    style={{
                        flex: "1 1 min(100%, 400px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                        minWidth: 0,
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: "0 0 12px 0",
                                color: "#000000",
                                fontSize: "clamp(24px, 3.5vw, 36px)",
                                fontWeight: 550,
                                lineHeight: 1.4,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                            }}
                        >
                            {aboutData.title}
                        </h2>
                        <h3
                            style={{
                                margin: 0,
                                color: "#666666",
                                fontSize: "clamp(16px, 2vw, 20px)",
                                fontWeight: 400,
                                lineHeight: 1.5,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                            }}
                        >
                            {aboutData.subtitle}
                        </h3>
                    </div>

                    {/* 圖片區塊 */}
                    {aboutData.imageUrl && aboutData.imageUrl !== " " && (
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "4 / 3",
                                backgroundColor: "#F0F0F0",
                                overflow: "hidden",
                            }}
                        >
                            <img
                                src={aboutData.imageUrl}
                                alt="About intro"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    opacity: isLoaded ? 1 : 0,
                                    transition: "opacity 0.5s ease-in-out",
                                }}
                            />
                        </div>
                    )}
                </div>

                {/*右邊欄位：長篇內文 */}
                <div
                    style={{
                        flex: "1 1 min(100%, 400px)",
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            color: "#000000",
                            fontSize: "clamp(15px, 1.8vw, 24px)",
                            lineHeight: 1.8,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                        }}
                    >
                        {aboutData.content}
                    </p>
                </div>
            </div>
        </div>
    );
}