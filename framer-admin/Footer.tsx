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

export default function Footer(props) {
    const {
        logoImage,
        bgColor,
        textColor,
        iconColor,
        locale: propLocale,
    } = props

    const currentLocale = (!propLocale || propLocale === "auto") ? detectLocale() : propLocale

    const [contact, setContact] = useState({
        phone: currentLocale === "en-US" ? "+886-3-422-7151 ext. 57601" : "+886-3-422-7151 ext.66075",
        email: currentLocale === "en-US" ? "emba@cc.ncu.edu.tw" : "sharlin@ncu.edu.tw",
        address: currentLocale === "en-US" ? "No. 300, Zhongda Rd., Zhongli Dist., Taoyuan City" : "桃園市中壢區中大路300號 管理學院一館 志希館10樓辦公室",
        logoUrl: ""
    })
    const [loading, setLoading] = useState(true)

    const getImageUrl = (url) => {
        if (!url) return ""
        return url.startsWith("http")
            ? url
            : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
    }

    useEffect(() => {
        const timestamp = new Date().getTime()
        // 🚀 從 全站版面管理 (layout) 的 footer 區塊載入頁尾資料與 Logo
        fetch(
            `${BASE_URL}/api/v1/content/layout/footer?locale=${currentLocale}&t=${timestamp}`,
            {
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            }
        )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && data.fields) {
                    setContact({
                        phone: data.fields.phone || contact.phone,
                        email: data.fields.email || contact.email,
                        address: data.fields.address || contact.address,
                        logoUrl: data.fields.logo_image || "",
                    })
                }
            })
            .catch((err) => {
                console.error("Footer contact-info fetch failed:", err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [currentLocale])

    // 優先使用後台資料庫上傳的頁尾 Logo，否則使用 Framer 屬性面版備用 Logo，最後使用預設白底 Logo 網址
    const resolvedLogoUrl = getImageUrl(contact.logoUrl) || logoImage || "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/5938d87b-ea28-4ad0-b88f-db1c5e62f6b8.png"

    return (
        <footer
            style={{
                width: "100%",
                backgroundColor: bgColor,
                padding: "80px 30px 60px 30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
                fontFamily: "'Inter', 'Noto Sans TC', 'PingFang TC', sans-serif",
            }}
        >
            <style>{`
                .footer-container {
                    width: 100%;
                    max-width: 1348px;
                    display: flex;
                    flex-direction: column;
                    gap: 60px;
                }

                /* 聯絡資訊列 */
                .contact-row {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 32px;
                    padding: 0px;
                }

                .contact-tag {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    gap: 12px;
                }

                .contact-icon {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 2px;
                }

                /* 🎯 套用您指定的字體樣式 */
                .contact-text {
                    width: 217px;
                    height: auto;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    word-break: break-word;
                    color: ${textColor} !important;
                    text-align: left;
                    line-height: 1.2;
                    margin: 0;
                    font-size: 16px;
                    font-weight: 500;
                }

                /* 下方 Logo 條 */
                .bottom-bar {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding-top: 50px;
                }

                .bottom-logo {
                    max-width: 800px;
                    width: 100%;
                    height: auto;
                    object-fit: contain;
                }

                /* 手機版響應式 RWD */
                @media screen and (max-width: 768px) {
                    .contact-row {
                        flex-direction: column;
                        align-items: center;
                        gap: 24px;
                    }
                    .bottom-bar {
                        padding-top: 40px;
                    }
                }
            `}</style>

            <div className="footer-container">
                {/* 1. 聯絡資訊列表 */}
                <div className="contact-row">
                    {/* 電話 */}
                    <div className="contact-tag">
                        <div className="contact-icon" style={{ color: iconColor }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <p className="contact-text">
                            {contact.phone}
                        </p>
                    </div>

                    {/* Email */}
                    <div className="contact-tag">
                        <div className="contact-icon" style={{ color: iconColor }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <p className="contact-text">
                            {contact.email}
                        </p>
                    </div>

                    {/* 地址 */}
                    <div className="contact-tag">
                        <div className="contact-icon" style={{ color: iconColor }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <p className="contact-text">
                            {contact.address}
                        </p>
                    </div>
                </div>

                {/* 2. 下方白底 Logo 區域 */}
                <div className="bottom-bar">
                    <img
                        src={resolvedLogoUrl}
                        alt="NCU Management Logo"
                        className="bottom-logo"
                    />
                </div>
            </div>
        </footer>
    )
}

addPropertyControls(Footer, {
    locale: {
        type: ControlType.Enum,
        title: "語系 (Locale)",
        options: ["auto", "zh-TW", "en-US"],
        optionTitles: ["自動偵測 (Auto)", "繁體中文", "English"],
        defaultValue: "auto",
    },
    logoImage: {
        type: ControlType.Image,
        title: "Footer Logo (畫布備用底圖)",
    },
    bgColor: {
        type: ControlType.Color,
        title: "背景顏色",
        defaultValue: "#160d03",
    },
    textColor: {
        type: ControlType.Color,
        title: "文字顏色",
        defaultValue: "var(--Neutral_02, #ffffcf)",
    },
    iconColor: {
        type: ControlType.Color,
        title: "圖示顏色",
        defaultValue: "#d49b38",
    },
})
