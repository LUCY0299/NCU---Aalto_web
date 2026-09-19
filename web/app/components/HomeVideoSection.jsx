"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";
import SectionTitle from "./SectionTitle";

const BASE_URL = "https://ncu-aalto-web.onrender.com";
// 1. 更新 API 網址，對應新的 section_key: home_yt_videos
const API_URL = `${BASE_URL}/api/v1/content/home/home_yt_videos`;

const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US";
        }
    }
    return "zh-TW";
};

// 將各種 YouTube 網址轉換為 Embed 網址
const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url; // 若解析失敗則回傳原網址
};

const placeholderStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    color: "#999",
};

export default function HomeVideoSection({
    // 將 Framer 的 Property Controls 轉為預設 Props
    topPadding = 60,
    bottomPadding = 60,
    style = {},
    locale: propLocale = "auto",
    variant = "page", // "page"（獨立頁面）｜ "home"（首頁）－預設 page 確保現有頁面不受影響
}) {
    // 2. 狀態改為存放一個影片陣列 (videos)
    const [data, setData] = useState({
        isActive: true,
        videos: [],
    });
    const [loading, setLoading] = useState(true);

    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    useEffect(() => {
        const timestamp = new Date().getTime();
        fetch(`${API_URL}?locale=${currentLocale}&t=${timestamp}`, {
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((resData) => {
                if (resData) {
                    // 判斷後台是否將此區塊整塊停用
                    if (resData.is_active === false) {
                        setData((prev) => ({ ...prev, isActive: false }));
                        return;
                    }

                    // 解析清單資料
                    if (resData.fields && resData.fields.home_yt) {
                        try {
                            const parsedVideos = JSON.parse(
                                resData.fields.home_yt
                            );
                            // 過濾掉被停用的個別影片
                            const activeVideos = parsedVideos.filter(
                                (v) => v.is_active !== false
                            );
                            setData({
                                isActive: true,
                                videos: activeVideos,
                            });
                        } catch (e) {
                            console.error("❌ 解析影片清單失敗", e);
                        }
                    }
                }
            })
            .catch((err) => console.error("❌ 讀取首頁影片失敗", err))
            .finally(() => setLoading(false));
    }, [currentLocale]);

    // 3. 如果狀態被設為 false，直接回傳 null，讓畫面徹底隱藏
    if (!data.isActive) return null;

    if (loading) {
        return (
            <div style={{ ...style, ...placeholderStyle }}>
                {currentLocale === "en-US"
                    ? "Loading videos..."
                    : "載入影片中..."}
            </div>
        );
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                backgroundColor: "#fff",
                boxSizing: "border-box",
                padding: `clamp(${topPadding / 2}px, 8vw, ${topPadding}px) clamp(16px, 4vw, 30px) clamp(${bottomPadding / 2}px, 8vw, ${bottomPadding}px) clamp(16px, 4vw, 30px)`,
            }}
        >
            <style>{`
                .home-video-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 1200px; /* 對齊首頁其他區塊的寬度 */
                    margin: 0 auto;
                    font-family: 'Noto Sans TC', sans-serif;
                }

                /* 新增：每個影片區塊的容器 */
                .single-video-block {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    margin-bottom: 80px; /* 多個影片之間的間距 */
                }
                .single-video-block:last-child {
                    margin-bottom: 0;
                }

                .home-video-title {
                    font-size: clamp(24px, 3vw, 48px);
                    font-weight: 500;
                    color: #111;
                    margin: 0 0 24px 0;
                    text-align: left;
                    line-height: 1.3;
                }

                /* 16:9 自適應影片容器 */
                .video-wrapper {
                    position: relative;
                    width: 100%;
                    padding-bottom: 56.25%; /* 16:9 比例 */
                    height: 0;
                    background-color: #000;
                    border-radius: 8px; /* 加個小圓角讓外觀更現代 */
                    overflow: hidden;
                }

                .video-iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                }

                .video-placeholder {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                    font-size: 16px;
                }
            `}</style>

            <div className="home-video-container">
                {/* 4. 使用 map 迴圈渲染所有啟用的影片 */}
                {data.videos.length > 0 ? (
                    data.videos.map((video, index) => {
                        const embedUrl = getYouTubeEmbedUrl(video.yt_url);
                        return (
                            <div className="single-video-block" key={index}>
                                {video.title && (
                                    <SectionTitle
                                        variant={variant}
                                        as="h2"
                                        style={
                                            variant === "home"
                                                ? {
                                                      // home variant：不指定字級/對齊，交給 SectionTitle 的 home 樣式決定
                                                      margin: "0 0 24px 0",
                                                  }
                                                : {
                                                      // page variant（預設）：保留原本寫死的樣式，確保獨立頁面外觀不變
                                                      fontSize: "clamp(24px, 3vw, 48px)",
                                                      fontWeight: 500,
                                                      color: "#111",
                                                      margin: "0 0 24px 0",
                                                      textAlign: "left",
                                                      lineHeight: 1.3,
                                                  }
                                        }
                                    >
                                        {video.title}
                                    </SectionTitle>
                                )}

                                <div className="video-wrapper">
                                    {embedUrl ? (
                                        <iframe
                                            className="video-iframe"
                                            src={embedUrl}
                                            title={
                                                video.title || "YouTube Video"
                                            }
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <div className="video-placeholder">
                                            {currentLocale === "en-US"
                                                ? "Video URL not provided"
                                                : "尚未設定 YouTube 影片網址"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // 萬一後台清單是空的，或是全部被設為隱藏時的防呆顯示
                    <div style={{ ...placeholderStyle, minHeight: "200px" }}>
                        {currentLocale === "en-US"
                            ? "No videos available at the moment."
                            : "目前尚無影片提供顯示。"}
                    </div>
                )}
            </div>
        </div>
    );
}