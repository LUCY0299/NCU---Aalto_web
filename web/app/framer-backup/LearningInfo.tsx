import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const BASE_URL = "https://ncu-aalto-web.onrender.com"
// 這裡已修正為正確的 page_slug "learning"
const API_URL = `${BASE_URL}/api/v1/content/learning/learning_header`

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

/**
 * @framerSupportedLayoutWidth any
 * @framerIntrinsicWidth 1440
 */
export default function LearningInfo(props) {
    const { topPadding, bottomPadding, style, locale: propLocale } = props

    // 若面板設定為 auto，才使用自動偵測網址語系，否則以面板指定為主
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale

    // 中英文預設字設定
    const defaultTitle =
        currentLocale === "en-US" ? "Learning Resources" : "學習資訊"
    const defaultDesc =
        currentLocale === "en-US"
            ? "After the enrollment of the first cohort, it is recommended to collect testimonials at the end of the first semester (around Dec 2026)."
            : "首屆學員入學後，建議於第一學期末（約2026年12月）蒐集見證，格式如下："

    const [data, setData] = useState({
        title: defaultTitle,
        heroImage: "",
        description: defaultDesc,
        isActive: true, // 1. 新增：預設為啟用狀態
    })
    const [loading, setLoading] = useState(true)

    // 處理圖片網址的輔助函數
    const getImageUrl = (url) => {
        if (!url) return ""
        return url.startsWith("http")
            ? url
            : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
    }

    useEffect(() => {
        const timestamp = new Date().getTime()
        // API 請求帶上 locale 參數
        fetch(`${API_URL}?locale=${currentLocale}&t=${timestamp}`, {
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((resData) => {
                if (resData) {
                    // 2. 判斷後台是否將此區塊停用
                    if (resData.is_active === false) {
                        setData((prev) => ({ ...prev, isActive: false }))
                        return
                    }

                    if (resData.fields) {
                        setData({
                            title: resData.fields.title || defaultTitle,
                            heroImage:
                                getImageUrl(resData.fields.hero_image) || "",
                            description:
                                resData.fields.description || defaultDesc,
                            isActive: true,
                        })
                    } else {
                        // 若該語系後台無資料，使用預設值
                        setData({
                            title: defaultTitle,
                            heroImage: "",
                            description: defaultDesc,
                            isActive: true,
                        })
                    }
                }
            })
            .catch((err) => console.error("❌ 讀取學習資訊失敗", err))
            .finally(() => setLoading(false))
    }, [currentLocale])

    // 3. 如果區塊被設為停用，直接回傳 null 讓畫面徹底隱藏
    if (!data.isActive) return null

    if (loading) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                    color: "#999",
                }}
            >
                {currentLocale === "en-US" ? "Loading..." : "載入中..."}
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                backgroundColor: "#fff",
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .learning-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: clamp(${topPadding / 2}px, 8vw, ${topPadding}px) 20px clamp(${bottomPadding / 2}px, 8vw, ${bottomPadding}px) 20px;
                    font-family: 'Noto Sans TC', sans-serif;
                }

                /* 標題樣式 */
                .learning-title {
                    font-size: clamp(36px, 5vw, 64px);
                    font-weight: 600;
                    color: #111;
                    margin-bottom: 40px;
                    text-align: center;
                    letter-spacing: 2px;
                }

                /* 圖片樣式 */
                .learning-hero-img {
                    width: 100%;
                    max-height: 600px; /* 限制最大高度避免在超大螢幕上過高 */
                    aspect-ratio: 16 / 9;
                    object-fit: cover;
                    /* 如果你希望圖片邊角是直角的，就把下面這行刪掉 */
                    /* border-radius: 4px; */ 
                    margin-bottom: 24px;
                }
                
                /* 佔位灰底圖 */
                .learning-placeholder-img {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background-color: #EAEAEA;
                    margin-bottom: 24px;
                }

                /* 描述文字樣式 */
                .learning-desc {
                    font-size: clamp(14px, 1.5vw, 20px);
                    color: #555;
                    text-align: center;
                    line-height: 1.6;
                    max-width: 900px;
                    white-space: pre-wrap; /* 支援後台的 Enter 換行 */
                }

                /* 手機版微調 */
                @media (max-width: 768px) {
                    .learning-title {
                        margin-bottom: 24px;
                    }
                    .learning-hero-img, .learning-placeholder-img {
                        margin-bottom: 16px;
                    }
                }
            `}</style>

            <div className="learning-container">
                {/* 1. 標題 */}
                {data.title && <h1 className="learning-title">{data.title}</h1>}

                {/* 2. 滿版大圖 */}
                {data.heroImage ? (
                    <img
                        src={data.heroImage}
                        alt={data.title}
                        className="learning-hero-img"
                    />
                ) : (
                    <div className="learning-placeholder-img" />
                )}

                {/* 3. 圖片下方描述 */}
                {data.description && (
                    <p className="learning-desc">{data.description}</p>
                )}
            </div>
        </div>
    )
}

// Framer 右側控制面板設定
addPropertyControls(LearningInfo, {
    locale: {
        type: ControlType.Enum,
        title: "語系 (Locale)",
        options: ["auto", "zh-TW", "en-US"],
        optionTitles: ["自動偵測 (Auto)", "繁體中文", "English"],
        defaultValue: "auto",
    },
    topPadding: {
        type: ControlType.Number,
        title: "上方留白",
        defaultValue: 80,
        min: 0,
    },
    bottomPadding: {
        type: ControlType.Number,
        title: "下方留白",
        defaultValue: 80,
        min: 0,
    },
})
