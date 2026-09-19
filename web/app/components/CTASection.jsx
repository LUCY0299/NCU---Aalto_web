"use client"; // Next.js 標記為客戶端元件 (因為有使用 useState 和 useEffect)

import React, { useState, useEffect } from "react";
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

export default function CTASection({
    // 將 Framer 的 Property Controls 轉為預設 Props
    titleText = "",
    buttonText = "",
    buttonLink = "",
    leftImage,
    rightImage,
    leftDecoImage,
    rightDecoImage,
    sectionBg = "#602A80",
    ctaTitleColor = "#ffffff",
    locale: propLocale = "auto",
}) {
    // ✅ 改用 usePathname 取代 detectLocale()，因為 CTASection 放在 layout 裡
    // 客戶端路由切換頁面時不會重新掛載，直接讀 window.location 會卡在舊路徑判斷結果
    const pathname = usePathname();
    const currentLocale =
        !propLocale || propLocale === "auto"
            ? pathname && pathname.toLowerCase().includes("/en")
                ? "en-US"
                : "zh-TW"
            : propLocale;
    const isEn = currentLocale === "en-US";

    // 儲存從後台 API 取得的動態內容
    const [dbContent, setDbContent] = useState({
        title: "",
        buttonText: "",
        buttonLink: "",
        leftImage: "",
        rightImage: "",
    });

    // 區塊整體的啟用狀態
    const [isActive, setIsActive] = useState(true);

    const getImageUrl = (url) => {
        if (!url) return "";
        return url.startsWith("http")
            ? url
            : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    // 從 Supabase 後台 API 讀取內容
    useEffect(() => {
        const timestamp = new Date().getTime();
        fetch(
            `${BASE_URL}/api/v1/content/layout/cta_section?locale=${currentLocale}&t=${timestamp}`,
            {
                headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            }
        )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && data.is_active === false) {
                    setIsActive(false);
                    return;
                }

                if (data && data.fields) {
                    setDbContent({
                        title: data.fields.title || "",
                        buttonText: data.fields.button_text || "",
                        buttonLink: data.fields.button_link || "",
                        leftImage: data.fields.left_image || "",
                        rightImage: data.fields.right_image || "",
                    });
                }
            })
            .catch((err) => {
                console.error("CTA Section API fetch failed:", err);
            });
    }, [currentLocale]);

    if (!isActive) return null;

    const resolvedTitle =
        dbContent.title ||
        titleText ||
        (isEn
            ? "Join us and unlock new perspectives on Nordic innovation management!"
            : "跟著我們，一起解鎖北歐\n創新管理新思維！");

    const resolvedButtonText =
        dbContent.buttonText || buttonText || (isEn ? "Contact Us" : "聯絡我們");

    let resolvedButtonLink =
        dbContent.buttonLink ||
        buttonLink ||
        (isEn ? "/en/contact" : "/contact");

    if (
        isEn &&
        resolvedButtonLink.startsWith("/") &&
        !resolvedButtonLink.startsWith("/en")
    ) {
        resolvedButtonLink = `/en${resolvedButtonLink}`;
    }

    const resolvedLeftImage =
        getImageUrl(dbContent.leftImage) ||
        leftImage ||
        "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-aalto/9a41fe87-23a8-448c-bc67-e4ed7203e7cf.jpg";

    const resolvedRightImage =
        getImageUrl(dbContent.rightImage) ||
        rightImage ||
        "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/7b6f1d3b-bf99-4ba3-ab27-512c0a9693be.jpg";

    const handleButtonClick = (e) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            window.location.href = resolvedButtonLink;
        }
    };

    return (
        <section className="cta-section">
            <style>{`
                /* 🌟 防點擊反藍閃爍 🌟 */
                .cta-section a, .cta-section button {
                    -webkit-tap-highlight-color: transparent !important;
                    outline: none !important;
                }

                .cta-section {
                    position: relative;
                    width: 100%;
                    height: 500px; /* 寬螢幕固定高度 */
                    background-color: ${sectionBg};
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden; /* 防止漂浮線條超出邊界 */
                    padding: 0px;
                    box-sizing: border-box;
                    transition: height 0.3s ease;
                }

                .cta-inner-container {
                    position: relative;
                    width: 100%;
                    max-width: 1348px;
                    height: 100%;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    margin: 0 auto;
                    box-sizing: border-box;
                    padding: 0 24px;
                }

                .cta-content-wrapper {
                    position: relative;
                    width: 100%;
                    max-width: 620px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 32px;
                    z-index: 10;
                    text-align: center;
                }

                .cta-title {
                    width: 100%;
                    height: auto;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    word-break: break-word;
                    color: ${ctaTitleColor || "#ffffff"} !important;
                    text-align: center;
                    line-height: 1.35 !important;
                    font-size: 48px !important;
                    font-family: 'Noto Sans TC', 'Inter', sans-serif !important;
                    font-weight: 500 !important;
                    margin: 0;
                }

                .cta-btn {
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    padding: 16px 64px;
                    min-width: 200px;
                    background-color: #ffffff;
                    border-radius: 30px;
                    text-decoration: none;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    box-sizing: border-box;
                }

                .cta-btn-text {
                    width: auto;
                    height: auto;
                    white-space: pre;
                    color: #160d03 !important;
                    font-size: 16px;
                    font-family: 'Noto Sans TC', sans-serif !important;
                    font-weight: 600;
                    line-height: 1.2;
                    transition: color 0.3s ease;
                }

                .cta-btn:hover {
                    background-color: #160d03 !important;
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .cta-btn:hover .cta-btn-text {
                    color: #ffffff !important;
                }

                @keyframes float-left {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(-15px, -6px) rotate(-3deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                @keyframes float-right {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(15px, -6px) rotate(3deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }

                .left-image-group {
                    position: absolute;
                    left: 48px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 250px;
                    height: 350px;
                    overflow: visible;
                    transition: all 0.3s ease;
                }

                .left-photo {
                    position: absolute;
                    left: 20px;
                    top: 15px;
                    width: 210px;
                    height: 250px;
                    object-fit: cover;
                    border-radius: 8px;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
                    z-index: 2;
                }

                .left-deco {
                    position: absolute;
                    left: -10px;
                    top: 160px;
                    width: 270px;
                    height: auto;
                    z-index: 1;
                    animation: float-left 6s ease-in-out infinite;
                }

                .right-image-group {
                    position: absolute;
                    right: 48px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 250px;
                    height: 350px;
                    overflow: visible;
                    transition: all 0.3s ease;
                }

                .right-photo {
                    position: absolute;
                    right: 20px;
                    top: 15px;
                    width: 210px;
                    height: 250px;
                    object-fit: cover;
                    border-radius: 8px;
                    transform: rotate(8deg);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
                    z-index: 2;
                }

                .right-deco {
                    position: absolute;
                    right: -10px;
                    top: 170px;
                    width: 280px;
                    height: auto;
                    z-index: 1;
                    animation: float-right 6s ease-in-out infinite;
                }

                /* 🌟 中等螢幕響應式（1025px ~ 1199px）：縮小左右裝飾，騰出文字空間 */
                @media (max-width: 1200px) {
                    .left-image-group { left: 16px; transform: translateY(-50%) scale(0.85); }
                    .right-image-group { right: 16px; transform: translateY(-50%) scale(0.85); }
                }

                /* 🌟 平板響應式（769px ~ 1024px）：進一步縮小並半透明化，防止重疊 */
                @media (max-width: 1024px) {
                    .left-image-group { left: 8px; transform: translateY(-50%) scale(0.7); opacity: 0.85; }
                    .right-image-group { right: 8px; transform: translateY(-50%) scale(0.7); opacity: 0.85; }
                    .cta-title {
                        font-size: 40px !important;
                    }
                }

                /* 🌟 手機響應式（<= 768px）：高度轉自適應，加入上下 Padding，文字完美置中 */
                @media (max-width: 768px) {
                    .cta-section {
                        height: auto;
                        padding: 70px 24px; /* 改為上下 Padding */
                    }
                    .left-image-group, .right-image-group {
                        display: none; /* 隱藏左右圖片 */
                    }
                    .cta-content-wrapper {
                        max-width: 100%;
                        gap: 28px;
                    }
                    .cta-title {
                        font-size: 28px !important;
                        line-height: 1.4 !important;
                    }
                    .cta-btn {
                        padding: 14px 48px;
                        width: 100%;
                        max-width: 260px; /* 手機版按鈕自適應居中 */
                    }
                }
            `}</style>

            <div className="cta-inner-container">
                {/* 1. 左側圖片及波浪裝飾線 */}
                <div className="left-image-group">
                    {leftDecoImage ? (
                        <img
                            className="left-deco"
                            src={leftDecoImage}
                            alt="Deco"
                        />
                    ) : (
                        <svg
                            className="left-deco"
                            viewBox="0 0 220 130"
                            fill="#a67fd9"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M160,10 C140,15 90,40 50,60 C20,75 12,95 25,105 C38,115 70,120 110,108 C150,96 220,100 220,100 C220,100 150,90 110,100 C70,110 42,107 35,100 C28,93 35,80 60,68 C100,50 145,25 160,10 Z"
                                opacity="0.45"
                            />
                        </svg>
                    )}
                    <img
                        className="left-photo"
                        src={resolvedLeftImage}
                        alt="Graduation Left"
                    />
                </div>

                {/* 2. 中間內容區（標題與按鈕） */}
                <div className="cta-content-wrapper">
                    <h2 className="cta-title">{resolvedTitle}</h2>
                    <a href="#" onClick={handleButtonClick} className="cta-btn">
                        <span className="cta-btn-text">
                            {resolvedButtonText}
                        </span>
                    </a>
                </div>

                {/* 3. 右側圖片及波浪裝飾線 */}
                <div className="right-image-group">
                    {rightDecoImage ? (
                        <img
                            className="right-deco"
                            src={rightDecoImage}
                            alt="Deco"
                        />
                    ) : (
                        <svg
                            className="right-deco"
                            viewBox="0 0 260 130"
                            fill="#a67fd9"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M100,10 C120,15 170,40 210,60 C240,75 248,95 235,105 C222,115 190,120 150,108 C110,96 40,100 40,100 C40,100 110,90 150,100 C190,110 218,107 225,100 C232,93 225,80 200,68 C160,50 115,25 100,10 Z"
                                opacity="0.45"
                            />
                        </svg>
                    )}
                    <img
                        className="right-photo"
                        src={resolvedRightImage}
                        alt="Graduation Right"
                    />
                </div>
            </div>
        </section>
    );
}