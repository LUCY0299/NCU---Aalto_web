"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";
import SectionTitle from "./SectionTitle";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://aalto-api.mgt.ncu.edu.tw";

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

export default function AlumniList({
    // 將 Framer 的 Property Controls 轉為預設 Props
    limit = 0,
    gap = 24,
    layout = "horizontal",
    cardColor = "transparent",
    forceHideButton = false,
    locale: propLocale = "auto",
    variant = "page", // "page"（獨立頁面）｜ "home"（首頁）－預設 page 確保現有頁面不受影響
}) {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);

    // 分別控制 2 個區塊的啟用狀態
    const [isHeaderActive, setIsHeaderActive] = useState(true);
    const [isListActive, setIsListActive] = useState(true);

    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 中英文預設字設定
    const defaultTitle =
        currentLocale === "en-US" ? "Alumni Sharing" : "校友分享";
    const defaultBtnText =
        currentLocale === "en-US" ? "More Alumni Sharing" : "更多 校友分享";
    const defaultBtnLink =
        currentLocale === "en-US" ? "/alumni-sharing-all" : "/校友分享全";

    const [headerConfig, setHeaderConfig] = useState({
        title: defaultTitle,
        showButton: true,
        buttonText: defaultBtnText,
        buttonLink: defaultBtnLink,
    });

    useEffect(() => {
        // API 請求帶上 locale 參數
        Promise.all([
            fetch(
                `${BASE_URL}/api/v1/content/alumni/alumni_header?locale=${currentLocale}&t=${new Date().getTime()}`,
                { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
            fetch(
                `${BASE_URL}/api/v1/content/alumni/alumni_sharing?locale=${currentLocale}&t=${new Date().getTime()}`,
                { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
        ]).then(([headerData, listData]) => {
            try {
                // 2-1. 處理標題區塊停用邏輯
                if (headerData && headerData.is_active === false) {
                    setIsHeaderActive(false);
                } else if (headerData && headerData.fields) {
                    const showBtnVal = headerData.fields.show_button;
                    setHeaderConfig({
                        title: headerData.fields.section_title || defaultTitle,
                        showButton:
                            showBtnVal === true || showBtnVal === "true",
                        buttonText:
                            headerData.fields.button_text || defaultBtnText,
                        buttonLink:
                            headerData.fields.button_link || defaultBtnLink,
                    });
                } else {
                    setHeaderConfig({
                        title: defaultTitle,
                        showButton: true,
                        buttonText: defaultBtnText,
                        buttonLink: defaultBtnLink,
                    });
                }

                // 2-2. 處理卡片清單停用邏輯
                if (listData && listData.is_active === false) {
                    setIsListActive(false);
                } else {
                    let parsedList = [];
                    if (
                        listData &&
                        listData.fields &&
                        listData.fields.alumni_list
                    ) {
                        parsedList =
                            typeof listData.fields.alumni_list === "string"
                                ? JSON.parse(listData.fields.alumni_list)
                                : listData.fields.alumni_list;
                    } else if (listData && listData.alumni_list) {
                        parsedList =
                            typeof listData.alumni_list === "string"
                                ? JSON.parse(listData.alumni_list)
                                : listData.alumni_list;
                    }

                    if (Array.isArray(parsedList)) {
                        // 只過濾出 is_active 為 true 的項目
                        const activeList = parsedList.filter(
                            (item) => item.is_active !== false
                        );
                        setAlumni(activeList);
                    }
                }
            } catch (e) {
                console.error("❌ [AlumniList] 解析流程發生錯誤", e);
            } finally {
                setLoading(false);
            }
        });
    }, [currentLocale]);

    // 3. 若標題與清單全被停用，直接隱藏整個元件
    if (!isHeaderActive && !isListActive) return null;

    if (loading) {
        return (
            <div style={placeholderStyle}>
                {currentLocale === "en-US"
                    ? "Loading alumni data..."
                    : "載入校友資料中..."}
            </div>
        );
    }

    const displayList = limit && limit > 0 ? alumni.slice(0, limit) : alumni;

    // 是否真的會顯示「更多」按鈕（後台設定要顯示，且沒有被強制隱藏）
    const willShowButton = headerConfig.showButton && !forceHideButton;

    // 當前台為英文版時，自動將右上角的「更多」按鈕連結加上 /en 前綴
    let finalButtonLink = headerConfig.buttonLink;
    if (
        currentLocale === "en-US" &&
        finalButtonLink.startsWith("/") &&
        !finalButtonLink.startsWith("/en")
    ) {
        finalButtonLink = `/en${finalButtonLink}`;
    }

    return (
        <div className="alumni-wrapper">
            <style>{`
                .alumni-wrapper {
                    box-sizing: border-box;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: var(--page-padding-y) var(--page-padding-x);
                    background-color: #ffffff;
                    gap: var(--title-content-gap);
                }

                .alumni-header {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    max-width: 1200px;
                    gap: 16px;
                }

                .alumni-title {
                    margin: 0;
                    font-size: clamp(31px, 5vw, 48px);
                    font-weight: 500;
                    font-family: 'Noto Sans TC', sans-serif;
                    color: #000;
                    letter-spacing: -1px;
                    line-height: 1.3;
                    word-break: break-word;
                }

                .alumni-more-btn {
                    text-decoration: none;
                    color: #000;
                    font-size: 14px;
                    padding: 8px 24px;
                    border: 1px solid #000;
                    border-radius: 999px;
                    white-space: nowrap;
                    transition: all 0.2s ease-in-out;
                }

                .alumni-more-btn:hover {
                    background-color: #000;
                    color: #fff;
                }

                /* 💻【電腦版】預設：強制 3 欄網格 */
                .alumni-grid {
                    display: ${layout === "horizontal" ? "grid" : "flex"};
                    grid-template-columns: ${layout === "horizontal" ? "repeat(3, 1fr)" : "1fr"};
                    flex-direction: column; /* 垂直排版時的防呆 */
                    width: 100%;
                    max-width: 1200px;
                    gap: ${gap}px;
                }

                /* 卡片本身不用設寬度，大小完全交給外層 Grid 格子決定 */
                .alumni-card {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    width: 100%;
                    text-decoration: none;
                    background: ${cardColor || "transparent"};
                    pointer-events: auto;
                    min-width: 0;
                    transition: transform 0.3s ease;
                }

                @media (min-width: 769px) {
                    .alumni-card:hover {
                        transform: translateY(-4px);
                    }
                }

                .alumni-image {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    object-fit: cover;
                    border-radius: 4px;
                }

                .alumni-placeholder-image {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background-color: #EAEAEA;
                    border-radius: 4px;
                }

                .alumni-card-title {
                    font-size: 16px;
                    font-weight: 700;
                    line-height: 1.5;
                    color: #111;
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                /* 📱【平板版】1024px 以下：強制 2 欄網格 */
                @media screen and (max-width: 1024px) {
                    .alumni-grid {
                        grid-template-columns: ${layout === "horizontal" ? "repeat(2, 1fr)" : "1fr"};
                    }
                }

                /* 📱【手機版】768px 以下：強制 1 欄網格 */
                @media screen and (max-width: 768px) {
                    .alumni-wrapper {
                        padding: 40px var(--page-padding-x);
                        gap: 32px;
                    }
                    .alumni-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .alumni-grid {
                        grid-template-columns: 1fr; /* 強制變 1 欄 */
                    }
                }
            `}</style>

            {/* 4-1. 渲染：標題與按鈕區塊 */}
            {isHeaderActive && (
                <div className="alumni-header">
                    <SectionTitle
                        variant={variant}
                        as="h2"
                        style={
                            variant === "home"
                                ? {
                                      // home variant：不指定字級/字重/行高，交給 SectionTitle 的 home 樣式決定
                                      margin: 0,
                                      fontFamily: "'Noto Sans TC', sans-serif",
                                      letterSpacing: "-1px",
                                      wordBreak: "break-word",
                                  }
                                : {
                                      // page variant（預設）：保留原本寫死的樣式；沒有按鈕時置中，有按鈕時靠左並排
                                      margin: 0,
                                      fontSize: "clamp(31px, 5vw, 48px)",
                                      fontWeight: 500,
                                      fontFamily: "'Noto Sans TC', sans-serif",
                                      color: "#000",
                                      letterSpacing: "-1px",
                                      lineHeight: 1.3,
                                      wordBreak: "break-word",
                                      ...(willShowButton
                                          ? {}
                                          : { width: "100%", textAlign: "center" }),
                                  }
                        }
                    >
                        {headerConfig.title}
                    </SectionTitle>

                    {willShowButton && (
                        <a href={finalButtonLink} className="alumni-more-btn">
                            {headerConfig.buttonText}
                        </a>
                    )}
                </div>
            )}

            {/* 4-2. 渲染：卡片網格區塊 */}
            {isListActive &&
                (alumni.length === 0 ? (
                    <div
                        style={{
                            ...placeholderStyle,
                            background: "transparent",
                        }}
                    >
                        {currentLocale === "en-US"
                            ? "No alumni data available"
                            : "目前沒有校友分享資料"}
                    </div>
                ) : (
                    <div className="alumni-grid">
                        {displayList.map((item, index) => {
                            const imgUrl = item.image_url
                                ? item.image_url.startsWith("http")
                                    ? item.image_url
                                    : `${BASE_URL}${item.image_url}`
                                : "";

                            // 如果沒填外部連結，給予預設值 "#" 避免報錯或亂連
                            let cardLink =
                                item.link && item.link.trim() !== ""
                                    ? item.link
                                    : "#";

                            // 如果站長在連結填了站內連結 (如 /about)，英文版自動補上 /en
                            if (
                                currentLocale === "en-US" &&
                                cardLink.startsWith("/") &&
                                !cardLink.startsWith("/en")
                            ) {
                                cardLink = `/en${cardLink}`;
                            }

                            // 判斷是否為外網連結 (http開頭)，如果是才開新分頁
                            const isExternal = cardLink.startsWith("http");

                            return (
                                <a
                                    key={index}
                                    href={cardLink}
                                    target={isExternal ? "_blank" : "_self"}
                                    rel={
                                        isExternal ? "noopener noreferrer" : ""
                                    }
                                    className="alumni-card"
                                    style={{
                                        cursor:
                                            cardLink === "#"
                                                ? "default"
                                                : "pointer",
                                    }}
                                >
                                    {imgUrl ? (
                                        <img
                                            src={imgUrl}
                                            alt={item.title}
                                            className="alumni-image"
                                        />
                                    ) : (
                                        <div className="alumni-placeholder-image" />
                                    )}
                                    <div>
                                        <h3 className="alumni-card-title">
                                            {item.title ||
                                                (currentLocale === "en-US"
                                                    ? "No Title"
                                                    : "無標題")}
                                        </h3>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ))}
        </div>
    );
}