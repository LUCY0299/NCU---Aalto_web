"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState, useEffect, useRef 與 IntersectionObserver)

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

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

export default function Footer({
    // 將 Framer 的 Property Controls 轉為預設 Props
    logoImage,
    footerBgColor = "#160d03",
    footerTextColor = "#ffffcf",
    footerIconColor = "#d49b38",
    locale: propLocale = "auto",
}) {
    // ✅ 改用 usePathname 取代 detectLocale()，因為 Footer 放在 layout 裡
    // 客戶端路由切換頁面時不會重新掛載，直接讀 window.location 會卡在舊路徑判斷結果
    const pathname = usePathname();
    const currentLocale =
        !propLocale || propLocale === "auto"
            ? pathname && pathname.toLowerCase().includes("/en")
                ? "en-US"
                : "zh-TW"
            : propLocale;

    const [contact, setContact] = useState({
        phone:
            currentLocale === "en-US"
                ? "+886-3-422-7151 ext. 57601"
                : "+886-3-422-7151 ext.66075",
        email:
            currentLocale === "en-US"
                ? "emba@cc.ncu.edu.tw"
                : "sharlin@ncu.edu.tw",
        address:
            currentLocale === "en-US"
                ? "No. 300, Zhongda Rd., Zhongli Dist., Taoyuan City"
                : "桃園市中壢區中大路300號 管理學院一館 志希館10樓辦公室",
        logoUrl: "",
    });
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(true); // 區塊整體的啟用狀態

    // 控制 Logo 滾動滑入動畫的狀態與 Ref
    const [logoVisible, setLogoVisible] = useState(false);
    const logoRef = useRef(null); // 移除 TS 型別標記以符合 .jsx 格式

    const getImageUrl = (url) => {
        if (!url) return "";
        return url.startsWith("http")
            ? url
            : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    // 監聽滾動：當 Logo 的頂端一進入畫面便立刻觸發由下往上滑入動畫
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setLogoVisible(true);
                }
            },
            { threshold: 0 } // 🎯 只要露出 1 像素即刻觸發，確保在頁尾能 100% 執行
        );
        if (logoRef.current) {
            observer.observe(logoRef.current);
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const timestamp = new Date().getTime();
        fetch(
            `${BASE_URL}/api/v1/content/layout/footer?locale=${currentLocale}&t=${timestamp}`,
            {
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            }
        )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                // 判斷：如果後台將整個頁尾停用，就設定狀態並提早結束
                if (data && data.is_active === false) {
                    setIsActive(false);
                    return;
                }

                if (data && data.fields) {
                    setContact({
                        phone: data.fields.phone || contact.phone,
                        email: data.fields.email || contact.email,
                        address: data.fields.address || contact.address,
                        logoUrl: data.fields.logo_image || "",
                    });
                }
            })
            .catch((err) => {
                console.error("Footer contact-info fetch failed:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentLocale]);

    // 若頁尾被停用，直接回傳 null 隱藏整個元件
    if (!isActive) return null;

    const resolvedLogoUrl =
        getImageUrl(contact.logoUrl) ||
        logoImage ||
        "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/5938d87b-ea28-4ad0-b88f-db1c5e62f6b8.png";

    return (
        <footer
            style={{
                width: "100%",
                backgroundColor: footerBgColor,
                padding: "80px 30px 60px 30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
                fontFamily:
                    "'Inter', 'Noto Sans TC', 'PingFang TC', sans-serif",
            }}
        >
            <style>{`
                .footer-container {
                    width: 100%;
                    max-width: 1348px;
                    display: flex;
                    flex-direction: column;
                    gap: 30px; /* 縮短資訊與圖片間距 */
                }

                /* 聯絡資訊列 */
                .contact-row {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: center; /* 往中間集中 */
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 30px 100px; /* 集中時的左右與上下間距 */
                    padding: 0px;
                }

                /* 🎯 超連結樣式，移除預設樣式並在 hover 時加入底線視覺回饋 */
                .contact-link {
                    text-decoration: none;
                    color: inherit;
                    cursor: pointer;
                    display: inline-block;
                }

                .contact-link:hover .contact-text {
                    text-decoration: underline;
                }

                /* 標籤容器，為 absolute 內文提供正確定位基準 */
                .contact-tag {
                    position: relative;
                    width: 249px; /* 圖示 20px + 間距 12px + 內文 217px = 249px */
                    height: 80px; /* 確保折行時有足夠高度 */
                    box-sizing: border-box;
                }

                .contact-icon {
                    position: absolute;
                    left: 0;
                    top: 2px; /* 對齊第一行文字 */
                    color: ${footerIconColor} !important;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* 絕對定位與格式（字寬 217px、行高 1.2） */
                .contact-text {
                    position: absolute;
                    left: 32px; /* 圖示 20px + 間距 12px = 32px */
                    top: 0;
                    width: 217px;
                    height: auto;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    word-break: break-word;
                    color: ${footerTextColor} !important;
                    text-align: left;
                    line-height: 1.2;
                    margin: 0;
                    font-size: 18px !important; /* P Body\\18\\Medium */
                    font-weight: 500 !important;
                }

                /* 下方 Logo 條 */
                .bottom-bar {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding-top: 30px; /* 縮短與上方間距 */

                    /* 動畫初始狀態：隱藏且下移 40px 以獲得更明顯的向上出動畫效果 */
                    opacity: 0;
                    transform: translateY(40px);
                    transition: opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1),
                                transform 1.5s cubic-bezier(0.16, 1, 0.3, 1);
                }

                /* 當下拉進入畫面被觀察到時，觸發由下往上滑入 */
                .bottom-bar.visible {
                    opacity: 1;
                    transform: translateY(0);
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
                        padding-top: 30px;
                    }
                }
            `}</style>

            <div className="footer-container">
                {/* 1. 聯絡資訊列表 */}
                <div className="contact-row">
                    {/* 電話 */}
                    <a
                        href={
                            contact.phone
                                ? `tel:${contact.phone.replace(/[^+\d]/g, "")}`
                                : "#"
                        }
                        className="contact-link"
                    >
                        <div className="contact-tag">
                            <div className="contact-icon">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.00 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                            </div>
                            <p className="contact-text">{contact.phone}</p>
                        </div>
                    </a>

                    {/* Email */}
                    <a
                        href={contact.email ? `mailto:${contact.email}` : "#"}
                        className="contact-link"
                    >
                        <div className="contact-tag">
                            <div className="contact-icon">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <p className="contact-text">{contact.email}</p>
                        </div>
                    </a>

                    {/* 地址 */}
                    <a
                        href={
                            contact.address
                                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      contact.address
                                  )}`
                                : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-link"
                    >
                        <div className="contact-tag">
                            <div className="contact-icon">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <p className="contact-text">{contact.address}</p>
                        </div>
                    </a>
                </div>

                {/* 2. 下方白底 Logo 區域 */}
                <div
                    ref={logoRef}
                    className={`bottom-bar ${logoVisible ? "visible" : ""}`}
                >
                    <img
                        src={resolvedLogoUrl}
                        alt="NCU Management Logo"
                        className="bottom-logo"
                    />
                </div>
            </div>
        </footer>
    );
}