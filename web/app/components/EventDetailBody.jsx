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

// 從 URL 獲取 title 參數
function getEventTitle() {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("title") || "";
}

export default function EventDetailBody({
    // 將 Framer 的 Property Controls 轉為預設 Props
    fontSize = 18,
    captionFontSize = 14,
    lineHeight = 1.8,
    textColor = "#333333",
    captionColor = "#888888",
    titleFontSize = 48,
    titleColor = "#111111",
    dateColor = "#333333",
    locale: propLocale = "auto",
}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 🚀 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    useEffect(() => {
        const targetTitle = getEventTitle();
        if (!targetTitle) {
            setError(
                currentLocale === "en-US"
                    ? "URL is missing ?title= parameter"
                    : "網址缺少 ?title= 參數"
            );
            setLoading(false);
            return;
        }

        // 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/events/event_news?locale=${currentLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((resData) => {
                const fields = resData.fields || {};
                const list =
                    typeof fields.event_list === "string"
                        ? JSON.parse(fields.event_list)
                        : fields.event_list || [];

                const item = list.find((x) => x.title === targetTitle);
                if (!item || item.is_active === false) {
                    setError(
                        currentLocale === "en-US"
                            ? `Could not find event with title: ${targetTitle}`
                            : `找不到標題為 「${targetTitle}」 的活動資料`
                    );
                    return;
                }
                setData(item);
            })
            .catch((err) => {
                console.error("EventDetailBody API 連線失敗:", err);
                setError(
                    currentLocale === "en-US"
                        ? `Connection failed: ${err.message}`
                        : `連線失敗：${err.message}`
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentLocale]);

    if (loading)
        return (
            <div style={{ padding: "20px 0", color: "#999", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                {currentLocale === "en-US" ? "Loading..." : "載入中..."}
            </div>
        );
    if (error)
        return (
            <div style={{ padding: "20px 0", color: "#c00", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                ⚠️ {error}
            </div>
        );
    if (!data)
        return (
            <div style={{ padding: "20px 0", color: "#999", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                {currentLocale === "en-US"
                    ? "Event data not found"
                    : "找不到活動資料"}
            </div>
        );

    const coverImgUrl = data.image_url
        ? data.image_url.startsWith("http")
            ? data.image_url
            : `${BASE_URL}${data.image_url}`
        : "";

    const blocks = Array.isArray(data.blocks) ? data.blocks : [];

    let displayDate = data.date || "";
    if (data.date) {
        const d = new Date(data.date);
        if (!isNaN(d.getTime())) {
            displayDate =
                currentLocale === "en-US"
                    ? d.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                      })
                    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        }
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                width: "100%",
                maxWidth: "800px", // 確保內文不會因為螢幕太寬而難以閱讀
                margin: "0 auto",
                padding: "40px 20px",
                boxSizing: "border-box",
            }}
        >
            {displayDate && (
                <div
                    style={{
                        fontSize: "20px",
                        color: dateColor,
                        textAlign: "center",
                    }}
                >
                    {displayDate}
                </div>
            )}
            {data.title && (
                <h1
                    style={{
                        margin: 0,
                        fontFamily:
                            '"PingFang TC", "Microsoft JhengHei", -apple-system, sans-serif',
                        fontWeight: 700,
                        fontSize: `clamp(28px, 4vw, ${titleFontSize}px)`, // 加入自適應
                        lineHeight: 1.4,
                        color: titleColor,
                        textAlign: "center",
                        whiteSpace: "pre-line",
                    }}
                >
                    {data.title}
                </h1>
            )}

            {coverImgUrl && (
                <img
                    src={coverImgUrl}
                    style={{
                        width: "100%",
                        borderRadius: "8px",
                        display: "block",
                        marginTop: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // 加上淡淡的陰影讓圖片更立體
                    }}
                />
            )}

            {data.image_caption && (
                <p
                    style={{
                        margin: "8px 0 20px 0",
                        fontSize: `${captionFontSize}px`,
                        fontStyle: "italic",
                        color: captionColor,
                        borderLeft: "3px solid #ccc",
                        paddingLeft: "12px",
                    }}
                >
                    {data.image_caption}
                </p>
            )}

            {blocks.length === 0 ? (
                <div style={{ padding: "20px 0", color: "#999" }}>
                    {currentLocale === "en-US"
                        ? "No details available."
                        : "此活動尚無詳細內容"}
                </div>
            ) : (
                blocks.map((block, index) => (
                    <div key={index} style={{ marginBottom: "16px" }}>
                        {block.type === "text" && (
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: `${fontSize}px`,
                                    lineHeight,
                                    color: textColor,
                                    whiteSpace: "pre-wrap", // 確保斷行能正確顯示
                                }}
                            >
                                {block.text}
                            </p>
                        )}
                        {block.type === "image" && block.image_url && (
                            <img
                                src={
                                    block.image_url.startsWith("http")
                                        ? block.image_url
                                        : `${BASE_URL}${block.image_url}`
                                }
                                style={{
                                    width: "100%",
                                    borderRadius: "8px",
                                    display: "block",
                                    margin: "20px 0 8px 0",
                                }}
                            />
                        )}
                        {block.type === "caption" && (
                            <p
                                style={{
                                    margin: "0 0 20px 0",
                                    fontSize: `${captionFontSize}px`,
                                    fontStyle: "italic",
                                    color: captionColor,
                                    borderLeft: "3px solid #ccc",
                                    paddingLeft: "12px",
                                }}
                            >
                                {block.text}
                            </p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}