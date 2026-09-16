"use client";

import React, { useState, useEffect } from "react";

const BASE_URL = "https://ncu-aalto-web.onrender.com";

const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US";
        }
    }
    return "zh-TW";
};

function parseItems(itemsString) {
    if (typeof itemsString === "string") {
        try {
            return JSON.parse(itemsString);
        } catch (e) {
            return [];
        }
    }
    return itemsString || [];
}

function useSection(sectionKey, currentLocale) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(
            `${BASE_URL}/api/v1/content/admission/${sectionKey}?locale=${currentLocale}&t=${new Date().getTime()}`,
            { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
        )
            .then((res) => res.json())
            .then((res) => {
                const fields = res.fields || {};

                if (sectionKey === "admission-info-and-requirements") {
                    const infoItems = parseItems(fields.info_items);
                    const requirementsItems = parseItems(fields.requirements_items);
                    setData({
                        ...fields,
                        infoItems,
                        requirementsItems,
                        isActive: res.is_active !== false,
                    });
                } else if (sectionKey === "admission-downloads") {
                    const fileList = parseItems(fields.file_list);
                    setData({
                        ...fields,
                        file_list: fileList,
                        isActive: res.is_active !== false,
                    });
                } else {
                    const blocks =
                        typeof fields.blocks === "string"
                            ? JSON.parse(fields.blocks || "[]")
                            : fields.blocks || [];
                    setData({
                        ...fields,
                        blocks,
                        isActive: res.is_active !== false,
                    });
                }
            })
            .catch((err) => {
                console.error(`${sectionKey} API 連線失敗:`, err);
                setData({ isActive: true, title: "連線中斷", blocks: [], infoItems: [], requirementsItems: [], file_list: [] });
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

const forceDownload = async (e, url, filename) => {
    e.preventDefault();
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;

        let finalFilename = filename || "download";
        const extensionMatch = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
        if (extensionMatch && !filename.includes(".")) {
            finalFilename += `.${extensionMatch[1]}`;
        }

        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("強制下載失敗，改用新分頁開啟:", error);
        window.open(url, "_blank");
    }
};

export default function Information({
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
    const currentLocale = !propLocale || propLocale === "auto" ? detectLocale() : propLocale;

    const hero = useSection("admission-hero", currentLocale);
    const combined = useSection("admission-info-and-requirements", currentLocale);
    const downloads = useSection("admission-downloads", currentLocale);

    const isEn = currentLocale === "en-US";

    if (hero.loading || combined.loading || downloads.loading) {
        return (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#999" }}>
                {isEn ? "Loading..." : "載入中..."}
            </div>
        );
    }

    if (
        hero.data?.isActive === false &&
        combined.data?.isActive === false &&
        downloads.data?.isActive === false
    ) {
        return null;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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
                        {hero.data?.title || (isEn ? "Admissions Information" : "招生資訊")}
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

            {/* 招生資訊 - 介紹 + 兩列課程（同一個大框） */}
            {combined.data?.isActive !== false && Array.isArray(combined.data?.infoItems) && (
                <div style={{ padding: "20px", width: "100%", boxSizing: "border-box" }}>
                    <h2
                        style={{
                            fontSize: `${sectionTitleFontSize}px`,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            margin: "0 0 16px 0",
                        }}
                    >
                        {isEn ? "Admission Information" : "招生資訊"}
                    </h2>

                    <div
                        style={{
                            background: cardBg,
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            padding: "24px 40px",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* 圖片 */}
                        {combined.data.infoItems[0]?.image_url && (
                            <img
                                src={resolveImage(combined.data.infoItems[0].image_url)}
                                alt={combined.data.infoItems[0].title}
                                style={{
                                    width: "calc(100% + 80px)",
                                    margin: "-24px -40px 30px -40px",
                                    height: "auto",
                                    borderRadius: "0",
                                    display: "block",
                                }}
                            />
                        )}

                        {/* 介紹文字 */}
                        {combined.data.infoItems[0] && combined.data.infoItems[0].is_active !== false && (
                            <>
                                {combined.data.infoItems[0].content && (
                                    <div
                                        style={{
                                            margin: 0,
                                            marginBottom: "30px",
                                            fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                            fontSize: `${contentFontSize}px`,
                                            fontWeight: 400,
                                            lineHeight: 1.6,
                                            color: contentColor,
                                        }}
                                        className="content-html"
                                        dangerouslySetInnerHTML={{ __html: combined.data.infoItems[0].content }}
                                    />
                                )}
                            </>
                        )}

                        {/* 兩列課程 */}
                        {combined.data.infoItems[1] && combined.data.infoItems[1].is_active !== false && (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "40px",
                                }}
                            >
                                {/* 國立中央大學課程 */}
                                <div>
                                    <h3
                                        style={{
                                            margin: "0 0 20px 0",
                                            fontSize: `${contentFontSize * 1.2}px`,
                                            fontWeight: 600,
                                            color: headingColor,
                                            fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                        }}
                                    >
                                        {combined.data.infoItems[1].title}
                                    </h3>
                                    {combined.data.infoItems[1].content && (
                                        <div
                                            style={{
                                                marginBottom: "16px",
                                                fontSize: `${contentFontSize}px`,
                                                color: contentColor,
                                                lineHeight: 1.6,
                                                fontWeight: 400,
                                            }}
                                            className="content-html"
                                            dangerouslySetInnerHTML={{ __html: combined.data.infoItems[1].content }}
                                        />
                                    )}
                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft: "20px",
                                            listStyle: "disc",
                                            fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                        }}
                                    >
                                        {Array.isArray(combined.data.infoItems[1].courses) && combined.data.infoItems[1].courses.map((course, idx) =>
                                            course.is_active !== false ? (
                                                <li
                                                    key={idx}
                                                    style={{
                                                        fontSize: `${contentFontSize}px`,
                                                        color: contentColor,
                                                        lineHeight: 1.6,
                                                        marginBottom: "8px",
                                                        fontWeight: 400,
                                                    }}
                                                >
                                                    {course.title}
                                                </li>
                                            ) : null
                                        )}
                                    </ul>
                                </div>

                                {/* 阿爾托大學課程 */}
                                {combined.data.infoItems[2] && combined.data.infoItems[2].is_active !== false && (
                                    <div>
                                        <h3
                                            style={{
                                                margin: "0 0 20px 0",
                                                fontSize: `${contentFontSize * 1.2}px`,
                                                fontWeight: 600,
                                                color: headingColor,
                                                fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                            }}
                                        >
                                            {combined.data.infoItems[2].title}
                                        </h3>
                                        {combined.data.infoItems[2].content && (
                                            <div
                                                style={{
                                                    marginBottom: "16px",
                                                    fontSize: `${contentFontSize}px`,
                                                    color: contentColor,
                                                    lineHeight: 1.6,
                                                    fontWeight: 400,
                                                }}
                                                className="content-html"
                                                dangerouslySetInnerHTML={{ __html: combined.data.infoItems[2].content }}
                                            />
                                        )}
                                        <ul
                                            style={{
                                                margin: 0,
                                                paddingLeft: "20px",
                                                listStyle: "disc",
                                                fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                            }}
                                        >
                                            {Array.isArray(combined.data.infoItems[2].courses) && combined.data.infoItems[2].courses.map((course, idx) =>
                                                course.is_active !== false ? (
                                                    <li
                                                        key={idx}
                                                        style={{
                                                            fontSize: `${contentFontSize}px`,
                                                            color: contentColor,
                                                            lineHeight: 1.6,
                                                            marginBottom: "8px",
                                                            fontWeight: 400,
                                                        }}
                                                    >
                                                        {course.title}
                                                    </li>
                                                ) : null
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {/* 課程免責聲明 - 灰底 + 左邊 BAR */}
                                {combined.data.infoItems[0]?.course_disclaimer && (
                                    <div
                                        style={{
                                            marginTop: "30px",
                                            padding: "16px 20px",
                                            backgroundColor: "#f5f5f5",
                                            borderLeft: "4px solid #666",
                                            fontSize: `${contentFontSize - 2}px`,
                                            color: "#666",
                                            lineHeight: 1.6,
                                            fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                        }}
                                    >
                                        {combined.data.infoItems[0].course_disclaimer}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 入學門檻 */}
            {combined.data?.isActive !== false && Array.isArray(combined.data?.requirementsItems) && (
                <div style={{ padding: "20px", width: "100%", boxSizing: "border-box" }}>
                    <h2
                        style={{
                            fontSize: `${sectionTitleFontSize}px`,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            margin: "0 0 16px 0",
                        }}
                    >
                        {isEn ? "Admission Requirements" : "入學門檻"}
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
                            padding: "24px 40px",
                            boxSizing: "border-box",
                        }}
                    >
                        {combined.data.requirementsItems.map((item, idx) =>
                            item.is_active !== false ? (
                                <div key={idx}>
                                    {item.title && (
                                        <h3
                                            style={{
                                                margin: "0 0 12px 0",
                                                fontSize: "20px",
                                                fontWeight: 600,
                                                lineHeight: 1,
                                                color: headingColor,
                                                fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                            }}
                                        >
                                            {item.title}
                                        </h3>
                                    )}
                                    {item.content && (
                                        <div
                                            style={{
                                                margin: 0,
                                                fontFamily: '"Open Sans", "Open Sans Placeholder", sans-serif',
                                                fontSize: `${contentFontSize}px`,
                                                fontWeight: 400,
                                                lineHeight: 1.6,
                                                color: contentColor,
                                            }}
                                            className="content-html"
                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                        />
                                    )}
                                </div>
                            ) : null
                        )}
                    </div>
                </div>
            )}

            {/* 檔案下載專區 */}
            {downloads.data?.isActive !== false && (
                <div style={{ padding: "20px", width: "100%", boxSizing: "border-box", marginTop: "20px" }}>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(() => {
                            let fileList = [];
                            try {
                                fileList = JSON.parse(downloads.data?.file_list || "[]");
                                fileList = fileList.filter((f) => f.is_active !== false);
                            } catch (e) {}

                            if (fileList.length === 0) {
                                return (
                                    <div style={{ color: "#999", fontSize: "14px" }}>
                                        {isEn ? "No files available." : "目前尚無檔案提供下載"}
                                    </div>
                                );
                            }

                            return fileList.map((file, idx) => {
                                const fileUrl = resolveUrl(file.file_url);
                                const fileName = file.title || (isEn ? "Unnamed File" : "未命名檔案");

                                return (
                                    <a
                                        key={idx}
                                        href={fileUrl}
                                        onClick={(e) => forceDownload(e, fileUrl, fileName)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 24px",
                                            background: cardBg,
                                            borderRadius: "12px",
                                            textDecoration: "none",
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
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
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
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
