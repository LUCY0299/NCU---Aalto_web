import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

const BASE_URL = "https://ncu-aalto-web.onrender.com"

// 自動偵測當前網址語系
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase()
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US"
        }
    }
    return "zh-TW"
}

// 1. 讓 Hook 接收 currentLocale 作為參數
function useSection(sectionKey, currentLocale) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 使用傳入的 currentLocale
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
    }, [sectionKey, currentLocale]) // 記得加入 dependencies

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
                <p
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
                </p>
            )}
            {content && (
                <p
                    style={{
                        margin: 0,
                        fontFamily:
                            '"Open Sans", "Open Sans Placeholder", sans-serif',
                        fontSize: `${contentFontSize}px`,
                        fontWeight: 400,
                        lineHeight: 1.6,
                        color: contentColor,
                        whiteSpace: "pre-line",
                    }}
                >
                    {content}
                </p>
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
        locale: propLocale, // 2. 接收 Framer 面板的語系設定
    } = props

    // 3. 判斷當前語系
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale

    // 4. 將語系傳入給 Hook
    const hero = useSection("degree-hero", currentLocale)
    const regulations = useSection("degree-regulations", currentLocale)
    const certification = useSection("degree-certification", currentLocale)

    const isEn = currentLocale === "en-US"

    if (hero.loading || regulations.loading || certification.loading) {
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

    // 5. 若三個區塊都被停用，直接隱藏整個大元件
    if (
        hero.data?.isActive === false &&
        regulations.data?.isActive === false &&
        certification.data?.isActive === false
    ) {
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
            {regulations.data?.isActive !== false && (
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
                        {regulations.data?.title ||
                            (isEn ? "Academic Regulations" : "修業規定")}
                    </h2>
                    <div style={grayFrameStyle}>
                        <div style={cardStyle}>
                            <ItemBlock
                                heading={regulations.data?.item1_heading}
                                content={regulations.data?.item1_content}
                                headingFontSize={headingFontSize}
                                headingColor={headingColor}
                                contentFontSize={contentFontSize}
                                contentColor={contentColor}
                            />
                            <ItemBlock
                                heading={regulations.data?.item2_heading}
                                content={regulations.data?.item2_content}
                                headingFontSize={headingFontSize}
                                headingColor={headingColor}
                                contentFontSize={contentFontSize}
                                contentColor={contentColor}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 學位授予 */}
            {certification.data?.isActive !== false && (
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
                        {certification.data?.title ||
                            (isEn ? "Degree Conferral" : "學位授予")}
                    </h2>
                    <div style={grayFrameStyle}>
                        <div style={cardStyle}>
                            <ItemBlock
                                heading={certification.data?.item1_heading}
                                content={certification.data?.item1_content}
                                headingFontSize={headingFontSize}
                                headingColor={headingColor}
                                contentFontSize={contentFontSize}
                                contentColor={contentColor}
                            />
                            <ItemBlock
                                heading={certification.data?.item2_heading}
                                content={certification.data?.item2_content}
                                headingFontSize={headingFontSize}
                                headingColor={headingColor}
                                contentFontSize={contentFontSize}
                                contentColor={contentColor}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(Degree, {
    locale: {
        type: ControlType.Enum,
        title: "語系 (Locale)",
        options: ["auto", "zh-TW", "en-US"],
        optionTitles: ["自動偵測 (Auto)", "繁體中文", "English"],
        defaultValue: "auto",
    },
    titleFontSize: {
        type: ControlType.Number,
        title: "Hero 標題字級",
        defaultValue: 64,
        min: 20,
        max: 100,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Hero 標題顏色",
        defaultValue: "#160D03",
    },
    subtitleFontSize: {
        type: ControlType.Number,
        title: "Hero 副標題字級",
        defaultValue: 18,
        min: 10,
        max: 40,
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Hero 副標題顏色",
        defaultValue: "#160D03",
    },
    sectionTitleFontSize: {
        type: ControlType.Number,
        title: "區塊標題字級",
        defaultValue: 48,
        min: 16,
        max: 80,
    },
    headingFontSize: {
        type: ControlType.Number,
        title: "小標字級",
        defaultValue: 20,
        min: 12,
        max: 40,
    },
    headingColor: {
        type: ControlType.Color,
        title: "小標顏色",
        defaultValue: "#160D03",
    },
    contentFontSize: {
        type: ControlType.Number,
        title: "內文字級",
        defaultValue: 18,
        min: 12,
        max: 40,
    },
    contentColor: {
        type: ControlType.Color,
        title: "內文顏色",
        defaultValue: "#3B3B3D",
    },
    cardBg: {
        type: ControlType.Color,
        title: "卡片背景",
        defaultValue: "#ffffff",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "卡片邊框色",
        defaultValue: "#E8E8E8",
    },
    sectionBg: {
        type: ControlType.Color,
        title: "區塊背景",
        defaultValue: "#F8F8F8",
    },
})