"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState, useEffect 以及 window 物件)

import React, { useState, useEffect } from "react";

const BASE_URL = "https://ncu-aalto-web.onrender.com";

// 自動偵測語系
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US";
        }
    }
    return "zh-TW";
};

// 從 URL 獲取 title 參數
function getEventTitle() {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("title") || "";
}

export default function EventDetail({ style }) {
    // 取得當前網址語系
    const globalLocale = detectLocale();
    const isEn = globalLocale === "en-US";

    // 將 Framer 的 Data(detailStore) 轉為 React State
    const [detail, setDetail] = useState({
        title: isEn ? "Loading..." : "載入中...",
        date: isEn ? "Loading..." : "載入中...",
        imageUrl: "",
        imageCaption: "",
        loaded: false,
        notFound: false,
    });

    useEffect(() => {
        const targetTitle = getEventTitle();

        if (!targetTitle) {
            setDetail((prev) => ({
                ...prev,
                notFound: true,
                loaded: true,
                title: isEn ? "Event not found" : "找不到活動",
                date: "",
            }));
            return;
        }

        // 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/events/event_news?locale=${globalLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                const fields = data.fields || {};
                const list =
                    typeof fields.event_list === "string"
                        ? JSON.parse(fields.event_list)
                        : fields.event_list || [];

                // 使用標題比對來尋找正確的活動資料
                const item = list.find((x) => x.title === targetTitle);

                if (!item || item.is_active === false) {
                    setDetail({
                        notFound: true,
                        loaded: true,
                        title: isEn ? "Event not found" : "找不到活動",
                        date: "",
                        imageUrl: "",
                        imageCaption: "",
                    });
                    return;
                }

                // 處理日期格式
                let formattedDate = "";
                if (item.date) {
                    const d = new Date(item.date);
                    if (!isNaN(d.getTime())) {
                        formattedDate = isEn
                            ? d.toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                              })
                            : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
                    } else {
                        formattedDate = item.date;
                    }
                }

                // 處理圖片網址
                let finalImageUrl = "";
                if (item.image_url) {
                    finalImageUrl = item.image_url.startsWith("http")
                        ? item.image_url
                        : `${BASE_URL}${item.image_url}`;
                }

                setDetail({
                    notFound: false,
                    loaded: true,
                    title: item.title || (isEn ? "Event Details" : "活動訊息"),
                    date: formattedDate,
                    imageCaption: item.image_caption || "",
                    imageUrl: finalImageUrl,
                });
            })
            .catch((err) => {
                console.error("EventDetail API 連線失敗:", err);
                setDetail({
                    notFound: true,
                    loaded: true,
                    title: isEn ? "Connection failed" : "連線失敗",
                    date: "",
                    imageUrl: "",
                    imageCaption: "",
                });
            });
    }, [globalLocale, isEn]);

    return (
        <div
            className="event-detail-wrapper"
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#ffffff",
                padding: "60px 20px",
                boxSizing: "border-box",
                minHeight: "50vh",
            }}
        >
            <style>{`
                .event-detail-container {
                    width: 100%;
                    max-width: 1000px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .event-header {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    text-align: center;
                }

                .event-title {
                    margin: 0;
                    font-size: clamp(32px, 5vw, 48px);
                    font-weight: 700;
                    color: #1a1a1a;
                    line-height: 1.3;
                    word-break: break-word;
                }

                .event-date {
                    margin: 0;
                    font-size: clamp(16px, 2vw, 18px);
                    color: #666666;
                    font-weight: 500;
                }

                .event-image-box {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background-color: #f0f0f0;
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .event-main-image {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: transparent;
                }

                .event-loading-text {
                    color: #999;
                    font-size: 16px;
                }

                .event-caption {
                    margin: 0;
                    font-size: 15px;
                    color: #888888;
                    text-align: center;
                    font-style: italic;
                    padding: 0 16px;
                }

                /* 當找不到活動時的置中顯示 */
                .event-not-found {
                    padding: 100px 20px;
                    text-align: center;
                    color: #999;
                    font-size: 20px;
                }
            `}</style>

            {/* 如果載入完畢且找不到資料 */}
            {detail.loaded && detail.notFound ? (
                <div className="event-not-found">{detail.title}</div>
            ) : (
                <div className="event-detail-container">
                    {/* 頂部：標題與日期 */}
                    <div className="event-header">
                        <h1 className="event-title">{detail.title}</h1>
                        {detail.date && <p className="event-date">{detail.date}</p>}
                    </div>

                    {/* 圖片區塊 (對應 BindEventDetailImage 與 LoadingText) */}
                    <div className="event-image-box">
                        {!detail.loaded ? (
                            <span className="event-loading-text">
                                {isEn ? "Loading..." : "載入中..."}
                            </span>
                        ) : detail.imageUrl ? (
                            <div
                                className="event-main-image"
                                style={{
                                    backgroundImage: `url("${detail.imageUrl}")`,
                                }}
                            />
                        ) : (
                            <span className="event-loading-text">
                                {isEn ? "No image available" : "無圖片"}
                            </span>
                        )}
                    </div>

                    {/* 圖片圖說 (對應 BindEventDetailImageCaption) */}
                    {detail.loaded && detail.imageCaption && (
                        <p className="event-caption">{detail.imageCaption}</p>
                    )}
                </div>
            )}
        </div>
    );
}