"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";

const BASE_URL = "https://ncu-aalto-web.onrender.com";

// 1. 自動偵測網址是否為英文版頁面
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US";
        }
    }
    return "zh-TW";
};

export default function ConnectHomeHero({ style }) {
    const globalLocale = detectLocale();
    const isEn = globalLocale === "en-US";

    // 將原本 Framer 的 Data(heroStore) 轉為 React state
    const [heroData, setHeroData] = useState({
        title: isEn ? "Loading..." : "載入中...",
        subtitle: isEn ? "Loading..." : "載入中...",
        description: isEn ? "Loading..." : "載入中...",
        isActive: true,
        imageUrl: "",
    });

    useEffect(() => {
        // 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/home/hero?locale=${globalLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                const fields = data.fields ? data.fields : data;
                
                let finalUrl = "";
                if (fields.image_url) {
                    const imgPath = fields.image_url;
                    finalUrl = imgPath.startsWith("http")
                        ? imgPath
                        : `${BASE_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
                    finalUrl = `${finalUrl}?t=${new Date().getTime()}`;
                }

                setHeroData({
                    isActive: data.is_active !== false,
                    // 預設文字雙語化防呆
                    title: fields.title || (isEn ? "Default Title" : "預設主標題"),
                    subtitle: fields.subtitle || (isEn ? "Default Subtitle" : "預設副標題"),
                    description: fields.description || (isEn ? "Default Description" : "預設敘述文字"),
                    imageUrl: finalUrl,
                });
            })
            .catch((err) => {
                console.error("Hero API 連線失敗:", err);
                setHeroData({
                    isActive: true, // 保持顯示錯誤訊息
                    title: isEn ? "Connection Failed" : "連線中斷",
                    subtitle: isEn ? "Please check server status" : "請檢查後端服務",
                    description: "",
                    imageUrl: "",
                });
            });
    }, [globalLocale, isEn]);

    // 如果後台設定隱藏，直接回傳 null (等同於原本的 display: none)
    if (!heroData.isActive) {
        return null;
    }

    // 將原本 BindHeroBackgroundImage, BindHeroBigText 等邏輯轉換為實際的 DOM 結構
    return (
        <div
            className="hero-wrapper"
            style={{
                ...style,
                width: "100%",
                // 對應 BindHeroBackgroundImage 的樣式
                backgroundImage: heroData.imageUrl ? `url("${heroData.imageUrl}")` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: heroData.imageUrl ? "transparent" : "#f0f0f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "80px 20px",
                boxSizing: "border-box",
                minHeight: "400px", // 確保沒有圖片時也有基本高度
                textAlign: "center"
            }}
        >
            <style>{`
                .hero-wrapper h1 {
                    font-size: clamp(36px, 5vw, 64px);
                    font-weight: 700;
                    margin: 0 0 16px 0;
                    color: #fff;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
                }
                .hero-wrapper h2 {
                    font-size: clamp(20px, 2.5vw, 32px);
                    font-weight: 500;
                    margin: 0 0 16px 0;
                    color: #fff;
                    text-shadow: 0 2px 6px rgba(0,0,0,0.5);
                }
                .hero-wrapper p {
                    font-size: clamp(16px, 1.5vw, 20px);
                    font-weight: 400;
                    margin: 0;
                    color: #fff;
                    max-width: 800px;
                    line-height: 1.6;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
            `}</style>

            {/* 對應 BindHeroBigText */}
            {heroData.title && <h1>{heroData.title}</h1>}
            
            {/* 對應 BindHeroMediumText */}
            {heroData.subtitle && <h2>{heroData.subtitle}</h2>}
            
            {/* 對應 BindHeroSmallText */}
            {heroData.description && <p>{heroData.description}</p>}
        </div>
    );
}