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

export default function HeroSection({
    // 將 Framer 的 Property Controls 轉為預設 Props
    minHeight = 100,
    topPadding = 150,
    alignY = "flex-start",
    alignX = "flex-start",
    locale: propLocale = "auto",
}) {
    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 定義中英文預設字，在資料還沒載入或載入失敗時作為預備顯示
    const defaultTitle =
        currentLocale === "en-US"
            ? "National Central University × Aalto University Executive MBA Program"
            : "國立中央大學 × 阿爾托大學 高階經營管理碩士在職學位學程";

    const defaultSubtitle = "NCU × Aalto Executive MBA Program";

    const defaultDescription =
        currentLocale === "en-US"
            ? "Nordic Innovation × Asian Practice. Leading with Global Vision"
            : "北歐創新 × 亞洲實戰 Leading with Global Vision";

    const [heroData, setHeroData] = useState({
        title: defaultTitle,
        subtitle: defaultSubtitle,
        description: defaultDescription,
        imageUrl: "",
        isActive: true,
    });

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // API 請求帶上 locale 參數
        fetch(
            `${BASE_URL}/api/v1/content/home/hero?locale=${currentLocale}&t=${new Date().getTime()}`,
            {
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.is_active === false) {
                    setHeroData((prev) => ({ ...prev, isActive: false }));
                    return;
                }
                const fields = data.fields ? data.fields : data;
                let finalUrl = heroData.imageUrl;
                if (fields.image_url) {
                    const imgPath = fields.image_url;
                    finalUrl = imgPath.startsWith("http")
                        ? imgPath
                        : `${BASE_URL}${imgPath}`;
                    finalUrl = `${finalUrl}?t=${new Date().getTime()}`;
                }
                setHeroData({
                    title: fields.title || defaultTitle,
                    subtitle: fields.subtitle || defaultSubtitle,
                    description: fields.description || defaultDescription,
                    imageUrl: finalUrl,
                    isActive: true,
                });
                setIsLoaded(true);
            })
            .catch((err) => {
                console.error("Hero API 連線失敗:", err);
                // 連線失敗時，至少讓它有對應語系的預設字顯示
                setHeroData({
                    title: defaultTitle,
                    subtitle: defaultSubtitle,
                    description: defaultDescription,
                    imageUrl: "",
                    isActive: true,
                });
            });
    }, [currentLocale]);

    if (!heroData.isActive) return null;

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                minHeight: `${minHeight}vh`,
                display: "flex",
                flexDirection: "column",
                justifyContent: alignY,
                alignItems: "center",
                padding: `max(110px, var(--page-padding-y-hero)) var(--page-padding-x) var(--page-padding-y-hero)`,
                boxSizing: "border-box",
                overflow: "hidden",
                backgroundColor: "#F8F9FA",
            }}
        >
            {heroData.imageUrl && (
                <img
                    src={heroData.imageUrl}
                    alt="Hero Background"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 0,
                        opacity: 1,
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: `rgba(255, 255, 255, 0.15)`,
                    zIndex: 1,
                }}
            />

            {/* 對齊其他首頁區塊：先限制在 1200px 內置中，內部再依 alignX 決定文字靠左/置中/靠右 */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    maxWidth: "1200px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: alignX,
                }}
            >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "clamp(12px, 2vw, 24px)",
                    width: "100%",
                    maxWidth: "900px",
                    minWidth: 0,
                    textAlign:
                        alignX === "center"
                            ? "center"
                            : alignX === "flex-end"
                              ? "right"
                              : "left",
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        color: "#000000",
                        fontSize: "clamp(20px, 6vw, 56px)",
                        fontWeight: 650,
                        lineHeight: 1.35,
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "anywhere",
                    }}
                >
                    {heroData.title}
                </h1>

                <h2
                    style={{
                        margin: 0,
                        color: "#000000",
                        fontSize: "clamp(14px, 2.5vw, 24px)",
                        fontWeight: 600,
                        letterSpacing: "1px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "anywhere",
                    }}
                >
                    {heroData.subtitle}
                </h2>

                <p
                    style={{
                        margin: 0,
                        color: "#000000",
                        opacity: 0.9,
                        fontSize: "clamp(13px, 1.8vw, 18px)",
                        fontWeight: 400,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "anywhere",
                    }}
                >
                    {heroData.description}
                </p>
            </div>
            </div>
        </div>
    );
}