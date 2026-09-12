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

const API_HEADER = `${BASE_URL}/api/v1/content/about-ncu/about_ncu_header`;
const API_COLLEGE = `${BASE_URL}/api/v1/content/about-ncu/about_ncu_college`;
const API_FEATURES = `${BASE_URL}/api/v1/content/about-ncu/about_ncu_features`;
const API_LINKS = `${BASE_URL}/api/v1/content/about-ncu/about_ncu_links`;
const API_YT = `${BASE_URL}/api/v1/content/about-ncu/about_ncu_yt`;

const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

export default function AboutNCU({
    // 將 Framer 的 Property Controls 轉為預設 Props
    topPadding = 120,
    bottomPadding = 120,
    showLinks = true,
    showYoutube = true,
    style = {},
    locale: propLocale = "auto",
}) {
    // 若設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 中英文預設字設定
    const defaultTitle =
        currentLocale === "en-US"
            ? "About National Central University"
            : "關於國立中央大學 National Central University";

    const defaultCollegeSubtitle =
        currentLocale === "en-US"
            ? "College of Management"
            : "管理學院 College of Management";

    const [header, setHeader] = useState({
        title: "",
        introText: "",
        heroImage: "",
    });
    const [college, setCollege] = useState({ subtitle: "", contentText: "" });

    const [features, setFeatures] = useState({ title: "", items: [] });

    const [links, setLinks] = useState([]);
    const [ytVideos, setYtVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. 新增：分別控制 5 個區塊的啟用狀態
    const [isHeaderActive, setIsHeaderActive] = useState(true);
    const [isCollegeActive, setIsCollegeActive] = useState(true);
    const [isFeaturesActive, setIsFeaturesActive] = useState(true);
    const [isLinksActive, setIsLinksActive] = useState(true);
    const [isYtActive, setIsYtActive] = useState(true);

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
                `${API_COLLEGE}?locale=${currentLocale}&t=${timestamp}`,
                fetchOptions
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
            fetch(
                `${API_FEATURES}?locale=${currentLocale}&t=${timestamp}`,
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
            fetch(
                `${API_YT}?locale=${currentLocale}&t=${timestamp}`,
                fetchOptions
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
        ]).then(
            ([headerData, collegeData, featuresData, linksData, ytData]) => {
                try {
                    // 2-1. Header
                    if (headerData && headerData.is_active === false) {
                        setIsHeaderActive(false);
                    } else if (headerData?.fields) {
                        setHeader({
                            title: headerData.fields.title || defaultTitle,
                            introText: headerData.fields.intro_text || "",
                            heroImage:
                                getImageUrl(headerData.fields.hero_image) || "",
                        });
                    }

                    // 2-2. College
                    if (collegeData && collegeData.is_active === false) {
                        setIsCollegeActive(false);
                    } else if (collegeData?.fields) {
                        setCollege({
                            subtitle:
                                collegeData.fields.subtitle ||
                                defaultCollegeSubtitle,
                            contentText: collegeData.fields.content_text || "",
                        });
                    }

                    // 2-3. Features
                    if (featuresData && featuresData.is_active === false) {
                        setIsFeaturesActive(false);
                    } else {
                        const rawFeatures =
                            featuresData?.fields?.features_list ||
                            featuresData?.features_list;

                        let sectionTitle = featuresData?.fields?.section_title;
                        if (!sectionTitle) {
                            sectionTitle =
                                currentLocale === "en-US"
                                    ? "Features & Advantages of College of Management"
                                    : "管理學院特色與優勢";
                        }

                        const parsedFeatures =
                            typeof rawFeatures === "string"
                                ? JSON.parse(rawFeatures)
                                : rawFeatures || [];

                        if (Array.isArray(parsedFeatures)) {
                            setFeatures({
                                title: sectionTitle, // 儲存區塊標題
                                items: parsedFeatures
                                    .filter(
                                        (i) =>
                                            i.is_active !== false &&
                                            String(i.is_active) !== "false"
                                    )
                                    .map((i) => ({
                                        title: i.title || "",
                                        desc: i.desc || "",
                                    })),
                            });
                        } else {
                            // 防呆處理
                            setFeatures((prev) => ({
                                ...prev,
                                title: sectionTitle,
                            }));
                        }
                    }

                    // 2-4. Links
                    if (linksData && linksData.is_active === false) {
                        setIsLinksActive(false);
                    } else {
                        const rawLinks =
                            linksData?.fields?.ncu_links ||
                            linksData?.ncu_links ||
                            linksData?.fields?.about_links ||
                            linksData?.about_links ||
                            linksData?.fields?.about_ncu_links;

                        let parsedLinks = [];
                        try {
                            parsedLinks =
                                typeof rawLinks === "string"
                                    ? JSON.parse(rawLinks)
                                    : rawLinks || [];
                        } catch (e) {
                            console.error("圖片卡片 JSON 解析失敗", e);
                        }

                        if (Array.isArray(parsedLinks)) {
                            setLinks(
                                parsedLinks
                                    .filter(
                                        (i) =>
                                            i.is_active !== false &&
                                            String(i.is_active) !== "false"
                                    )
                                    .map((i) => {
                                        let cardUrl =
                                            i.link_url ||
                                            i.url ||
                                            i.summary ||
                                            "#";
                                        // 當前台為英文版且為相對路徑時，自動補上 /en 前綴
                                        if (
                                            currentLocale === "en-US" &&
                                            cardUrl.startsWith("/") &&
                                            !cardUrl.startsWith("/en")
                                        ) {
                                            cardUrl = `/en${cardUrl}`;
                                        }

                                        return {
                                            title: i.title || "",
                                            image: getImageUrl(
                                                i.image_url || i.image || ""
                                            ),
                                            url: cardUrl,
                                        };
                                    })
                            );
                        }
                    }

                    // 2-5. YouTube
                    if (ytData && ytData.is_active === false) {
                        setIsYtActive(false);
                    } else {
                        const rawYt =
                            ytData?.fields?.ncu_yt ||
                            ytData?.ncu_yt ||
                            ytData?.fields?.about_yt ||
                            ytData?.about_yt;

                        let parsedYt = [];
                        try {
                            parsedYt =
                                typeof rawYt === "string"
                                    ? JSON.parse(rawYt)
                                    : rawYt || [];
                        } catch (e) {
                            console.error("YT JSON 解析失敗", e);
                        }

                        if (Array.isArray(parsedYt)) {
                            setYtVideos(
                                parsedYt
                                    .filter(
                                        (i) =>
                                            i.is_active !== false &&
                                            String(i.is_active) !== "false"
                                    )
                                    .map((i) => ({
                                        url:
                                            i.yt_url ||
                                            i.link_url ||
                                            i.url ||
                                            i.summary ||
                                            "",
                                    }))
                            );
                        }
                    }
                } catch (e) {
                    console.error("❌ [AboutNCU] 解析錯誤", e);
                } finally {
                    setLoading(false);
                }
            }
        );
    }, [currentLocale]);

    // 3. 如果所有區塊都被停用，直接回傳 null 隱藏整個元件
    if (
        !isHeaderActive &&
        !isCollegeActive &&
        !isFeaturesActive &&
        !isLinksActive &&
        !isYtActive
    ) {
        return null;
    }

    if (loading) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    minHeight: "400px",
                    color: "#999",
                }}
            >
                {currentLocale === "en-US"
                    ? "Loading NCU details..."
                    : "載入中央大學介紹中..."}
            </div>
        );
    }

    return (
        <div
            className="page-wrapper"
            style={{
                ...style,
                width: "100%",
                overflow: "hidden",
                fontFamily: "'Noto Sans TC', 'PingFang TC', sans-serif",
                backgroundColor: "#ffffff",
            }}
        >
            <style>{`
                .page-wrapper { display: flex; flex-direction: column; align-items: center; box-sizing: border-box; }

                /* ─── Hero Section ─── */
                .hero-section {
                    box-sizing: border-box; width: 100%; height: min-content; display: flex; flex-direction: column;
                    justify-content: center; align-items: center; padding: clamp(${topPadding / 2}px, 8vw, ${topPadding}px) 30px 0px 30px;
                    background-color: #ffffff; gap: 20px; overflow: visible;
                }

                /* ─── Container ─── */
                .container {
                    width: 100%; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start;
                    max-width: 1348px; gap: 72px; padding: 0px; box-sizing: border-box; overflow: visible;
                }

                /* ─── Section Title ─── */
                .section-title {
                    box-sizing: border-box; width: 100%; height: min-content; display: flex; flex-direction: column;
                    justify-content: center; align-items: flex-start; padding: 30px 20px 0px 20px; gap: 24px; overflow: hidden;
                }
                .main-title {
                    width: 100%; color: var(--Neutral_04, #160d03); line-height: 1.2; letter-spacing: -1px;
                    font-size: clamp(36px, 5vw, 64px);
                    font-weight: 500; white-space: pre-wrap; word-wrap: break-word; margin: 0;
                }
                .intro-text {
                    width: 100%; color: var(--Neutral_03, #4a4949); text-align: left; line-height: 1.8;
                    font-size: clamp(16px, 1.5vw, 18px); white-space: pre-wrap; word-wrap: break-word; margin: 0;
                }

                /* ─── Content ─── */
                .content-block {
                    width: 100%; height: min-content; display: flex; flex-direction: column; justify-content: center;
                    align-items: center; padding: 0px; gap: 60px; overflow: visible;
                }

                /* ─── Image Wrapper ─── */
                .image-wrapper {
                    width: 100%; height: clamp(350px, 45vw, 718px); display: flex; flex-direction: row;
                    justify-content: center; align-items: center; padding: 0px; gap: 32px; overflow: hidden; border-radius: 8px;
                }
                .hero-image {
                    width: 100%; height: 100%; object-fit: cover; border-radius: 8px;
                }

                /* ─── Text (College & Features) ─── */
                .text-group {
                    width: 100%; height: min-content; display: flex; flex-direction: column; justify-content: center;
                    align-items: center; padding: 0px; gap: 10px; overflow: hidden;
                }
                .purple-subtitle {
                    width: 100%; max-width: 97%; color: var(--purple, #602a80); text-align: center; line-height: 1.2;
                    font-size: clamp(20px, 2.5vw, 24px); font-weight: 600; white-space: pre-wrap; word-wrap: break-word; margin: 0;
                }
                .college-text {
                    width: 100%; max-width: 1000px; color: var(--Neutral_04, #160d03); text-align: left; line-height: 1.8;
                    font-size: clamp(16px, 1.5vw, 18px); white-space: pre-wrap; word-wrap: break-word; margin: 0;
                }

                /* 特色清單列 */
                .feature-row {
                    width: 100%; max-width: 1000px; display: flex; flex-direction: row; gap: 40px;
                    justify-content: flex-start; align-items: flex-start; padding-top: 20px;
                }
                .feature-title-col {
                    width: 25%; color: var(--purple, #602a80); font-weight: 600; line-height: 1.6;
                    font-size: clamp(18px, 1.8vw, 22px); margin: 0;
                }
                .feature-desc-col {
                    width: 75%; color: var(--Neutral_04, #160d03); line-height: 1.8;
                    font-size: clamp(16px, 1.5vw, 18px); margin: 0; white-space: pre-wrap;
                }

                .team-section {
                    width: 100%; display: flex; flex-direction: column; align-items: center;
                    padding: 120px 30px clamp(${bottomPadding / 2}px, 8vw, ${bottomPadding}px) 30px;
                    background-color: #ffffff; gap: 40px;
                }

                .image-link-card {
                    position: relative; width: 100%; max-width: 900px; height: clamp(200px, 25vw, 300px);
                    border-radius: 4px; overflow: hidden; display: block; text-decoration: none;
                    background-color: #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .image-link-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
                .image-link-card:hover img { transform: scale(1.03); }
                .image-link-card .overlay-text {
                    position: absolute; bottom: 20px; left: 24px; color: #ffffff;
                    font-size: 14px; font-weight: 500; z-index: 2;
                    text-shadow: 0px 2px 4px rgba(0,0,0,0.6);
                }
                .image-link-card::after {
                    content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 40%;
                    background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%); z-index: 1; pointer-events: none;
                }

                .youtube-card {
                    width: 100%; max-width: 900px; aspect-ratio: 16 / 9; border-radius: 4px;
                    overflow: hidden; background-color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .youtube-card iframe { width: 100%; height: 100%; border: none; }

                @media screen and (max-width: 768px) {
                    .hero-section { padding: clamp(${topPadding / 2}px, 8vw, ${topPadding}px) 20px 0px 20px; }
                    .container { gap: 48px; }
                    .section-title { padding: 20px 10px 0px 10px; }
                    .content-block { gap: 40px; }
                    .image-wrapper { height: 250px; gap: 16px; }
                    .feature-row { flex-direction: column; gap: 12px; }
                    .feature-title-col, .feature-desc-col { width: 100%; }

                    .team-section { padding: 60px 20px clamp(${bottomPadding / 2}px, 8vw, ${bottomPadding}px) 20px; }
                    .image-link-card .overlay-text { font-size: 13px; bottom: 16px; left: 16px; }
                }
            `}</style>

            {/* 4. 如果頭部、簡介或特色介紹有啟用，才渲染上半部區塊 */}
            {(isHeaderActive || isCollegeActive || isFeaturesActive) && (
                <div className="hero-section">
                    <div className="container">
                        {/* 4-1. 渲染 Header (標題與大圖) */}
                        {isHeaderActive && (
                            <div className="section-title">
                                {header.title && (
                                    <div className="main-title">
                                        {header.title}
                                    </div>
                                )}
                                {header.introText && (
                                    <div className="intro-text">
                                        {header.introText}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="content-block">
                            {isHeaderActive && header.heroImage && (
                                <div className="image-wrapper">
                                    <img
                                        src={header.heroImage}
                                        alt="NCU Hero"
                                        className="hero-image"
                                    />
                                </div>
                            )}

                            {/* 4-2. 渲染 College (學院簡介) */}
                            {isCollegeActive &&
                                (college.subtitle || college.contentText) && (
                                    <div className="text-group">
                                        {college.subtitle && (
                                            <div className="purple-subtitle">
                                                {college.subtitle}
                                            </div>
                                        )}
                                        {college.contentText && (
                                            <div className="college-text">
                                                {college.contentText}
                                            </div>
                                        )}
                                    </div>
                                )}

                            {/* 4-3. 渲染 Features (特色與優勢) */}
                            {isFeaturesActive && (
                                <div
                                    className="text-group"
                                    style={{ gap: "20px" }}
                                >
                                    {features.title && (
                                        <div className="purple-subtitle">
                                            {features.title}
                                        </div>
                                    )}

                                    {features.items.length === 0 ? (
                                        <div
                                            style={{
                                                color: "#999",
                                                padding: "20px",
                                            }}
                                        >
                                            {currentLocale === "en-US"
                                                ? "No features data available. Please add it in the admin panel."
                                                : "尚無特色資料，請至後台新增。"}
                                        </div>
                                    ) : (
                                        features.items.map((item, index) => (
                                            <div
                                                className="feature-row"
                                                key={index}
                                            >
                                                <div className="feature-title-col">
                                                    {item.title}
                                                </div>
                                                <div className="feature-desc-col">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. 如果圖片連結卡或影片有啟用，顯示下半部區塊 */}
            {(isLinksActive || isYtActive) && (
                <div className="team-section">
                    {isLinksActive &&
                    links.length === 0 &&
                    isYtActive &&
                    ytVideos.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#ccc",
                                width: "100%",
                                padding: "20px",
                            }}
                        >
                            {currentLocale === "en-US"
                                ? "No links or video details available. Please add them in the admin panel."
                                : "⚠️ 尚無圖片或影片連結資料，請至後台新增。"}
                        </div>
                    ) : (
                        <>
                            {/* 5-1. 渲染圖片卡片 */}
                            {isLinksActive &&
                                showLinks &&
                                links.map((link, idx) => (
                                    <a
                                        href={link.url}
                                        target={
                                            link.url.includes("http")
                                                ? "_blank"
                                                : "_self"
                                        }
                                        className="image-link-card"
                                        key={`img-${idx}`}
                                    >
                                        {link.image ? (
                                            <img
                                                src={link.image}
                                                alt={link.title}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    backgroundColor: "#ddd",
                                                }}
                                            ></div>
                                        )}
                                        {link.title && (
                                            <div className="overlay-text">
                                                {link.title}
                                            </div>
                                        )}
                                    </a>
                                ))}

                            {/* 5-2. 渲染 YT 影片 */}
                            {isYtActive &&
                                showYoutube &&
                                ytVideos.map((yt, idx) => {
                                    const ytId = getYoutubeId(yt.url);
                                    if (!ytId) return null;
                                    return (
                                        <div
                                            className="youtube-card"
                                            key={`yt-${idx}`}
                                        >
                                            <iframe
                                                src={`https://www.youtube.com/embed/${ytId}`}
                                                title="YouTube video player"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    );
                                })}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}