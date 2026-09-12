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

export default function LatestArticles({
    // 將 Framer 的 Property Controls 轉為預設 Props
    limit = 4,
    sidePadding = 24,
    showTitle = true,
    titleAlign = "left",
    titleFontSize = 48,
    titleLineHeight = 1.3,
    titleColor = "#160D03",
    rowBorderColor = "#555555",
    titleTextColor = "#111111",
    metaTextColor = "#8B8B94",
    locale: propLocale = "auto",
}) {
    const [articles, setArticles] = useState([]);
    const [sectionTitle, setSectionTitle] = useState("");
    const [isActive, setIsActive] = useState(true); // 區塊整體的啟用狀態
    const [loading, setLoading] = useState(true);

    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 中英文預設字設定
    const defaultTitle =
        currentLocale === "en-US" ? "Latest Articles" : "最新文章";

    useEffect(() => {
        // API 請求帶上 locale 參數
        fetch(
            `${BASE_URL}/api/v1/content/home/latest_articles?locale=${currentLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                // 判斷：如果後台將整個區塊停用，就設定狀態並提早結束
                if (data.is_active === false) {
                    setIsActive(false);
                    return;
                }

                const fields = data.fields || {};
                setSectionTitle(fields.section_title || defaultTitle);

                let parsedList = [];
                if (fields.article_list) {
                    parsedList =
                        typeof fields.article_list === "string"
                            ? JSON.parse(fields.article_list)
                            : fields.article_list;
                }

                if (Array.isArray(parsedList)) {
                    setArticles(
                        // 這裡保留你原本寫得很好的「單篇文章」過濾邏輯
                        parsedList.filter((item) => item.is_active !== false)
                    );
                }
            })
            .catch((err) => {
                console.error("LatestArticles API 連線失敗:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentLocale]);

    // 如果整個區塊被停用，直接回傳 null 讓畫面徹底隱藏
    if (!isActive) return null;

    if (loading) {
        return (
            <div style={placeholderStyle}>
                {currentLocale === "en-US"
                    ? "Loading articles..."
                    : "載入文章中..."}
            </div>
        );
    }

    const displayList = limit && limit > 0 ? articles.slice(0, limit) : articles;

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0,
                padding: `0 ${sidePadding}px`,
                boxSizing: "border-box",
            }}
        >
            {showTitle && (
                <div
                    style={{
                        fontFamily:
                            '"Inter Display", "Inter Display Placeholder", sans-serif',
                        fontSize: `${titleFontSize}px`,
                        fontWeight: 500,
                        letterSpacing: "-2px",
                        lineHeight: titleLineHeight,
                        color: titleColor,
                        textAlign: titleAlign,
                        width: "100%",
                        marginBottom: "16px",
                    }}
                >
                    {sectionTitle}
                </div>
            )}

            {displayList.length === 0 ? (
                <div style={placeholderStyle}>
                    {currentLocale === "en-US"
                        ? "No articles found"
                        : "目前沒有文章"}
                </div>
            ) : (
                displayList.map((item, index) => (
                    <ArticleRow
                        key={index}
                        item={item}
                        borderColor={rowBorderColor}
                        titleColor={titleTextColor}
                        metaColor={metaTextColor}
                        locale={currentLocale}
                    />
                ))
            )}
        </div>
    );
}

function ArticleRow({ item, borderColor, titleColor, metaColor, locale }) {
    const [hover, setHover] = useState(false);
    const meta = [item.author, formatDate(item.date)].filter(Boolean).join(", ");

    // 當前台為英文版且為站內相對連結時，自動補上 /en 前綴
    let finalLink = item.link_url || "#";
    if (
        locale === "en-US" &&
        finalLink.startsWith("/") &&
        !finalLink.startsWith("/en")
    ) {
        finalLink = `/en${finalLink}`;
    }

    return (
        <a
            href={finalLink}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 16px",
                borderBottom: `1px solid ${borderColor}`,
                textDecoration: "none",
                gap: "24px",
                background: hover ? "#000" : "transparent",
                transition: "background 0.2s ease",
            }}
        >
            <span
                style={{
                    fontFamily:
                        '"Noto Sans", "Noto Sans Placeholder", sans-serif',
                    fontWeight: 500,
                    fontSize: "18px",
                    lineHeight: 1.4,
                    color: hover ? "#fff" : titleColor,
                    transition: "color 0.2s ease",
                    flex: 1,
                    minWidth: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {item.title}
            </span>
            {meta && (
                <span
                    style={{
                        fontFamily:
                            '"Space Grotesk", "Space Grotesk Placeholder", sans-serif',
                        fontWeight: 500,
                        fontSize: "16px",
                        color: hover ? "#fff" : metaColor,
                        transition: "color 0.2s ease",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}
                >
                    {meta}
                </span>
            )}
        </a>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const placeholderStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: "100px",
    color: "#999",
    background: "rgba(0,0,0,0.05)",
    borderRadius: "12px",
    padding: "20px",
};