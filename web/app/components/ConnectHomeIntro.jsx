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

export default function ConnectHomeIntro({ style }) {
    // 取得當前網址語系
    const globalLocale = detectLocale();
    const isEn = globalLocale === "en-US";

    // 讓預設載入文字支援雙語
    const defaultTitle = isEn ? "Default Title" : "預設標題";
    const defaultSubtitle = isEn ? "Default Subtitle" : "預設副標題";
    const defaultContent = isEn ? "Default Content" : "預設內文";

    // 取代 Framer 的 Data(aboutStore) 成為 React State
    const [introData, setIntroData] = useState({
        title: isEn ? "Loading title..." : "載入標題中...",
        subtitle: isEn ? "Loading subtitle..." : "載入副標題中...",
        content: isEn ? "Loading content..." : "載入內文中...",
        imageUrl: "",
        isActive: true,
    });

    useEffect(() => {
        // 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/home/intro?locale=${globalLocale}&t=${new Date().getTime()}`,
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
                    setIntroData((prev) => ({ ...prev, isActive: false }));
                    return;
                }

                const fields = data.fields ? data.fields : data;
                let finalUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa";

                if (fields.image_url) {
                    const imgPath = fields.image_url;
                    // 防呆：確保斜線不會重複或少寫
                    const parsedUrl = imgPath.startsWith("http")
                        ? imgPath
                        : `${BASE_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
                    finalUrl = `${parsedUrl}?t=${new Date().getTime()}`;
                }

                setIntroData({
                    title: fields.title || defaultTitle,
                    subtitle: fields.subtitle || defaultSubtitle,
                    content: fields.content || defaultContent,
                    imageUrl: finalUrl,
                    isActive: true,
                });
            })
            .catch((err) => {
                console.error("❌ API 連線失敗:", err);
                setIntroData({
                    title: isEn ? "Connection Failed" : "連線失敗",
                    subtitle: isEn ? "Please check server" : "請檢查後端服務",
                    content: "",
                    imageUrl: "",
                    isActive: true, // 發生錯誤時依然顯示，讓使用者看到錯誤文字
                });
            });
    }, [globalLocale, isEn, defaultTitle, defaultSubtitle, defaultContent]);

    // 如果後台設定隱藏，直接回傳 null (等同於原本 override 的 display: "none")
    if (!introData.isActive) {
        return null;
    }

    return (
        <div
            className="intro-wrapper"
            style={{
                ...style,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                padding: "80px 20px",
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .intro-container {
                    width: 100%;
                    max-width: 1200px;
                    display: flex;
                    flex-direction: column;
                    gap: 48px;
                }
                
                /* 💻 電腦版並排佈局 */
                @media (min-width: 992px) {
                    .intro-container {
                        flex-direction: row;
                        align-items: center;
                    }
                }

                .intro-text-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .intro-title {
                    font-size: clamp(28px, 4vw, 42px);
                    font-weight: 700;
                    color: #1a1a1a;
                    margin: 0;
                    line-height: 1.3;
                    white-space: pre-wrap;
                }

                .intro-subtitle {
                    font-size: clamp(18px, 2vw, 24px);
                    font-weight: 500;
                    color: #602a80;
                    margin: 0;
                }

                .intro-content {
                    font-size: clamp(16px, 1.5vw, 18px);
                    line-height: 1.8;
                    color: #4a4a4a;
                    margin: 0;
                    white-space: pre-wrap;
                }

                .intro-image-wrapper {
                    flex: 1;
                    width: 100%;
                    min-height: 300px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                }

                .intro-image {
                    width: 100%;
                    height: 100%;
                    min-height: 400px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: transparent;
                    transition: opacity 0.4s ease;
                }
            `}</style>

            <div className="intro-container">
                <div className="intro-text-content">
                    {/* 對應原本的 BindAboutTitle */}
                    <h2 className="intro-title">{introData.title}</h2>
                    
                    {/* 對應原本的 BindAboutSubtitle */}
                    <h3 className="intro-subtitle">{introData.subtitle}</h3>
                    
                    {/* 對應原本的 BindAboutContent */}
                    <p className="intro-content">{introData.content}</p>
                </div>

                {/* 對應原本的 BindAboutImage */}
                <div className="intro-image-wrapper">
                    <div
                        className="intro-image"
                        style={{
                            backgroundImage: introData.imageUrl
                                ? `url("${introData.imageUrl}")`
                                : "none",
                            opacity: introData.imageUrl ? 1 : 0,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}