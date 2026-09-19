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
        // ✅ 防止競態條件：語系判斷在 SSR/hydration 之間可能先算錯再修正，
        // 導致舊語系（例如中文）的請求比新語系（英文）的請求更晚回來，
        // 用 ignore 旗標確保只有「最新一次」的請求結果會被採用
        let ignore = false;

        // 使用傳入的 currentLocale
        fetch(
            `${BASE_URL}/api/v1/content/degree/${sectionKey}?locale=${currentLocale}&t=${new Date().getTime()}`,
            { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        )
            .then((res) => res.json())
            .then((res) => {
                if (ignore) return;
                const fields = res.fields || {};
                setData({ ...fields, isActive: res.is_active !== false });
            })
            .catch((err) => {
                if (ignore) return;
                console.error(`${sectionKey} API 連線失敗:`, err);
                setData({ isActive: true, title: "連線中斷" });
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });

        return () => {
            ignore = true;
        };
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
                        fontSize: `clamp(18px, 1.8vw, ${headingFontSize}px)`,
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
                        fontSize: `clamp(16px, 1.5vw, ${contentFontSize}px)`,
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
    titleFontSize = 48,
    titleColor = "#160D03",
    subtitleFontSize = 18,
    subtitleColor = "#160D03",
    sectionTitleFontSize = 36,
    headingFontSize = 22,
    headingColor = "#160D03",
    contentFontSize = 18,
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
        overflow: "hidden",
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
                        gap: "12px",
                        textAlign: "center",
                        padding: "40px var(--page-padding-x)",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontFamily: "'Noto Sans TC', sans-serif",
                            fontSize: `clamp(31px, 5vw, ${titleFontSize}px)`,
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
                                fontFamily: "'Noto Sans TC', sans-serif",
                                fontSize: `clamp(16px, 1.5vw, ${subtitleFontSize}px)`,
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
                        padding: "0 var(--page-padding-x) var(--page-padding-y) var(--page-padding-x)",
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    <h2
                        style={{
                            fontSize: `clamp(24px, 3.5vw, ${sectionTitleFontSize}px)`,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            margin: "0 0 var(--title-content-gap) 0",
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
                        // 上方的間距已由「修業規定」區塊的 padding-bottom 提供，這裡去掉 padding-top 避免疊加成兩倍
                        padding: "0 var(--page-padding-x) var(--page-padding-y) var(--page-padding-x)",
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    <h2
                        style={{
                            fontSize: `clamp(24px, 3.5vw, ${sectionTitleFontSize}px)`,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            margin: "0 0 var(--title-content-gap) 0",
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