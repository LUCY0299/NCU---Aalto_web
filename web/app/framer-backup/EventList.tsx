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

export default function EventList(props) {
    const {
        limit,
        gap,
        detailPagePath,
        cardColor,
        sidePadding,
        showTitle,
        titleAlign,
        titleFontSize,
        titleLineHeight,
        titleColor,
        locale: propLocale,
    } = props

    const [events, setEvents] = useState([])
    const [sectionTitle, setSectionTitle] = useState("")
    const [loading, setLoading] = useState(true)
    const [isActive, setIsActive] = useState(true)

    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale

    useEffect(() => {
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
                if (data.is_active === false) {
                    setIsActive(false)
                    return
                }

                const fields = data.fields || {}
                setSectionTitle(
                    fields.section_title ||
                        (currentLocale === "en-US" ? "Events" : "活動訊息")
                )

                let parsedList = []
                if (fields.event_list) {
                    parsedList =
                        typeof fields.event_list === "string"
                            ? JSON.parse(fields.event_list)
                            : fields.event_list
                }

                if (Array.isArray(parsedList)) {
                    const activeList = parsedList
                        .map((item, index) => ({ ...item, _index: index }))
                        .filter((item) => item.is_active !== false)
                    setEvents(activeList)
                }
            })
            .catch((err) => {
                console.error("EventList API 連線失敗:", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [currentLocale])

    if (!isActive) return null

    if (loading) {
        return (
            <div style={placeholderStyle}>
                {currentLocale === "en-US"
                    ? "Loading events..."
                    : "載入活動資料中..."}
            </div>
        )
    }

    return (
        <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
            {showTitle && (
                <div
                    style={{
                        fontFamily:
                            '"Inter Display", "Inter Display Placeholder", sans-serif',
                        fontSize: `${titleFontSize}px`,
                        fontWeight: 500,
                        letterSpacing: "-3px",
                        lineHeight: titleLineHeight,
                        color: titleColor,
                        textAlign: titleAlign,
                        marginBottom: `${gap}px`,
                    }}
                >
                    {sectionTitle}
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
    )
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
    )
}

function EventCard({ item, cardColor, detailPagePath, locale }) {
    const [hover, setHover] = useState(false)

    const imgUrl = item.image_url
        ? item.image_url.startsWith("http")
            ? item.image_url
            : `${BASE_URL}${item.image_url}`
        : ""

    let basePath = detailPagePath || "/eventlist-2"
    if (
        locale === "en-US" &&
        basePath.startsWith("/") &&
        !basePath.startsWith("/en")
    ) {
        basePath = `/en${basePath}`
    }

    // ✅ 改為：直接用索引構建連結
    const detailLink = `${basePath}?index=${item._index}`

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
    )
}

function ReadMoreButton({ href, locale }) {
    const [hover, setHover] = useState(false)

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
    )
}

function formatDate(dateStr, locale) {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    if (locale === "en-US") {
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const placeholderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    minHeight: "200px",
    color: "#999",
    background: "rgba(0,0,0,0.05)",
    borderRadius: "12px",
    padding: "20px",
}

addPropertyControls(EventList, {
    locale: {
        type: ControlType.Enum,
        title: "語系 (Locale)",
        options: ["auto", "zh-TW", "en-US"],
        optionTitles: ["自動偵測 (Auto)", "繁體中文", "English"],
        defaultValue: "auto",
    },
    limit: {
        type: ControlType.Number,
        title: "顯示數量",
        defaultValue: 0,
        min: 0,
    },
    gap: {
        type: ControlType.Number,
        title: "卡片間距",
        defaultValue: 24,
        min: 0,
    },
    sidePadding: {
        type: ControlType.Number,
        title: "左右內距",
        defaultValue: 40,
        min: 0,
    },
    cardColor: {
        type: ControlType.Color,
        title: "卡片底色",
        defaultValue: "#FADDCB",
    },
    detailPagePath: {
        type: ControlType.String,
        title: "詳情頁路徑",
        defaultValue: "/eventlist-2",
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "顯示標題",
        defaultValue: true,
    },
    titleAlign: {
        type: ControlType.Enum,
        title: "標題對齊",
        options: ["left", "center", "right"],
        optionTitles: ["靠左", "置中", "靠右"],
        defaultValue: "center",
    },
    titleFontSize: {
        type: ControlType.Number,
        title: "標題字級",
        defaultValue: 64,
        min: 16,
        max: 100,
    },
    titleLineHeight: {
        type: ControlType.Number,
        title: "標題行高",
        defaultValue: 1.2,
        min: 1,
        max: 2,
        step: 0.1,
    },
    titleColor: {
        type: ControlType.Color,
        title: "標題顏色",
        defaultValue: "#160D03",
    },
})
