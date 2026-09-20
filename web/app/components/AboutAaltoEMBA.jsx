"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";

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

// 確認對應最新的 API 路由
const API_HEADER = `${BASE_URL}/api/v1/content/about-aalto-emba/about_header`;
const API_INTRO = `${BASE_URL}/api/v1/content/about-aalto-emba/about_intro_sec`;
const API_LINKS = `${BASE_URL}/api/v1/content/about-aalto-emba/about_links_sec`;
const API_YT = `${BASE_URL}/api/v1/content/about-aalto-emba/about_yt_sec`;

// 解析 YouTube 網址的工具
const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

export default function AboutAaltoEMBA({
    // 將 Framer 的 Property Controls 轉為預設 Props
    topPadding = 120,
    bottomPadding = 120,
    locale: propLocale = "auto",
}) {
    // 若設定為 auto，才使用自動偵測網址語系
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    const [header, setHeader] = useState({
        title: "",
        intro: "",
        heroImage: "",
    });
    const [features, setFeatures] = useState({ items: [] });
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    // 分別控制 3 個區塊的啟用狀態
    const [isHeaderActive, setIsHeaderActive] = useState(true);
    const [isIntroActive, setIsIntroActive] = useState(true);
    const [isLinksActive, setIsLinksActive] = useState(true);

    const getImageUrl = (url) => {
        if (!url) return "";
        return url.startsWith("http")
            ? url
            : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    useEffect(() => {
        const timestamp = new Date().getTime();
        const fetchOptions = {
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        };

        // 所有 API 請求皆帶上 locale 參數
        Promise.all([
            fetch(
                `${API_HEADER}?locale=${currentLocale}&t=${timestamp}`,
                fetchOptions
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
            fetch(
                `${API_INTRO}?locale=${currentLocale}&t=${timestamp}`,
                fetchOptions
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
            fetch(
                `${API_LINKS}?locale=${currentLocale}&t=${timestamp}`,
                fetchOptions
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
        ]).then(([headerData, introData, linksData]) => {
            try {
                // 2-1. 判斷「標題與大圖」區塊是否停用
                if (headerData && headerData.is_active === false) {
                    setIsHeaderActive(false);
                } else if (headerData && headerData.fields) {
                    setHeader({
                        title: headerData.fields.title || "",
                        intro: headerData.fields.content || "",
                        heroImage:
                            getImageUrl(headerData.fields.image_url) || "",
                    });
                }

                // 2-2. 判斷「特色介紹」區塊是否停用
                if (introData && introData.is_active === false) {
                    setIsIntroActive(false);
                } else {
                    let parsedIntro = [];
                    if (
                        introData &&
                        introData.fields &&
                        introData.fields.about_intro
                    ) {
                        parsedIntro =
                            typeof introData.fields.about_intro === "string"
                                ? JSON.parse(introData.fields.about_intro)
                                : introData.fields.about_intro;
                    } else if (introData && introData.about_intro) {
                        parsedIntro =
                            typeof introData.about_intro === "string"
                                ? JSON.parse(introData.about_intro)
                                : introData.about_intro;
                    }

                    if (Array.isArray(parsedIntro)) {
                        const activeIntro = parsedIntro
                            .filter((item) => item.is_active !== false)
                            .map((item) => ({
                                title: item.title || "",
                                desc:
                                    item.desc ||
                                    item.content ||
                                    item.summary ||
                                    "",
                            }));
                        setFeatures({ items: activeIntro });
                    }
                }

                // 2-3. 判斷「圖片連結卡片」區塊是否停用
                if (linksData && linksData.is_active === false) {
                    setIsLinksActive(false);
                } else {
                    let parsedLinks = [];
                    if (
                        linksData &&
                        linksData.fields &&
                        linksData.fields.about_links
                    ) {
                        parsedLinks =
                            typeof linksData.fields.about_links === "string"
                                ? JSON.parse(linksData.fields.about_links)
                                : linksData.fields.about_links;
                    } else if (linksData && linksData.about_links) {
                        parsedLinks =
                            typeof linksData.about_links === "string"
                                ? JSON.parse(linksData.about_links)
                                : linksData.about_links;
                    }

                    if (Array.isArray(parsedLinks)) {
                        const activeLinks = parsedLinks
                            .filter((item) => item.is_active !== false)
                            .map((item) => {
                                let cardUrl =
                                    item.link_url || item.summary || "#";
                                // 當前台為英文版且為相對路徑時，自動補上 /en 前綴
                                if (
                                    currentLocale === "en-US" &&
                                    cardUrl.startsWith("/") &&
                                    !cardUrl.startsWith("/en")
                                ) {
                                    cardUrl = `/en${cardUrl}`;
                                }

                                return {
                                    title:
                                        item.title ||
                                        (currentLocale === "en-US"
                                            ? "Learn more ➔"
                                            : "查看更多 ➔"),
                                    image: getImageUrl(
                                        item.image_url || item.image
                                    ),
                                    url: cardUrl,
                                };
                            });
                        setLinks(activeLinks);
                    }
                }
            } catch (e) {
                console.error("❌ [AboutAaltoEMBA] 解析流程發生錯誤", e);
            } finally {
                setLoading(false);
            }
        });
    }, [currentLocale]);

    // 如果三個區塊都被停用，直接回傳 null，讓整個大區塊在畫面上消失！
    if (!isHeaderActive && !isIntroActive && !isLinksActive) return null;

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    minHeight: "400px",
                    color: "#999",
                    backgroundColor: "#f8f9fa",
                }}
            >
                {currentLocale === "en-US"
                    ? "Loading Aalto EMBA details..."
                    : "載入 Aalto EMBA 介紹資料中..."}
            </div>
        );
    }

    return (
        <div
            className="page-wrapper"
            style={{
                width: "100%",
                overflow: "hidden",
                fontFamily: "'Noto Sans TC', 'PingFang TC', sans-serif",
            }}
        >
            <style>{`
                .hero-section { width: 100%; display: flex; flex-direction: column; align-items: center; padding: var(--page-padding-y-hero) var(--page-padding-x) 0px var(--page-padding-x); background-color: #ffffff; }

                .intro-text { font-size: clamp(16px, 2vw, 22px); font-weight: 500; color: #4a4a4a; line-height: 1.7; margin: 0; white-space: pre-wrap; }
                .hero-image { width: 100%; height: auto; object-fit: cover; border-radius: 4px; }

                .content-box { width: 100%; display: flex; flex-direction: column; padding: 20px 0px; gap: 60px; }

                .text-box {
                    box-sizing: border-box;
                    width: 100%;
                    height: min-content;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: flex-start;
                    align-content: flex-start;
                    flex-wrap: nowrap;
                    padding: 0px 40px 0px 40px;
                    overflow: hidden;
                    gap: 30px;
                    border-radius: 0px;
                    position: relative;
                }

                .feature-title {
                    flex: 1;
                    font-size: clamp(20px, 2.5vw, 26px);
                    font-weight: 550;
                    color: #5D3A9B;
                    margin: 0;
                    line-height: 1.5;
                }

                .feature-desc {
                    flex: 1;
                    font-size: clamp(20px, 2vw, 24px);
                    font-weight: 500;
                    color: #333333;
                    margin: 0;
                    line-height: 1.8;
                    white-space: pre-wrap;
                }

                .team-section { width: 100%; display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; padding: var(--page-padding-y) var(--page-padding-x); background-color: #ffffff; gap: 20px; }
                .apply-card { position: relative; flex: 1 1 300px; max-width: 600px; height: clamp(220px, 30vw, 320px); border-radius: 4px; overflow: hidden; display: block; text-decoration: none; background-color: #e0e0e0; }
                .apply-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
                .apply-card:hover img { transform: scale(1.05); }
                .card-overlay { position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px 24px 24px 24px; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%); display: flex; align-items: flex-end; }
                .card-title { color: #ffffff; font-size: clamp(18px, 2vw, 20px); font-weight: 600; gap: 8px; }

                @media screen and (max-width: 768px) {
                    .text-box { flex-direction: column; gap: 16px; padding: 0px 20px; }
                    .feature-title, .feature-desc { flex: none; width: 100%; }
                    .team-section { flex-direction: column; }
                    .apply-card { width: 100%; max-width: 100%; }
                }
            `}</style>

            {/* 如果頭部或特色介紹其中一個有啟用，就渲染上半部背景框 */}
            {(isHeaderActive || isIntroActive) && (
                <div className="hero-section">
                    <div className="about-container">
                        {/* 4-1. 渲染：標題、前言、大圖 */}
                        {isHeaderActive && (
                            <>
                                {(header.title || header.intro) && (
                                    <div className="about-section-title">
                                        {header.title && (
                                            <h1 className="about-main-title">
                                                {header.title}
                                            </h1>
                                        )}
                                        {header.intro && (
                                            <p className="intro-text">
                                                {header.intro}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {header.heroImage && (
                                    <img
                                        src={header.heroImage}
                                        alt={header.title}
                                        className="hero-image"
                                    />
                                )}
                            </>
                        )}

                        {/* 4-2. 渲染：特色介紹清單 */}
                        {isIntroActive && (
                            <div className="content-box">
                                {features.items.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            color: "#999",
                                            padding: "40px",
                                        }}
                                    >
                                        {currentLocale === "en-US"
                                            ? "No features description available. Please add it in the admin panel."
                                            : "尚無特色介紹資料，請至後台新增。"}
                                    </div>
                                ) : (
                                    features.items.map((item, index) => (
                                        <div className="text-box" key={index}>
                                            <h3 className="feature-title">
                                                {item.title}
                                            </h3>
                                            <p className="feature-desc">
                                                {item.desc}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4-3. 渲染：圖片連結卡片 */}
            {isLinksActive && (
                <div className="team-section">
                    {links.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#999",
                                width: "100%",
                            }}
                        >
                            {currentLocale === "en-US"
                                ? "No link card available. Please add it in the admin panel."
                                : "尚無圖片連結資料，請至後台新增。"}
                        </div>
                    ) : (
                        links.map((link, idx) => (
                            <a href={link.url} className="apply-card" key={idx}>
                                {link.image ? (
                                    <img src={link.image} alt={link.title} />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "#ddd",
                                        }}
                                    ></div>
                                )}
                                <div className="card-overlay">
                                    <span className="card-title">
                                        {link.title}
                                    </span>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}