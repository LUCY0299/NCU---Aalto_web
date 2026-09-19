"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

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

// 預設菜單 - 在 component 外定義
function getDefaultMenu(locale) {
    if (locale === "en-US") {
        return [
            { title: "Home", link_url: "/en", is_active: true },
            {
                title: "About Aalto EMBA",
                link_url: "/en/about-emba",
                is_active: true,
                dropdown: [
                    { title: "About Aalto EMBA", link_url: "/en/about-emba", is_active: true },
                    { title: "About Aalto University", link_url: "/en/about-aalto", is_active: true },
                    { title: "About NCU", link_url: "/en/about-ncu", is_active: true },
                ],
            },
            {
                title: "Learning Info",
                link_url: "/en/learning",
                is_active: true,
                dropdown: [
                    { title: "Events", link_url: "/en/eventlist-2", is_active: true },
                    { title: "Alumni Sharing", link_url: "/en/all-alumni", is_active: true },
                ],
            },
            {
                title: "Programs",
                link_url: "/en/information",
                is_active: true,
                dropdown: [
                    { title: "Admission Info", link_url: "/en/information", is_active: true },
                    { title: "Degree & Regulations", link_url: "/en/degree", is_active: true },
                ],
            },
            { title: "Contact", link_url: "/en/contact", is_active: true },
        ];
    }
    return [
        { title: "首頁 Home", link_url: "/", is_active: true },
        {
            title: "關於 Aalto EMBA",
            link_url: "/about-emba",
            is_active: true,
            dropdown: [
                { title: "關於 Aalto EMBA", link_url: "/about-emba", is_active: true },
                { title: "關於Aalto", link_url: "/about-aalto", is_active: true },
                { title: "關於中央大學", link_url: "/about-ncu", is_active: true },
            ],
        },
        {
            title: "學習資訊",
            link_url: "/learning",
            is_active: true,
            dropdown: [
                { title: "活動訊息", link_url: "/eventlist-2", is_active: true },
                { title: "校友分享", link_url: "/all-alumni", is_active: true },
            ],
        },
        {
            title: "課程相關",
            link_url: "/information",
            is_active: true,
            dropdown: [
                { title: "招生資訊", link_url: "/information", is_active: true },
                { title: "修業與學位", link_url: "/degree", is_active: true },
            ],
        },
        { title: "聯絡方式", link_url: "/contact", is_active: true },
    ];
}

function cleanSnippetText(text) {
    if (!text) return "";
    let resultText = text;
    try {
        if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
            const parsed = JSON.parse(text);
            const extractText = (val) => {
                if (typeof val === "string") return val;
                if (Array.isArray(val)) return val.map(extractText).filter(Boolean).join(" - ");
                if (typeof val === "object" && val !== null) {
                    if (val.title || val.desc || val.content || val.text) {
                        return [val.title, val.desc, val.content, val.text]
                            .filter(Boolean)
                            .join(" ");
                    }
                    return Object.values(val).map(extractText).filter(Boolean).join(" ");
                }
                return "";
            };
            resultText = extractText(parsed);
            return resultText.replace(/<[^>]*>?/gm, "").trim();
        }
    } catch (e) {
        resultText = text
            .replace(/\[|\]|\{|\}/g, "")
            .replace(/"title"\s*:\s*"/g, "")
            .replace(/"desc"\s*:\s*"/g, " - ")
            .replace(/"content"\s*:\s*"/g, " - ")
            .replace(/"text"\s*:\s*"/g, " - ")
            .replace(/"/g, "")
            .replace(/,/g, "，");
    }
    return resultText.replace(/<[^>]*>?/gm, "").trim();
}

export default function Navbar({
    logoImage,
    activeColor = "#d49b38",
    textColor = "#111111",
    bgColor = "#FAF9F5",
    locale: propLocale = "auto",
}) {
    const router = useRouter();
    const pathname = usePathname(); // ✅ 正確感知客戶端路由切換（layout 不會重新掛載）
    const [currentLocale, setCurrentLocale] = useState("zh-TW");
    const [menuItems, setMenuItems] = useState([]);  // ✅ 改為空陣列，等待後端數據
    const [logoUrl, setLogoUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);

    // ✅ 新增：mounted 與 currentPath state
    const [mounted, setMounted] = useState(false);
    const [currentPath, setCurrentPath] = useState("");

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [hoveredDropdown, setHoveredDropdown] = useState(null);

    const searchContainerRef = useRef(null);
    const searchDebounceTimer = useRef(null);
    const dropdownHoverTimer = useRef(null);

    // ✅ 初始化 mounted 與 currentPath（客戶端專用）
    // 依賴 pathname：每次客戶端路由切換頁面時都會重新執行，
    // 避免 Navbar（放在 layout 裡不會重新掛載）卡在舊的路徑判斷結果
    useEffect(() => {
        setMounted(true);
        setCurrentPath(window.location.pathname.toLowerCase());
    }, [pathname]);

    useEffect(() => {
        const detectedLocale =
            !propLocale || propLocale === "auto" ? detectLocale() : propLocale;
        setCurrentLocale(detectedLocale);
        // ✅ 不再設置預設菜單，只設置語言即可
    }, [propLocale, pathname]);

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchKeyword("");
        setSearchResults([]);
    };

    const handleItemClick = (url) => {
        if (typeof window === "undefined" || !url) return;
        let finalUrl = url;
        if (
            currentLocale === "en-US" &&
            finalUrl.startsWith("/") &&
            !finalUrl.startsWith("/en")
        ) {
            finalUrl = `/en${finalUrl}`;
        }
        router.push(finalUrl);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target)
            ) {
                closeSearch();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (searchDebounceTimer.current) {
            clearTimeout(searchDebounceTimer.current);
        }

        const trimmed = searchKeyword.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        searchDebounceTimer.current = setTimeout(() => {
            fetch(
                `${BASE_URL}/api/v1/search?q=${encodeURIComponent(
                    trimmed
                )}&locale=${currentLocale}&t=${new Date().getTime()}`
            )
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => {
                    if (Array.isArray(data)) {
                        setSearchResults(data);
                    }
                })
                .catch((err) => {
                    console.error("Search failed:", err);
                })
                .finally(() => {
                    setSearchLoading(false);
                });
        }, 300);

        return () => {
            if (searchDebounceTimer.current) {
                clearTimeout(searchDebounceTimer.current);
            }
        };
    }, [searchKeyword, currentLocale]);

    const fetchLayoutData = async (locale) => {
        try {
            // ✅ 不再立即設置預設菜單，等後端數據返回後才設置
            const res = await fetch(
                `${BASE_URL}/api/v1/pages/layout?locale=${locale}&t=${new Date().getTime()}`,
                {
                    headers: {
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        Pragma: "no-cache",
                        Expires: "0",
                    },
                }
            );

            if (!res.ok) {
                return;
            }

            const data = await res.json();

            if (data && data.sections) {
                const navSec = data.sections.find(
                    (s) => s.section_key === "navbar"
                );
                if (navSec && navSec.content_fields) {
                    const navField = navSec.content_fields.find(
                        (f) => f.field_key === "navbar_links"
                    );
                    if (navField && navField.field_value) {
                        let parsed =
                            typeof navField.field_value === "string"
                                ? JSON.parse(navField.field_value)
                                : navField.field_value;
                        if (Array.isArray(parsed)) {
                            setMenuItems(
                                parsed.filter(
                                    (item) => item.is_active !== false
                                )
                            );
                        } else {
                            setMenuItems(getDefaultMenu(locale));
                        }
                    } else {
                        setMenuItems(getDefaultMenu(locale));
                    }
                } else {
                    setMenuItems(getDefaultMenu(locale));
                }

                const brandingSec = data.sections.find(
                    (s) => s.section_key === "branding"
                );
                if (brandingSec && brandingSec.content_fields) {
                    const logoFields = brandingSec.content_fields.filter(
                        (f) => f.field_key === "navbar_logo"
                    );

                    let logoField = logoFields.find(
                        (f) => f.locale === locale && f.field_value
                    );

                    if (!logoField) {
                        logoField = logoFields.find((f) => f.field_value);
                    }

                    if (logoField && logoField.field_value) {
                        setLogoUrl(logoField.field_value);
                    }
                }
            } else {
                setMenuItems(getDefaultMenu(locale));
            }
        } catch (err) {
            console.error("Navbar layout page fetch failed:", err);
            setMenuItems(getDefaultMenu(locale));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLayoutData(currentLocale);

        const refreshInterval = setInterval(() => {
            fetchLayoutData(currentLocale);
        }, 30000);

        return () => clearInterval(refreshInterval);
    }, [currentLocale]);

    const handleLanguageChange = (targetLang) => {
        if (typeof window === "undefined") return;
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        if (targetLang === "en-US") {
            if (!currentPath.startsWith("/en/") && currentPath !== "/en") {
                const newPath =
                    currentPath === "/" ? "/en" : `/en${currentPath}`;
                router.push(newPath + currentSearch);
            }
        } else {
            if (currentPath.startsWith("/en")) {
                let newPath = currentPath.substring(3);
                if (!newPath.startsWith("/")) {
                    newPath = "/" + newPath;
                }
                router.push(newPath + currentSearch);
            }
        }
    };

    // ✅ 修正：改用 mounted + currentPath state，移除未使用的 index 參數
    const isLinkActive = (path) => {
        if (!mounted || !path) return false;
        const cleanPath = path.toLowerCase();

        if (cleanPath === "/" || cleanPath === "/en") {
            return (
                currentPath === "/" ||
                currentPath === "/en" ||
                currentPath === ""
            );
        }
        return currentPath.startsWith(cleanPath);
    };

    const isEn = currentLocale === "en-US";

    const resolvedLogoUrl = logoUrl
        ? logoUrl.startsWith("http")
            ? logoUrl
            : `${BASE_URL}${logoUrl}`
        : logoImage ||
          "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/5938d87b-ea28-4ad0-b88f-db1c5e62f6b8.png";

    return (
        <header
            style={{
                width: "100%",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backgroundColor: bgColor,
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: 100,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0 24px",
                    boxSizing: "border-box",
                }}
            >
                {/* LOGO */}
                <a
                    href={isEn ? "/en" : "/"}
                    style={{
                        width: 251,
                        height: 74,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "left center",
                        backgroundImage: `url(${resolvedLogoUrl})`,
                        cursor: "pointer",
                        flexShrink: 0,
                        textDecoration: "none",
                    }}
                />

                {/* MENU */}
                <ul
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 24,
                        listStyle: "none",
                        margin: 0,
                        marginRight: 24,
                        padding: 0,
                        flex: 1,
                        justifyContent: "flex-end",
                    }}
                >
                    {menuItems && menuItems.length > 0 ? (
                        menuItems.map((item, index) => {
                            const hasDropdown =
                                item.dropdown && item.dropdown.length > 0;
                            // ✅ 移除第二個參數 index
                            const active = isLinkActive(item.link_url);
                            const isHovered = hoveredDropdown === index;

                            return (
                                <li
                                    key={index}
                                    style={{
                                        position: "relative",
                                    }}
                                    onMouseEnter={() => {
                                        clearTimeout(dropdownHoverTimer.current);
                                        setHoveredDropdown(index);
                                    }}
                                    onMouseLeave={() => {
                                        dropdownHoverTimer.current = setTimeout(() => {
                                            setHoveredDropdown(null);
                                        }, 200);
                                    }}
                                >
                                    <a
                                        href={item.link_url}
                                        style={{
                                            fontFamily:
                                                "Inter, PingFang TC, Microsoft JhengHei, sans-serif",
                                            fontSize: 16,
                                            fontWeight: 600,
                                            lineHeight: 1.7,
                                            color: active
                                                ? activeColor
                                                : textColor,
                                            textDecoration: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            transition: "color 0.2s ease",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.title}
                                        {hasDropdown && (
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                style={{
                                                    transform: isHovered
                                                        ? "rotate(180deg)"
                                                        : "rotate(0deg)",
                                                    transition:
                                                        "transform 0.2s ease",
                                                }}
                                            >
                                                <path
                                                    d="M1 1.5L5 4.5L9 1.5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </a>

                                    {hasDropdown && isHovered && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 50,
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                backgroundColor: "#ffffff",
                                                boxShadow:
                                                    "0px 10px 20px rgba(0, 0, 0, 0.1)",
                                                borderRadius: "4px",
                                                padding: "16px 24px",
                                                width: "max-content",
                                                zIndex: 1000,
                                            }}
                                            onMouseEnter={() => {
                                                clearTimeout(dropdownHoverTimer.current);
                                                setHoveredDropdown(index);
                                            }}
                                            onMouseLeave={() => {
                                                dropdownHoverTimer.current = setTimeout(() => {
                                                    setHoveredDropdown(null);
                                                }, 200);
                                            }}
                                        >
                                            {item.dropdown.map(
                                                (sub, sIdx) => (
                                                    <a
                                                        key={sIdx}
                                                        href={sub.link_url}
                                                        style={{
                                                            display: "block",
                                                            padding: "10px 0",
                                                            color: "#111111",
                                                            textDecoration:
                                                                "none",
                                                            fontSize: 15,
                                                            fontWeight: 500,
                                                            textAlign: "left",
                                                            transition:
                                                                "color 0.2s ease",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.color =
                                                                activeColor;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.color =
                                                                "#111111";
                                                        }}
                                                    >
                                                        {sub.title}
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })
                    ) : (
                        <li
                            style={{
                                color: "#999",
                                fontSize: 14,
                            }}
                        >
                            載入菜單中...
                        </li>
                    )}
                </ul>

                {/* CONTROLS */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                    }}
                >
                    {/* SEARCH */}
                    <div
                        ref={searchContainerRef}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            position: "relative",
                        }}
                    >
                        <input
                            type="text"
                            placeholder={isEn ? "Search..." : "搜尋..."}
                            value={searchKeyword}
                            onChange={(e) =>
                                setSearchKeyword(e.target.value)
                            }
                            style={{
                                width: searchOpen ? "150px" : "0px",
                                padding: searchOpen ? "6px 12px" : "0px",
                                opacity: searchOpen ? 1 : 0,
                                border: searchOpen
                                    ? "1px solid #ddd"
                                    : "1px solid transparent",
                                borderRadius: "16px",
                                outline: "none",
                                marginRight: "6px",
                                fontSize: "14px",
                                color: "#111111",
                                backgroundColor: "#ffffff",
                                transition:
                                    "width 0.3s ease, opacity 0.2s ease",
                            }}
                        />

                        <button
                            onClick={() => {
                                if (!searchOpen) {
                                    setSearchOpen(true);
                                } else {
                                    if (!searchKeyword.trim()) {
                                        closeSearch();
                                    }
                                }
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#111111",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 4,
                                outline: "none",
                                transition: "color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = activeColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#111111";
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.0"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line
                                    x1="21"
                                    y1="21"
                                    x2="16.65"
                                    y2="16.65"
                                ></line>
                            </svg>
                        </button>

                        {searchOpen && searchKeyword.trim() && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "40px",
                                    right: 0,
                                    width: "320px",
                                    maxHeight: "320px",
                                    overflowY: "auto",
                                    backgroundColor: "#ffffff",
                                    borderRadius: "6px",
                                    boxShadow:
                                        "0px 10px 25px rgba(0, 0, 0, 0.15)",
                                    border: "1px solid rgba(0, 0, 0, 0.08)",
                                    padding: "8px 0",
                                    boxSizing: "border-box",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px",
                                    zIndex: 99999,
                                }}
                            >
                                {searchLoading ? (
                                    <div
                                        style={{
                                            padding: "16px",
                                            color: "#888",
                                            fontSize: "14px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {isEn ? "Searching..." : "搜尋中..."}
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div
                                        style={{
                                            padding: "16px",
                                            color: "#888",
                                            fontSize: "14px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {isEn
                                            ? "No results found"
                                            : "找不到相關結果"}
                                    </div>
                                ) : (
                                    searchResults.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() =>
                                                handleItemClick(item.url)
                                            }
                                            style={{
                                                padding: "10px 14px",
                                                cursor: "pointer",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "4px",
                                                transition:
                                                    "background-color 0.15s ease",
                                                backgroundColor:
                                                    "transparent",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    "#f5f5f5";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    "transparent";
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        padding: "1px 5px",
                                                        backgroundColor:
                                                            "rgba(93, 58, 155, 0.1)",
                                                        color: "#5D3A9B",
                                                        borderRadius: "4px",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {item.type}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "13px",
                                                        fontWeight: 600,
                                                        color: "#111111",
                                                        whiteSpace:
                                                            "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>
                                            {item.snippet && (
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#666666",
                                                        display:
                                                            "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient:
                                                            "vertical",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {cleanSnippetText(
                                                        item.snippet
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* LANGUAGE BUTTON */}
                    <button
                        onClick={() =>
                            handleLanguageChange(
                                isEn ? "zh-TW" : "en-US"
                            )
                        }
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: "#eeede8",
                            border: "none",
                            borderRadius: "99px",
                            padding: "8px 18px",
                            fontFamily: "Inter, PingFang TC, sans-serif",
                            fontSize: "14px",
                            fontWeight: 600,
                            lineHeight: 1.7,
                            cursor: "pointer",
                            color: "#111111",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e2e0d9";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#eeede8";
                        }}
                    >
                        🌐 {isEn ? "English" : "繁體中文"}
                    </button>
                </div>
            </div>
        </header>
    );
}