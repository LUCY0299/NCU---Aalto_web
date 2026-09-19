"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";
import SectionTitle from "./SectionTitle";

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

export default function EventList({
    // 將 Framer 的 Property Controls 轉為預設 Props
    limit = 0,
    gap = 24,
    detailPagePath = "/eventlist-2",
    cardColor = "#FADDCB",
    sidePadding = 40,
    showTitle = true,
    titleAlign = "center",
    titleFontSize = 64,
    titleLineHeight = 1.2,
    titleColor = "#160D03",
    locale: propLocale = "auto",
    variant = "page", // "page"（獨立頁面）｜ "home"（首頁）－預設 page 確保現有頁面不受影響
    showMoreButton = false, // 是否顯示「更多」按鈕－預設 false 確保現有頁面不受影響
    moreButtonText,
    moreButtonLink = "/event",
}) {
    const [events, setEvents] = useState([]);
    const [sectionTitle, setSectionTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(true);

    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    useEffect(() => {
        // 請求時帶上 locale 參數，讓後台回傳對應語系
        fetch(
            `${BASE_URL}/api/v1/content/events/event_news?locale=${currentLocale}&t=${new Date().getTime()}`,
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
                setSectionTitle(
                    fields.section_title ||
                        (currentLocale === "en-US" ? "Events" : "活動訊息")
                );

                let parsedList = [];
                if (fields.event_list) {
                    parsedList =
                        typeof fields.event_list === "string"
                            ? JSON.parse(fields.event_list)
                            : fields.event_list;
                }

                if (Array.isArray(parsedList)) {
                    const activeList = parsedList
                        .map((item, index) => ({ ...item, _index: index }))
                        .filter((item) => item.is_active !== false); // 保留原本單個活動的停用過濾
                    setEvents(activeList);
                }
            })
            .catch((err) => {
                console.error("EventList API 連線失敗:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentLocale]);

    // 如果整個區塊被停用，直接回傳 null 讓畫面徹底隱藏
    if (!isActive) return null;

    // 「更多」按鈕文字與連結（英文版自動補上 /en 前綴）
    const defaultMoreButtonText =
        currentLocale === "en-US" ? "More Events" : "更多 活動訊息";
    const finalMoreButtonText = moreButtonText || defaultMoreButtonText;
    let finalMoreButtonLink = moreButtonLink;
    if (
        currentLocale === "en-US" &&
        finalMoreButtonLink.startsWith("/") &&
        !finalMoreButtonLink.startsWith("/en")
    ) {
        finalMoreButtonLink = `/en${finalMoreButtonLink}`;
    }

    if (loading) {
        return (
            <div style={placeholderStyle}>
                {currentLocale === "en-US"
                    ? "Loading events..."
                    : "載入活動資料中..."}
            </div>
        );
    }

    return (
        <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
            {showTitle && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: `${gap}px`,
                    }}
                >
                    <SectionTitle
                        variant={variant}
                        as="div"
                        style={
                            variant === "home"
                                ? {
                                      // home variant：不指定字級/對齊/字重，交給 SectionTitle 的 home 樣式決定
                                      fontFamily:
                                          '"Inter Display", "Inter Display Placeholder", sans-serif',
                                      letterSpacing: "-3px",
                                      margin: 0,
                                      flex: "1 1 auto",
                                      minWidth: 0,
                                  }
                                : {
                                      // page variant（預設）：保留原本寫死的樣式，確保獨立頁面外觀不變
                                      fontFamily:
                                          '"Inter Display", "Inter Display Placeholder", sans-serif',
                                      fontSize: `${titleFontSize}px`,
                                      fontWeight: 500,
                                      letterSpacing: "-3px",
                                      lineHeight: titleLineHeight,
                                      color: titleColor,
                                      textAlign: titleAlign,
                                      margin: 0,
                                      flex: "1 1 auto",
                                      minWidth: 0,
                                  }
                        }
                    >
                        {sectionTitle}
                    </SectionTitle>

                    {showMoreButton && (
                        <a
                            href={finalMoreButtonLink}
                            style={{
                                textDecoration: "none",
                                color: "#000",
                                fontSize: "14px",
                                padding: "8px 24px",
                                border: "1px solid #000",
                                borderRadius: "999px",
                                whiteSpace: "nowrap",
                                transition: "all 0.2s ease-in-out",
                                flexShrink: 0,
                            }}
                        >
                            {finalMoreButtonText}
                        </a>
                    )}
                </div>
            )}

            {events.length === 0 ? (
                <div style={placeholderStyle}>
                    {currentLocale === "en-US"
                        ? "No events found"
                        : "目前沒有活動資料"}
                </div>
            ) : (
                <EventCards
                    events={
                        limit && limit > 0 ? events.slice(0, limit) : events
                    }
                    gap={gap}
                    sidePadding={sidePadding}
                    cardColor={cardColor}
                    detailPagePath={detailPagePath}
                    locale={currentLocale}
                />
            )}
        </div>
    );
}

function EventCards({
    events,
    gap,
    sidePadding,
    cardColor,
    detailPagePath,
    locale,
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: `${gap}px`,
                width: "100%",
                padding: `0 ${sidePadding}px`,
                boxSizing: "border-box",
            }}
        >
            {events.map((item) => (
                <EventCard
                    key={item._index}
                    item={item}
                    cardColor={cardColor}
                    detailPagePath={detailPagePath}
                    locale={locale}
                />
            ))}
        </div>
    );
}

function EventCard({ item, cardColor, detailPagePath, locale }) {
    const [hover, setHover] = useState(false);

    const imgUrl = item.image_url
        ? item.image_url.startsWith("http")
            ? item.image_url
            : `${BASE_URL}${item.image_url}`
        : "";

    // 當在英文版環境下，跳轉路徑自動補上 /en 前綴，防止跳轉時回到中文頁面
    let basePath = detailPagePath || "/eventlist-2";
    if (
        locale === "en-US" &&
        basePath.startsWith("/") &&
        !basePath.startsWith("/en")
    ) {
        basePath = `/en${basePath}`;
    }

    // ✅ 改為：直接用索引構建連結
    const detailLink = `${basePath}?index=${item._index}`;

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "56px",
                padding: "40px",
                background: cardColor || "#FADDCB",
                borderRadius: "4px",
                width: "100%",
                boxSizing: "border-box",
                transform: hover ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hover
                    ? "0 12px 24px rgba(0,0,0,0.12)"
                    : "0 0 0 rgba(0,0,0,0)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
        >
            {imgUrl && (
                <img
                    src={imgUrl}
                    style={{
                        width: "42%",
                        aspectRatio: "4 / 3",
                        objectFit: "cover",
                        borderRadius: "6px",
                        flexShrink: 0,
                    }}
                />
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    flex: 1,
                }}
            >
                <div style={{ fontSize: "18px", color: "#333" }}>
                    {formatDate(item.date, locale)}
                </div>
                <div
                    style={{
                        fontSize: "30px",
                        fontWeight: 500,
                        lineHeight: 1.4,
                        color: "#111",
                    }}
                >
                    {item.title}
                </div>
                <ReadMoreButton href={detailLink} locale={locale} />
            </div>
        </div>
    );
}

function ReadMoreButton({ href, locale }) {
    const [hover, setHover] = useState(false);

    return (
        <a
            href={href}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "inline-block",
                marginTop: "12px",
                padding: "12px 28px",
                border: "1px solid #111",
                borderRadius: "24px",
                fontSize: "15px",
                color: hover ? "#fff" : "#111",
                background: hover ? "#111" : "transparent",
                textDecoration: "none",
                width: "fit-content",
                transition: "background 0.2s ease, color 0.2s ease",
                cursor: "pointer",
            }}
        >
            {locale === "en-US" ? "Read More" : "閱讀更多"}
        </a>
    );
}

// 格式化日期：中文顯示 2026年7月29日，英文顯示 Jul 29, 2026
function formatDate(dateStr, locale) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (locale === "en-US") {
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const placeholderStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: "200px",
    color: "#999",
    background: "rgba(0,0,0,0.05)",
    borderRadius: "12px",
    padding: "20px",
};