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
function useContactData(currentLocale) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 使用傳入的 currentLocale
        fetch(
            `${BASE_URL}/api/v1/content/contact/contact-info?locale=${currentLocale}&t=${new Date().getTime()}`,
            { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        )
            .then((res) => res.json())
            .then((res) => {
                const fields = res.fields || {};
                setData({ ...fields, isActive: res.is_active !== false });
            })
            .catch((err) => {
                console.error("Contact API 連線失敗:", err);
                setData({ isActive: true, title: "連線中斷" });
            })
            .finally(() => setLoading(false));
    }, [currentLocale]); //  記得加入 dependencies

    return { data, loading };
}

function InfoRow({ icon, text, link, textColor }) {
    const [hover, setHover] = useState(false);

    if (!text) return null;
    const content = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transform: hover && link ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.2s ease",
            }}
        >
            <span style={{ fontSize: "22px" }}>{icon}</span>
            <span
                style={{
                    fontFamily: "'Noto Sans TC', sans-serif",
                    fontSize: "19px",
                    fontWeight: 500,
                    lineHeight: 1.7,
                    letterSpacing: "0.3px",
                    color: hover && link ? "#602A80" : textColor,
                    borderBottom:
                        link && hover
                            ? "1.5px solid #602A80"
                            : "1.5px solid transparent",
                    transition: "color 0.2s ease, border-color 0.2s ease",
                }}
            >
                {text}
            </span>
        </div>
    );
    if (link) {
        return (
            <a
                href={link}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{ textDecoration: "none", cursor: "pointer" }}
            >
                {content}
            </a>
        );
    }
    return content;
}

export default function Contact({
    // 將 Framer 的 Property Controls 轉為預設 Props
    titleFontSize = 48,
    titleColor = "#160D03",
    subtitleFontSize = 18,
    subtitleColor = "#160D03",
    panelBg = "#eef2f7",
    infoTextColor = "#602A80",
    mapHeight = 419,
    maxWidth = 1200,
    locale: propLocale = "auto",
}) {
    // 3. 判斷當前語系
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    // 將語系傳入 Hook
    const { data, loading } = useContactData(currentLocale);
    const isEn = currentLocale === "en-US";

    if (loading) {
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

    // 後台停用此區塊時直接隱藏
    if (data?.isActive === false) return null;

    const title = data?.title || (isEn ? "Contact Us" : "聯絡我們");
    const subtitle =
        data?.subtitle || (isEn ? "Leave us a message" : "請留下您的訊息");
    const email = data?.email || "";
    const phone = data?.phone || "";
    const address = data?.address || "";
    const mapAddress = data?.map_address || address;

    const encodedAddress = encodeURIComponent(mapAddress);
    const mapEmbedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
    const mapOpenUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: `${maxWidth}px`,
                margin: "0 auto",
                padding: "0 var(--page-padding-x)",
                boxSizing: "border-box",
            }}
        >
            {/* 標題區 */}
            <div
                style={{
                    textAlign: "center",
                    padding: "40px 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        fontFamily: "'Noto Sans TC', sans-serif",
                        fontSize: `clamp(31px, 5vw, ${titleFontSize}px)`,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: titleColor,
                    }}
                >
                    {title}
                </h1>
                <p
                    style={{
                        margin: 0,
                        fontFamily: "'Noto Sans TC', sans-serif",
                        fontSize: `clamp(16px, 1.5vw, ${subtitleFontSize}px)`,
                        fontWeight: 500,
                        color: subtitleColor,
                        maxWidth: "588px",
                        lineHeight: 1.7,
                    }}
                >
                    {subtitle}
                </p>
            </div>

            {/* 地圖 + 聯絡資訊 */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "stretch",
                    gap: "17px",
                    padding: "1px",
                    background: panelBg,
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    flexWrap: "wrap",
                }}
            >
                {/* 地圖 */}
                <div
                    style={{
                        flex: "1 1 400px",
                        position: "relative",
                        minHeight: `${mapHeight}px`,
                    }}
                >
                    <a
                        href={mapOpenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            zIndex: 10,
                            background: "#fff",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            color: "#333",
                            textDecoration: "none",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }}
                    >
                        {isEn
                            ? "Open in Google Maps ↗"
                            : "在 Google 地圖中開啟 ↗"}
                    </a>
                    <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height={mapHeight}
                        style={{
                            border: 0,
                            display: "block",
                            borderRadius: "8px 0 0 8px",
                        }}
                        loading="lazy"
                    />
                </div>

                {/* 聯絡資訊 */}
                <div
                    style={{
                        flex: "1 1 300px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                        padding: "24px",
                        justifyContent: "center",
                    }}
                >
                    <InfoRow
                        icon="📞"
                        text={phone}
                        link={
                            phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : ""
                        }
                        textColor={infoTextColor}
                    />
                    <InfoRow
                        icon="✉️"
                        text={email}
                        link={email ? `mailto:${email}` : ""}
                        textColor={infoTextColor}
                    />
                    <InfoRow
                        icon="📍"
                        text={address}
                        link={mapOpenUrl}
                        textColor={infoTextColor}
                    />
                </div>
            </div>
        </div>
    );
}