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

// 讓 Hook 接收 currentLocale 作為參數
function useSection(sectionKey, currentLocale) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 使用傳入的 currentLocale
        fetch(
            `${BASE_URL}/api/v1/content/admission/${sectionKey}?locale=${currentLocale}&t=${new Date().getTime()}`,
            { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        )
            .then((res) => res.json())
            .then((res) => {
                const fields = res.fields || {};
                const blocks =
                    typeof fields.blocks === "string"
                        ? JSON.parse(fields.blocks || "[]")
                        : fields.blocks || [];
                setData({
                    ...fields,
                    blocks,
                    isActive: res.is_active !== false,
                });
            })
            .catch((err) => {
                console.error(`${sectionKey} API 連線失敗:`, err);
                setData({ isActive: true, title: "連線中斷", blocks: [] });
            })
            .finally(() => setLoading(false));
    }, [sectionKey, currentLocale]);

    return { data, loading };
}

function resolveImage(url) {
    if (!url) return "";
    return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

function resolveUrl(url) {
    if (!url) return "";
    return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

// ✨ 新增：強制下載檔案的攔截函數
const forceDownload = async (e, url, filename) => {
    e.preventDefault(); // 阻止瀏覽器預設的「開啟新分頁」行為
    try {
        // 透過 fetch 把檔案當作 Blob (二進制資料) 抓下來
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();

        // 建立一個暫時的隱形連結來觸發下載
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;

        // 如果網址有副檔名，幫檔名補上副檔名
        let finalFilename = filename || "download";
        const extensionMatch = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
        if (extensionMatch && !filename.includes(".")) {
            finalFilename += `.${extensionMatch[1]}`;
        }

        link.download = finalFilename;
        document.body.appendChild(link);
        link.click(); // 模擬點擊下載

        // 清理記憶體與暫時連結
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("強制下載失敗，改用新分頁開啟:", error);
        // 萬一遇到嚴格的 CORS 阻擋，退回原本的新分頁開啟模式
        window.open(url, "_blank");
    }
};

function BlockList({ blocks, contentFontSize, contentColor }) {
    return blocks.map((block, index) => {
        // 圖片 block
        if (block.type === "image" && block.image_url) {
            return (
                <img
                    key={index}
                    src={resolveImage(block.image_url)}
                    style={{
                        width: "calc(100% + 75px)",
                        margin: "0 -50px 0 -25px",
                        display: "block",
                    }}
                />
            );
        }

        // 文字 block
        if (block.type === "text" && block.text) {
            const isDisclaimer =
                block.text.includes("reserve the right") ||
                block.text.includes("We reserve") ||
                block.text.includes("本校保留") ||
                block.text.includes("保留隨時");

            if (isDisclaimer) {
                return (
                    <div
                        key={index}
                        style={{
                            background: "#f5f5f5",
                            borderLeft: "4px solid #602a80",
                            padding: "16px 20px",
                            marginTop: "20px",
                            borderRadius: "4px",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontFamily:
                                    '"Open Sans", "Open Sans Placeholder", sans-serif',
                                fontSize: `${contentFontSize}px`,
                                fontWeight: 400,
                                lineHeight: 1.6,
                                color: "#666",
                                whiteSpace: "pre-wrap",
                                textAlign: "left",
                            }}
                        >
                            {block.text}
                        </p>
                    </div>
                );
            }

            return (
                <p
                    key={index}
                    style={{
                        margin: 0,
                        fontFamily:
                            '"Open Sans", "Open Sans Placeholder", sans-serif',
                        fontSize: `${contentFontSize}px`,
                        fontWeight: 400,
                        lineHeight: 1.6,
                        color: contentColor,
                        whiteSpace: "pre-wrap",
                        textAlign: "left",
                    }}
                >
                    {block.text}
                </p>
            );
        }

        // 兩列布局 block
        if (block.type === "two-columns" && block.columns) {
            return (
                <div
                    key={index}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "40px",
                        marginTop: "20px",
                    }}
                >
                    {block.columns.map((column, colIndex) => (
                        <div key={colIndex}>
                            <h4
                                style={{
                                    margin: "0 0 12px 0",
                                    fontSize: `${contentFontSize}px`,
                                    fontWeight: 600,
                                    color: contentColor,
                                    fontFamily:
                                        '"Open Sans", "Open Sans Placeholder", sans-serif',
                                }}
                            >
                                {column.title}
                            </h4>
                            <ul
                                style={{
                                    margin: 0,
                                    paddingLeft: "20px",
                                    listStyle: "disc",
                                    fontFamily:
                                        '"Open Sans", "Open Sans Placeholder", sans-serif',
                                }}
                            >
                                {column.items?.map((item, itemIndex) => (
                                    <li
                                        key={itemIndex}
                                        style={{
                                            fontSize: `${contentFontSize}px`,
                                            color: contentColor,
                                            lineHeight: 1.6,
                                            marginBottom: "8px",
                                            fontWeight: 400,
                                        }}
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    });
}

export default function Information({
    // 將 Framer 的 Property Controls 轉為預設 Props
    titleFontSize = 64,
    titleColor = "#160D03",
    subtitleFontSize = 18,
    subtitleColor = "#160D03",
    sectionTitleFontSize = 48,
    headingColor = "#160D03",
    contentColor = "#3B3B3D",
    contentFontSize = 23,
    cardBg = "#ffffff",
    locale: propLocale = "auto",
}) {
    const currentLocale =
        !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    const hero = useSection("admission-hero", currentLocale);
    const info = useSection("admission-info", currentLocale);
    const requirements = useSection("admission-requirements", currentLocale);
    const downloads = useSection("admission-downloads", currentLocale);

    const isEn = currentLocale === "en-US";

    if (
        hero.loading ||
        info.loading ||
        requirements.loading ||
        downloads.loading
    ) {
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

    if (
        hero.data?.isActive === false &&
        info.data?.isActive === false &&
        requirements.data?.isActive === false &&
        downloads.data?.isActive === false
    ) {
        return null;
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
                            (isEn ? "Admissions Information" : "招生資訊")}
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

            {/* 招生資訊 */}
            {info.data?.isActive !== false && (
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
                        {info.data?.title ||
                            (isEn ? "Admissions Information" : "招生資訊")}
                    </h2>
                    <div
                        style={{
                            background: cardBg,
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "23px",
                            padding: "0 50px 41px 25px",
                            boxSizing: "border-box",
                        }}
                    >
                        <BlockList
                            blocks={info.data?.blocks || []}
                            contentFontSize={contentFontSize}
                            contentColor={contentColor}
                        />
                    </div>
                </div>
            )}

            {/* 入學門檻 */}
            {requirements.data?.isActive !== false && (
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
                        {requirements.data?.title ||
                            (isEn ? "Admission Requirements" : "入學門檻")}
                    </h2>
                    <div
                        style={{
                            background: cardBg,
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "23px",
                            padding: "0 50px 41px 25px",
                            boxSizing: "border-box",
                        }}
                    >
                        <BlockList
                            blocks={requirements.data?.blocks || []}
                            contentFontSize={contentFontSize}
                            contentColor={contentColor}
                        />
                    </div>
                </div>
            )}

            {/* 檔案下載專區 */}
            {downloads.data?.isActive !== false && (
                <div
                    style={{
                        padding: "20px",
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "20px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: `${sectionTitleFontSize}px`,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            margin: "0 0 16px 0",
                            color: titleColor,
                        }}
                    >
                        {downloads.data?.title || (isEn ? "Downloads" : "下載")}
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        {(() => {
                            let fileList = [];
                            try {
                                fileList = JSON.parse(
                                    downloads.data?.file_list || "[]"
                                );
                                fileList = fileList.filter(
                                    (f) => f.is_active !== false
                                );
                            } catch (e) {}

                            if (fileList.length === 0) {
                                return (
                                    <div
                                        style={{
                                            color: "#999",
                                            fontSize: "14px",
                                        }}
                                    >
                                        {isEn
                                            ? "No files available."
                                            : "目前尚無檔案提供下載"}
                                    </div>
                                );
                            }

                            return fileList.map((file, idx) => {
                                const fileUrl = resolveUrl(file.file_url);
                                const fileName =
                                    file.title ||
                                    (isEn ? "Unnamed File" : "未命名檔案");

                                return (
                                    <a
                                        key={idx}
                                        href={fileUrl}
                                        onClick={(e) =>
                                            forceDownload(e, fileUrl, fileName)
                                        }
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 24px",
                                            background: cardBg,
                                            borderRadius: "12px",
                                            textDecoration: "none",
                                            boxShadow:
                                                "0 1px 4px rgba(0,0,0,0.08)",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: `${contentFontSize}px`,
                                                color: contentColor,
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                marginRight: "16px",
                                                flex: 1,
                                            }}
                                        >
                                            📄 {fileName}
                                        </span>
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#602a80",
                                                color: "#fff",
                                                borderRadius: "50%",
                                                width: "36px",
                                                height: "36px",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line
                                                    x1="12"
                                                    y1="15"
                                                    x2="12"
                                                    y2="3"
                                                ></line>
                                            </svg>
                                        </span>
                                    </a>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}