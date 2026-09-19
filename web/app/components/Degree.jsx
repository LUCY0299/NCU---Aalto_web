"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";

const BASE_URL = "https://ncu-aalto-web.onrender.com";

// 自動偵測當前網址語系
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US";
        }
    }
    return "zh-TW";
};

// 1. 讓 Hook 接收 currentLocale 作為參數
function useSection(sectionKey, currentLocale) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 使用傳入的 currentLocale
        fetch(
            `${BASE_URL}/api/v1/content/degree/${sectionKey}?locale=${currentLocale}&t=${new Date().getTime()}`,
            { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        )
            .then((res) => res.json())
            .then((res) => {
                const fields = res.fields || {};
                setData({ ...fields, isActive: res.is_active !== false });
            })
            .catch((err) => {
                console.error(`${sectionKey} API 連線失敗:`, err);
                setData({ isActive: true, title: "連線中斷" });
            })
            .finally(() => setLoading(false));
    }, [sectionKey, currentLocale]); // 記得加入 dependencies

    return { data, loading };
}

function ItemBlock({
    heading,
    content,
    headingFontSize,
    headingColor,
    contentFontSize,
    contentColor,
}) {
    if (!heading && !content) return null;
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
    );
}

export default function Degree({
    // 將 Framer 的 Property Controls 轉為預設 Props
    titleFontSize = 64,
    titleColor = "#160D03",
    subtitleFontSize = 18,
    subtitleColor = "#160D03",
    sectionTitleFontSize = 48,
    headingFontSize = 20,
    headingColor = "#160D03",
    contentFontSize = 23,
    contentColor = "#3B3B3D",
    cardBg = "#ffffff",
    cardBorderColor = "#E8E8E8",
    sectionBg = "#F8F8F8",
    locale: propLocale = "auto", // 2. 接收 Framer 面板的語系設定
}) {
    // 3. 判斷當前語系
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 4. 將語系傳入給 Hook
    const hero = useSection("degree-hero", currentLocale);
    const combined = useSection("regulations-and-certification", currentLocale);

    const isEn = currentLocale === "en-US";

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
        );
    }

    // 5. 若兩個區塊都被停用，直接隱藏整個大元件
    if (
        hero.data?.isActive === false &&
        combined.data?.isActive === false
    ) {
        return null;
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
    };

    const grayFrameStyle = {
        background: sectionBg,
        borderRadius: "20px",
        padding: "10px",
    };

    // 解析字串為陣列（後端回傳的是 JSON 字串，不是陣列）
    const parseItems = (itemsString) => {
        if (typeof itemsString === "string") {
            try {
                return JSON.parse(itemsString);
            } catch (e) {
                console.error("JSON parse error:", e);
                return [];
            }
        }
        return Array.isArray(itemsString) ? itemsString : [];
    };

    const regulationsItems = parseItems(combined.data?.regulations_items);
    const certificationItems = parseItems(combined.data?.certification_items);

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
            {combined.data?.isActive !== false && regulationsItems.length > 0 && (
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
                        {regulationsItems[0]?.title || (isEn ? "Academic Regulations" : "修業規定")}
                    </h2>
                    <div style={grayFrameStyle}>
                        <div style={cardStyle}>
                            {regulationsItems.map((item, idx) => (
                                item.is_active !== false && (
                                    <ItemBlock
                                        key={idx}
                                        heading={idx === 0 ? null : item.title}
                                        content={item.content}
                                        headingFontSize={headingFontSize}
                                        headingColor={headingColor}
                                        contentFontSize={contentFontSize}
                                        contentColor={contentColor}
                                    />
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 學位授予 */}
            {combined.data?.isActive !== false && certificationItems.length > 0 && (
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
                        {certificationItems[0]?.title || (isEn ? "Degree Conferral" : "學位授予")}
                    </h2>
                    <div style={grayFrameStyle}>
                        <div style={cardStyle}>
                            {certificationItems.map((item, idx) => (
                                item.is_active !== false && (
                                    <ItemBlock
                                        key={idx}
                                        heading={idx === 0 ? null : item.title}
                                        content={item.content}
                                        headingFontSize={headingFontSize}
                                        headingColor={headingColor}
                                        contentFontSize={contentFontSize}
                                        contentColor={contentColor}
                                    />
                                )
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}