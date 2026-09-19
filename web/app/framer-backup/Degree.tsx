import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const BASE_URL = "https://ncu-aalto-web.onrender.com"

const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase()
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US"
        }
    }
    return "zh-TW"
}

function useSection(sectionKey, currentLocale) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(
            `${BASE_URL}/api/v1/content/degree/${sectionKey}?locale=${currentLocale}&t=${new Date().getTime()}`,
            { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        )
            .then((res) => res.json())
            .then((res) => {
                const fields = res.fields || {}
                setData({ ...fields, isActive: res.is_active !== false })
            })
            .catch((err) => {
                console.error(`${sectionKey} API 連線失敗:`, err)
                setData({ isActive: true, title: "連線中斷" })
            })
            .finally(() => setLoading(false))
    }, [sectionKey, currentLocale])

    return { data, loading }
}

function ItemBlock({
    heading,
    content,
    headingFontSize,
    headingColor,
    contentFontSize,
    contentColor,
}) {
    if (!heading && !content) return null
    return (
        <div>
            {heading && (
                <h3
                    style={{
                        margin: "0 0 8px 0",
                        fontFamily:
                            '"Open Sans", "Open Sans Placeholder", sans-serif',
                        fontSize: `${headingFontSize}px`,
                        fontWeight: 600,
                        lineHeight: 1,
                        color: headingColor,
                    }}
                >
                    {heading}
                </h3>
            )}
            {content && (
                <div
                    style={{
                        margin: 0,
                        fontFamily:
                            '"Open Sans", "Open Sans Placeholder", sans-serif',
                        fontSize: `${contentFontSize}px`,
                        fontWeight: 400,
                        lineHeight: 1.6,
                        color: contentColor,
                    }}
                    className="content-html"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </div>
    )
}

export default function Degree(props) {
    const {
        titleFontSize,
        titleColor,
        subtitleFontSize,
        subtitleColor,
        sectionTitleFontSize,
        headingFontSize,
        headingColor,
        contentFontSize,
        contentColor,
        cardBg,
        cardBorderColor,
        sectionBg,
        locale: propLocale,
    } = props

    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale

    const hero = useSection("degree-hero", currentLocale)
    const combined = useSection("regulations-and-certification", currentLocale)

    const isEn = currentLocale === "en-US"

    if (hero.loading || combined.loading) {
        return (
            <div
                style={{
                    padding: "60px 0",
                    textAlign: "center",
                    color: "#999",
                }}
            >
                {isEn ? "Loading..." : "載入中..."}
            </div>
        )
    }

    if (hero.data?.isActive === false && combined.data?.isActive === false) {
        return null
    }

    const cardStyle = {
        background: cardBg,
        border: `1px solid ${cardBorderColor}`,
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "23px",
        padding: "32px 50px",
        boxSizing: "border-box",
    }

    const grayFrameStyle = {
        background: sectionBg,
        borderRadius: "20px",
        padding: "10px",
    }

    // 解析字串為陣列
    const parseItems = (itemsString) => {
        if (typeof itemsString === "string") {
            try {
                return JSON.parse(itemsString)
            } catch (e) {
                console.error("JSON parse error:", e)
                return []
            }
        }
        return Array.isArray(itemsString) ? itemsString : []
    }

    const regulationsItems = parseItems(combined.data?.regulations_items)
    const certificationItems = parseItems(combined.data?.certification_items)

    return (
        <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
            {/* Hero */}
            {hero.data?.isActive !== false && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: "900px",
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "24px",
                        textAlign: "center",
                        padding: "40px 20px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: `${titleFontSize}px`,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: titleColor,
                        }}
                    >
                        {hero.data?.title ||
                            (isEn ? "Degree & Regulations" : "修業與學位")}
                    </h1>
                    {hero.data?.subtitle && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: `${subtitleFontSize}px`,
                                fontWeight: 500,
                                lineHeight: 1.7,
                                color: subtitleColor,
                                maxWidth: "588px",
                            }}
                        >
                            {hero.data.subtitle}
                        </p>
                    )}
                </div>
            )}

            {/* 修業規定 */}
            {combined.data?.isActive !== false &&
                regulationsItems.length > 0 && (
                    <div
                        style={{
                            padding: "20px",
                            width: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: `${sectionTitleFontSize}px`,
                                fontWeight: 700,
                                lineHeight: 1.3,
                                margin: "0 0 16px 0",
                            }}
                        >
                            {regulationsItems[0]?.title ||
                                (isEn ? "Academic Regulations" : "修業規定")}
                        </h2>
                        <div style={grayFrameStyle}>
                            <div style={cardStyle}>
                                {regulationsItems.map(
                                    (item, idx) =>
                                        item.is_active !== false && (
                                            <ItemBlock
                                                key={idx}
                                                heading={
                                                    idx === 0
                                                        ? null
                                                        : item.title
                                                }
                                                content={item.content}
                                                headingFontSize={
                                                    headingFontSize
                                                }
                                                headingColor={headingColor}
                                                contentFontSize={
                                                    contentFontSize
                                                }
                                                contentColor={contentColor}
                                            />
                                        )
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* 學位授予 */}
            {combined.data?.isActive !== false &&
                certificationItems.length > 0 && (
                    <div
                        style={{
                            padding: "20px",
                            width: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: `${sectionTitleFontSize}px`,
                                fontWeight: 700,
                                lineHeight: 1.3,
                                margin: "0 0 16px 0",
                            }}
                        >
                            {certificationItems[0]?.title ||
                                (isEn ? "Degree Conferral" : "學位授予")}
                        </h2>
                        <div style={grayFrameStyle}>
                            <div style={cardStyle}>
                                {certificationItems.map(
                                    (item, idx) =>
                                        item.is_active !== false && (
                                            <ItemBlock
                                                key={idx}
                                                heading={
                                                    idx === 0
                                                        ? null
                                                        : item.title
                                                }
                                                content={item.content}
                                                headingFontSize={
                                                    headingFontSize
                                                }
                                                headingColor={headingColor}
                                                contentFontSize={
                                                    contentFontSize
                                                }
                                                contentColor={contentColor}
                                            />
                                        )
                                )}
                            </div>
                        </div>
                    </div>
                )}
        </div>
    )
}

addPropertyControls(Degree, {
    titleFontSize: {
        type: ControlType.Number,
        title: "主標題大小",
        defaultValue: 64,
        min: 20,
        max: 120,
        step: 1,
    },
    titleColor: {
        type: ControlType.Color,
        title: "主標題顏色",
        defaultValue: "#160D03",
    },
    subtitleFontSize: {
        type: ControlType.Number,
        title: "副標題大小",
        defaultValue: 18,
        min: 12,
        max: 48,
        step: 1,
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "副標題顏色",
        defaultValue: "#160D03",
    },
    sectionTitleFontSize: {
        type: ControlType.Number,
        title: "區塊標題大小",
        defaultValue: 48,
        min: 24,
        max: 72,
        step: 1,
    },
    headingFontSize: {
        type: ControlType.Number,
        title: "卡片標題大小",
        defaultValue: 20,
        min: 14,
        max: 48,
        step: 1,
    },
    headingColor: {
        type: ControlType.Color,
        title: "卡片標題顏色",
        defaultValue: "#160D03",
    },
    contentFontSize: {
        type: ControlType.Number,
        title: "卡片內容大小",
        defaultValue: 23,
        min: 12,
        max: 48,
        step: 1,
    },
    contentColor: {
        type: ControlType.Color,
        title: "卡片內容顏色",
        defaultValue: "#3B3B3D",
    },
    cardBg: {
        type: ControlType.Color,
        title: "卡片背景色",
        defaultValue: "#ffffff",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "卡片邊框色",
        defaultValue: "#E8E8E8",
    },
    sectionBg: {
        type: ControlType.Color,
        title: "區塊背景色",
        defaultValue: "#F8F8F8",
    },
    locale: {
        type: ControlType.Enum,
        options: ["auto", "zh-TW", "en-US"],
        optionTitles: ["自動偵測", "繁體中文", "英文"],
        title: "語言",
        defaultValue: "auto",
    },
})
