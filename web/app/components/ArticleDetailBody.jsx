"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://aalto-api.mgt.ncu.edu.tw";

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

// 獲取索引參數
function getArticleIndex() {
    if (typeof window === "undefined") return -1;
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get("index") || "-1");
}

export default function ArticleDetailBody({
    // 將 Framer 的 Property Controls 轉為預設 Props
    fontSize = 18,
    lineHeight = 1.8,
    textColor = "#333333",
    titleFontSize = 48,
    titleColor = "#111111",
    metaColor = "#333333",
    locale: propLocale = "auto",
}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    useEffect(() => {
        const targetIndex = getArticleIndex();
        if (targetIndex < 0) {
            setLoading(false);
            return;
        }

        fetch(
            `${BASE_URL}/api/v1/content/home/latest_articles?locale=${currentLocale}&t=${new Date().getTime()}`,
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
                    typeof fields.article_list === "string"
                        ? JSON.parse(fields.article_list)
                        : fields.article_list || [];

                const item = list[targetIndex];
                if (!item || item.is_active === false) {
                    setError(
                        currentLocale === "en-US"
                            ? "Article not found"
                            : "找不到文章資料"
                    );
                    return;
                }
                setData(item);
            })
            .catch((err) => {
                console.error("ArticleDetailBody API 連線失敗:", err);
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
                    ? "Article data not found"
                    : "找不到文章資料"}
            </div>
        );

    const coverImgUrl = data.image_url
        ? data.image_url.startsWith("http")
            ? data.image_url
            : `${BASE_URL}${data.image_url}`
        : "";

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

    const meta = [data.author, displayDate].filter(Boolean).join(" · ");

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
            {meta && (
                <div
                    style={{
                        fontSize: "20px",
                        color: metaColor,
                        textAlign: "center",
                    }}
                >
                    {meta}
                </div>
            )}
            {data.title && (
                <h1
                    style={{
                        margin: 0,
                        fontFamily:
                            '"PingFang TC", "Microsoft JhengHei", -apple-system, sans-serif',
                        fontWeight: 700,
                        fontSize: `${titleFontSize}px`,
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
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                />
            )}

            {data.content ? (
                <div
                    className="article-content-html"
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight,
                        color: textColor,
                    }}
                    dangerouslySetInnerHTML={{ __html: data.content }}
                />
            ) : (
                <div style={{ padding: "20px 0", color: "#999" }}>
                    {currentLocale === "en-US"
                        ? "No details available."
                        : "此文章尚無詳細內容"}
                </div>
            )}
        </div>
    );
}
