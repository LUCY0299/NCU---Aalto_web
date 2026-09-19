import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const BASE_URL = "https://ncu-aalto-web.onrender.com"

// 自動偵測網址是否為英文版頁面
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase()
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US"
        }
    }
    return "zh-TW"
}

// 確認對應最新的 API 路由
const API_HEADER = `${BASE_URL}/api/v1/content/about-aalto/about_header`
const API_INTRO = `${BASE_URL}/api/v1/content/about-aalto/about_intro_sec`
const API_LINKS = `${BASE_URL}/api/v1/content/about-aalto/about_links_sec`
const API_YT = `${BASE_URL}/api/v1/content/about-aalto/about_yt_sec`

// 解析 YouTube 網址的工具
const getYoutubeId = (url) => {
    if (!url) return null
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
}

export default function AboutAalto(props) {
    const {
        topPadding,
        bottomPadding,
        showLinks = true,
        showYoutube = true,
        locale: propLocale, // 可在 Framer 面板手動指定語系
    } = props

    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale

    const defaultTitle =
        currentLocale === "en-US"
            ? "About Aalto University"
            : "關於阿爾托大學 Aalto University"

    const [header, setHeader] = useState({
        title: defaultTitle,
        topImage: "",
        topText: "",
        middleText: "",
        bottomImage: "",
    })

    const [features, setFeatures] = useState({ items: [] })
    const [links, setLinks] = useState([])
    const [ytVideos, setYtVideos] = useState([])
    const [loading, setLoading] = useState(true)

    // 1. 新增：分別控制 4 個區塊的啟用狀態
    const [isHeaderActive, setIsHeaderActive] = useState(true)
    const [isIntroActive, setIsIntroActive] = useState(true)
    const [isLinksActive, setIsLinksActive] = useState(true)
    const [isYtActive, setIsYtActive] = useState(true)

    const getImageUrl = (url) => {
        if (!url) return ""
        return url.startsWith("http")
            ? url
            : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
    }

    useEffect(() => {
        const timestamp = new Date().getTime()
        const fetchOptions = {
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }

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
            fetch(
                `${API_YT}?locale=${currentLocale}&t=${timestamp}`,
                fetchOptions
            )
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
        ]).then(([headerData, introData, linksData, ytData]) => {
            try {
                // 2-1. 判斷「標題與大圖」區塊是否停用
                if (headerData && headerData.is_active === false) {
                    setIsHeaderActive(false)
                } else if (headerData && headerData.fields) {
                    setHeader({
                        title: headerData.fields.title || defaultTitle,
                        topImage:
                            getImageUrl(headerData.fields.top_image) || "",
                        topText: headerData.fields.top_text || "",
                        middleText: headerData.fields.middle_text || "",
                        bottomImage:
                            getImageUrl(headerData.fields.bottom_image) || "",
                    })
                }

                // 2-2. 判斷「特色介紹」區塊是否停用
                if (introData && introData.is_active === false) {
                    setIsIntroActive(false)
                } else {
                    let parsedIntro = []
                    if (
                        introData &&
                        introData.fields &&
                        introData.fields.about_intro
                    ) {
                        parsedIntro =
                            typeof introData.fields.about_intro === "string"
                                ? JSON.parse(introData.fields.about_intro)
                                : introData.fields.about_intro
                    } else if (introData && introData.about_intro) {
                        parsedIntro =
                            typeof introData.about_intro === "string"
                                ? JSON.parse(introData.about_intro)
                                : introData.about_intro
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
                            }))
                        setFeatures({ items: activeIntro })
                    }
                }

                // 2-3. 判斷「圖片連結清單」區塊是否停用
                if (linksData && linksData.is_active === false) {
                    setIsLinksActive(false)
                } else {
                    let parsedLinks = []
                    if (
                        linksData &&
                        linksData.fields &&
                        linksData.fields.about_links
                    ) {
                        parsedLinks =
                            typeof linksData.fields.about_links === "string"
                                ? JSON.parse(linksData.fields.about_links)
                                : linksData.fields.about_links
                    } else if (linksData && linksData.about_links) {
                        parsedLinks =
                            typeof linksData.about_links === "string"
                                ? JSON.parse(linksData.about_links)
                                : linksData.about_links
                    }

                    if (Array.isArray(parsedLinks)) {
                        const activeLinks = parsedLinks
                            .filter((item) => item.is_active !== false)
                            .map((item) => {
                                let cardUrl =
                                    item.link_url || item.summary || "#"
                                if (
                                    currentLocale === "en-US" &&
                                    cardUrl.startsWith("/") &&
                                    !cardUrl.startsWith("/en")
                                ) {
                                    cardUrl = `/en${cardUrl}`
                                }

                                return {
                                    title: item.title || "",
                                    image: getImageUrl(
                                        item.image_url || item.image
                                    ),
                                    url: cardUrl,
                                }
                            })
                        setLinks(activeLinks)
                    }
                }

                // 2-4. 判斷「YouTube影片清單」區塊是否停用
                if (ytData && ytData.is_active === false) {
                    setIsYtActive(false)
                } else {
                    let parsedYt = []
                    if (ytData && ytData.fields && ytData.fields.about_yt) {
                        parsedYt =
                            typeof ytData.fields.about_yt === "string"
                                ? JSON.parse(ytData.fields.about_yt)
                                : ytData.fields.about_yt
                    } else if (ytData && ytData.about_yt) {
                        parsedYt =
                            typeof ytData.about_yt === "string"
                                ? JSON.parse(ytData.about_yt)
                                : ytData.about_yt
                    }

                    if (Array.isArray(parsedYt)) {
                        setYtVideos(
                            parsedYt
                                .filter((i) => i.is_active !== false)
                                .map((i) => ({
                                    url:
                                        i.link_url ||
                                        i.yt_url ||
                                        i.summary ||
                                        "",
                                }))
                        )
                    }
                }
            } catch (e) {
                console.error("❌ [AboutAalto] 解析流程發生錯誤", e)
            } finally {
                setLoading(false)
            }
        })
    }, [currentLocale])

    // 3. 若 4 個區塊全被停用，直接隱藏整個元件
    if (!isHeaderActive && !isIntroActive && !isLinksActive && !isYtActive)
        return null

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
                    ? "Loading Aalto University details..."
                    : "載入 Aalto 介紹資料中..."}
            </div>
        )
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
                .hero-section { width: 100%; display: flex; flex-direction: column; align-items: center; padding: clamp(${topPadding / 2}px, 8vw, ${topPadding}px) 30px 0px 30px; background-color: #ffffff; }
                .framer-container { width: 100%; display: flex; flex-direction: column; max-width: 1348px; gap: 72px; }
                
                .section-title { width: 100%; display: flex; flex-direction: column; padding: 20px 30px 0px 30px; gap: 24px; }
                .main-title { font-size: clamp(36px, 5vw, 64px); font-weight: 500; color: #1a1a1a; letter-spacing: -3px; line-height: 1.2; margin: 0; }
                
                .image-wrapper-split {
                    box-sizing: border-box; width: 100%; display: flex; flex-direction: row;
                    justify-content: flex-start; align-items: flex-start; padding: 10px 30px;
                    overflow: hidden; gap: 32px;
                }
                .split-image { width: 35%; max-width: 400px; object-fit: cover; border-radius: 8px; }
                .split-text { flex: 1; font-size: clamp(16px, 1.5vw, 18px); color: #333; line-height: 1.8; margin: 0; white-space: pre-wrap;}

                .image-wrapper-text {
                    box-sizing: border-box; width: 100%; display: flex; flex-direction: row;
                    justify-content: flex-start; align-items: flex-start; padding: 0px 30px;
                    overflow: hidden; gap: 32px; font-size: clamp(16px, 1.5vw, 18px); color: #333; line-height: 1.8; white-space: pre-wrap;
                }

                .image-wrapper-large {
                    width: 100%; height: clamp(350px, 45vw, 610px); display: flex; flex-direction: row; justify-content: flex-end;
                    align-items: center; overflow: hidden; padding: 0px; gap: 32px;
                }
                .large-hero-image { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }

                .content-wrapper {
                    width: 100%; display: flex; flex-direction: column;
                    justify-content: center; align-items: center; padding: 0px; gap: 60px;
                }
                .text-block {
                    width: 100%; max-width: 900px; display: flex; flex-direction: column;
                    justify-content: center; align-items: center; text-align: center; gap: 16px; padding: 0px 20px;
                }
                .text-block-title { font-size: clamp(20px, 2.5vw, 24px); font-weight: 600; color: #5D3A9B; margin: 0; }
                .text-block-desc { font-size: clamp(16px, 1.5vw, 18px); color: #333; line-height: 1.8; margin: 0; white-space: pre-wrap; text-align: left; }

                .team-section {
                    width: 100%; display: flex; flex-direction: column; align-items: center;
                    padding: 120px 30px clamp(${bottomPadding / 2}px, 8vw, ${bottomPadding}px) 30px;
                    background-color: #ffffff; gap: 40px;
                }
                
                .image-link-card {
                    position: relative; width: 100%; max-width: 900px; height: clamp(200px, 25vw, 300px);
                    border-radius: 4px; overflow: hidden; display: block; text-decoration: none;
                    background-color: #e0e0e0;
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
                    background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%); z-index: 1;
                }

                .youtube-card {
                    width: 100%; max-width: 900px; aspect-ratio: 16 / 9; border-radius: 4px;
                    overflow: hidden; background-color: #000; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .youtube-card iframe { width: 100%; height: 100%; border: none; }

                @media screen and (max-width: 768px) {
                    .image-wrapper-split { flex-direction: column; align-items: center; padding: 10px 20px; }
                    .split-image { width: 100%; max-width: 100%; margin-bottom: 20px; }
                    .image-wrapper-text { padding: 0px 20px; }
                    .image-wrapper-large { height: 250px; }
                    .team-section { padding: 60px 20px clamp(${bottomPadding / 2}px, 8vw, ${bottomPadding}px) 20px; }
                    .image-link-card .overlay-text { font-size: 13px; bottom: 16px; left: 16px; }
                }
            `}</style>

            {/* 4. 如果頭部或特色介紹有任一個啟用，就顯示上半部區塊 */}
            {(isHeaderActive || isIntroActive) && (
                <div className="hero-section">
                    <div className="framer-container">
                        {/* 4-1. 渲染：標題與圖文 */}
                        {isHeaderActive && (
                            <>
                                <div className="section-title">
                                    <h1 className="main-title">
                                        {header.title}
                                    </h1>
                                </div>

                                {(header.topImage || header.topText) && (
                                    <div className="image-wrapper-split">
                                        {header.topImage && (
                                            <img
                                                src={header.topImage}
                                                alt="Aalto Intro"
                                                className="split-image"
                                            />
                                        )}
                                        {header.topText && (
                                            <div className="split-text">
                                                {header.topText}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {header.middleText && (
                                    <div className="image-wrapper-text">
                                        <p style={{ margin: 0 }}>
                                            {header.middleText}
                                        </p>
                                    </div>
                                )}

                                {header.bottomImage && (
                                    <div className="image-wrapper-large">
                                        <img
                                            src={header.bottomImage}
                                            alt="Aalto Graduation"
                                            className="large-hero-image"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* 4-2. 渲染：特色介紹 */}
                        {isIntroActive && (
                            <div className="content-wrapper">
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
                                        <div className="text-block" key={index}>
                                            <h3 className="text-block-title">
                                                {item.title}
                                            </h3>
                                            <p className="text-block-desc">
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

            {/* 5. 如果圖片連結卡或影片有啟用，顯示下半部 */}
            {(isLinksActive || isYtActive) && (
                <div className="team-section">
                    {/* 防呆：如果雖然區塊啟用，但裡面一張圖/一部影片都沒加 */}
                    {isLinksActive &&
                    links.length === 0 &&
                    isYtActive &&
                    ytVideos.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#999",
                                width: "100%",
                            }}
                        >
                            {currentLocale === "en-US"
                                ? "No link or video details available. Please add them in the admin panel."
                                : "尚無圖片或影片連結資料，請至後台新增。"}
                        </div>
                    ) : (
                        <>
                            {/* 5-1. 渲染：圖片連結 */}
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

                            {/* 5-2. 渲染：YT影片 */}
                            {isYtActive &&
                                showYoutube &&
                                ytVideos.map((yt, idx) => {
                                    const ytId = getYoutubeId(yt.url)
                                    if (!ytId) return null
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
                                    )
                                })}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(AboutAalto, {
    locale: {
        type: ControlType.Enum,
        title: "語系 (Locale)",
        options: ["auto", "zh-TW", "en-US"],
        optionTitles: ["自動偵測 (Auto)", "繁體中文", "English"],
        defaultValue: "auto",
    },
    topPadding: {
        type: ControlType.Number,
        title: "上方留白 (最大)",
        defaultValue: 120,
        min: 0,
        max: 200,
    },
    bottomPadding: {
        type: ControlType.Number,
        title: "下方留白 (最大)",
        defaultValue: 120,
        min: 0,
        max: 200,
    },
    showLinks: {
        type: ControlType.Boolean,
        title: "顯示圖片連結",
        defaultValue: true,
        enabledTitle: "顯示",
        disabledTitle: "隱藏",
    },
    showYoutube: {
        type: ControlType.Boolean,
        title: "顯示 YT 影片",
        defaultValue: true,
        enabledTitle: "顯示",
        disabledTitle: "隱藏",
    },
})
