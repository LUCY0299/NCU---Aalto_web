import React, { useState, useEffect, useRef } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

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

export default function Navbar(props) {
    const { logoImage, activeColor, textColor, bgColor } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [currentLocale, setCurrentLocale] = useState("zh-TW")
    const [menuItems, setMenuItems] = useState(
        isCanvas ? getDefaultMenu("zh-TW") : []
    )
    const [logoUrl, setLogoUrl] = useState("")
    const [loading, setLoading] = useState(!isCanvas)
    const [mobileOpen, setMobileOpen] = useState(false)

    // 手機版選單摺疊狀態
    const [activeAccordion, setActiveAccordion] = useState(null)

    // 搜尋功能相關 State 與 Refs
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchKeyword, setSearchKeyword] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)

    const searchContainerRef = useRef(null)
    const searchDebounceTimer = useRef(null)

    // 關閉搜尋
    const closeSearch = () => {
        setSearchOpen(false)
        setSearchKeyword("")
        setSearchResults([])
    }

    // 點擊搜尋結果的跳轉邏輯
    const handleItemClick = (url) => {
        if (typeof window === "undefined" || !url) return
        let finalUrl = url
        if (
            currentLocale === "en-US" &&
            finalUrl.startsWith("/") &&
            !finalUrl.startsWith("/en")
        ) {
            finalUrl = `/en${finalUrl}`
        }
        window.location.href = finalUrl
    }

    // 點擊選單外部關閉搜尋
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target)
            ) {
                closeSearch()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    // 防抖搜尋邏輯
    useEffect(() => {
        if (searchDebounceTimer.current) {
            clearTimeout(searchDebounceTimer.current)
        }

        const trimmed = searchKeyword.trim()
        if (!trimmed) {
            setSearchResults([])
            setSearchLoading(false)
            return
        }

        setSearchLoading(true)
        searchDebounceTimer.current = setTimeout(() => {
            fetch(
                `${BASE_URL}/api/v1/search?q=${encodeURIComponent(trimmed)}&locale=${currentLocale}&t=${new Date().getTime()}`
            )
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => {
                    if (Array.isArray(data)) {
                        setSearchResults(data)
                    }
                })
                .catch((err) => {
                    console.error("Search failed:", err)
                })
                .finally(() => {
                    setSearchLoading(false)
                })
        }, 300)

        return () => {
            if (searchDebounceTimer.current) {
                clearTimeout(searchDebounceTimer.current)
            }
        }
    }, [searchKeyword, currentLocale])

    useEffect(() => {
        const locale = detectLocale()
        setCurrentLocale(locale)

        if (isCanvas) {
            setMenuItems(getDefaultMenu(locale))
            setLoading(false)
            return
        }

        fetch(
            `${BASE_URL}/api/v1/pages/layout?locale=${locale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data && data.sections) {
                    const navSec = data.sections.find(
                        (s) => s.section_key === "navbar"
                    )
                    if (navSec && navSec.content_fields) {
                        const navField = navSec.content_fields.find(
                            (f) => f.field_key === "navbar_links"
                        )
                        if (navField && navField.field_value) {
                            let parsed =
                                typeof navField.field_value === "string"
                                    ? JSON.parse(navField.field_value)
                                    : navField.field_value
                            if (Array.isArray(parsed)) {
                                setMenuItems(
                                    parsed.filter(
                                        (item) => item.is_active !== false
                                    )
                                )
                            } else {
                                setMenuItems(getDefaultMenu(locale))
                            }
                        } else {
                            setMenuItems(getDefaultMenu(locale))
                        }
                    } else {
                        setMenuItems(getDefaultMenu(locale))
                    }

                    // ✅ 改為從 branding section 加載 navbar_logo
                    const brandingSec = data.sections.find(
                        (s) => s.section_key === "branding"
                    )
                    if (brandingSec && brandingSec.content_fields) {
                        const logoField = brandingSec.content_fields.find(
                            (f) => f.field_key === "navbar_logo"
                        )
                        if (logoField && logoField.field_value) {
                            setLogoUrl(logoField.field_value)
                        }
                    }
                } else {
                    setMenuItems(getDefaultMenu(locale))
                }
            })
            .catch((err) => {
                console.error(
                    "Navbar layout page fetch failed, loading default fallback:",
                    err
                )
                setMenuItems(getDefaultMenu(locale))
            })
            .finally(() => {
                setLoading(false)
            })
    }, [isCanvas])

    const handleLanguageChange = (targetLang) => {
        if (typeof window === "undefined") return
        const currentPath = window.location.pathname
        const currentSearch = window.location.search

        if (targetLang === "en-US") {
            if (!currentPath.startsWith("/en/") && currentPath !== "/en") {
                const newPath =
                    currentPath === "/" ? "/en" : `/en${currentPath}`
                window.location.href = newPath + currentSearch
            }
        } else {
            if (currentPath.startsWith("/en")) {
                let newPath = currentPath.substring(3)
                if (!newPath.startsWith("/")) {
                    newPath = "/" + newPath
                }
                window.location.href = newPath + currentSearch
            }
        }
    }

    const isLinkActive = (path, index) => {
        if (isCanvas) {
            return index === 0
        }
        if (typeof window === "undefined") return false
        const currentPath = window.location.pathname.toLowerCase()
        const cleanPath = path.toLowerCase()

        if (cleanPath === "/" || cleanPath === "/en") {
            return (
                currentPath === "/" ||
                currentPath === "/en" ||
                currentPath === "" ||
                currentPath.endsWith("/index.html")
            )
        }
        return currentPath.startsWith(cleanPath)
    }

    const isEn = currentLocale === "en-US"

    const resolvedLogoUrl = logoUrl
        ? logoUrl.startsWith("http")
            ? logoUrl
            : `${BASE_URL}${logoUrl}`
        : logoImage ||
          "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/5938d87b-ea28-4ad0-b88f-db1c5e62f6b8.png"

    return (
        <header style={{ ...headerStyle, backgroundColor: bgColor }}>
            <style>{`
                /* 🌟 全域防反藍、防點擊高亮閃爍 🌟 */
                a, button, input, [role="button"] {
                    -webkit-tap-highlight-color: transparent !important;
                    outline: none !important;
                }

                .nav-container {
                    width: 100%;
                    max-width: 1348px;
                    height: 100px;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                    margin: 0 auto;
                    padding: 0 24px;
                    box-sizing: border-box;
                    position: relative;
                }

                .logo-link {
                    width: 251px;
                    height: 74px;
                    display: block;
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: left center;
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .nav-right {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 24px;
                }

                .nav-menu {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 24px;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .nav-item {
                    position: relative;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }

                .nav-link {
                    font-family: "Inter", "PingFang TC", "Microsoft JhengHei", sans-serif !important;
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    line-height: 1.7 !important;
                    color: ${textColor} !important;
                    text-decoration: none !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    transition: color 0.2s ease !important;
                    white-space: nowrap;
                }

                .nav-link:hover {
                    color: ${activeColor} !important;
                }

                .nav-link.active {
                    color: ${activeColor} !important;
                    font-weight: 600 !important;
                }

                .dropdown-menu {
                    position: absolute;
                    top: 50px !important;
                    left: 50%;
                    transform: translateX(-50%);
                    box-sizing: border-box;
                    width: max-content;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: flex-start;
                    padding: 17px 26px 22px 26px;
                    box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.05);
                    background-color: #ffffff;
                    border-radius: 4px;
                    gap: 15px;
                    z-index: 999;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease-in-out;
                }

                .nav-item:hover .dropdown-menu {
                    opacity: 1 !important;
                    visibility: visible !important;
                    top: 38px !important;
                }

                .dropdown-link {
                    font-family: "Inter", "PingFang TC", "Microsoft JhengHei", sans-serif !important;
                    font-size: 15px !important;
                    font-weight: 500 !important;
                    line-height: 1.7 !important;
                    color: #111111 !important;
                    text-decoration: none !important;
                    transition: color 0.2s !important;
                    display: block !important;
                    width: 100% !important;
                    text-align: left !important;
                    white-space: nowrap;
                }

                .dropdown-link:hover {
                    color: ${activeColor} !important;
                }

                .controls-group {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .search-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #111111 !important;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    outline: none;
                    transition: color 0.2s !important;
                }
                .search-btn:hover {
                    color: ${activeColor} !important;
                }

                .lang-dropdown-container {
                    position: relative;
                }

                .lang-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background-color: #eeede8;
                    border: none;
                    border-radius: 99px;
                    padding: 8px 18px;
                    font-family: "Inter", "PingFang TC", sans-serif !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    line-height: 1.7 !important;
                    cursor: pointer;
                    color: #111111 !important;
                    transition: background 0.2s !important;
                }
                .lang-btn:hover {
                    background-color: #e2e0d9;
                }

                .lang-dropdown-menu {
                    position: absolute;
                    top: 48px;
                    right: 0;
                    background-color: #ffffff;
                    box-shadow: 0px 10px 20px 0px rgba(0, 0, 0, 0.05);
                    border-radius: 6px;
                    padding: 6px 0;
                    min-width: 120px;
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s ease-in-out;
                }

                .lang-dropdown-container:hover .lang-dropdown-menu {
                    opacity: 1;
                    visibility: visible;
                    top: 40px;
                }

                .lang-dropdown-item {
                    background: none;
                    border: none;
                    padding: 8px 16px;
                    font-family: "Inter", "PingFang TC", sans-serif !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    line-height: 1.7 !important;
                    text-align: left !important;
                    width: 100% !important;
                    cursor: pointer !important;
                    color: #111111 !important;
                    transition: background 0.2s, color 0.2s !important;
                }

                .lang-dropdown-item:hover {
                    background-color: #f5f5f5;
                    color: ${activeColor} !important;
                }

                .burger-btn {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 10px;
                    z-index: 1000;
                }

                @media (max-width: 1199px) {
                    .nav-container {
                        padding: 0 24px;
                        height: 80px;
                    }
                    .logo-link {
                        width: 190px;
                        height: 56px;
                    }
                    .nav-right {
                        display: ${mobileOpen ? "flex" : "none"};
                        flex-direction: column;
                        position: absolute;
                        top: 80px;
                        left: 0;
                        width: 100%;
                        background: rgba(255, 255, 255, 0.98);
                        backdrop-filter: blur(10px);
                        box-shadow: 0px 15px 30px rgba(0, 0, 0, 0.08);
                        padding: 24px 30px 40px 30px;
                        gap: 24px;
                        box-sizing: border-box;
                        align-items: flex-start;
                        border-bottom: 2px solid rgba(0, 0, 0, 0.03);
                        transition: all 0.3s ease;
                    }
                    .nav-menu {
                        flex-direction: column;
                        width: 100%;
                        gap: 8px;
                    }
                    .nav-item {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 6px 0;
                        width: 100%;
                        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
                    }
                    .nav-item:last-child {
                        border-bottom: none;
                    }
                    .nav-link {
                        width: 100%;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 17px !important;
                    }

                    .dropdown-menu {
                        position: static;
                        transform: none;
                        box-shadow: none;
                        width: 100%;
                        background-color: transparent;
                        padding: 8px 0 8px 16px;
                        margin: 4px 0 0 0;
                        border-left: 2px solid ${activeColor};
                        display: none;
                        flex-direction: column;
                        gap: 14px;
                        opacity: 1;
                        visibility: visible;
                        box-sizing: border-box;
                    }

                    .dropdown-menu.open {
                        display: flex !important;
                    }

                    .dropdown-link {
                        font-size: 15px !important;
                        padding: 4px 0;
                        color: #555555 !important;
                        width: 100% !important;
                    }

                    .controls-group {
                        width: 100%;
                        justify-content: space-between;
                        padding-top: 20px;
                        border-top: 1px solid rgba(0, 0, 0, 0.08);
                        margin-top: 10px;
                    }
                    .burger-btn {
                        display: block;
                    }
                }
            `}</style>

            <div className="nav-container">
                {/* 1. LOGO */}
                <a
                    href={isEn ? "/en" : "/"}
                    className="logo-link"
                    style={{ backgroundImage: `url(${resolvedLogoUrl})` }}
                />

                {/* 2. 右側選單與控制列 */}
                <div className="nav-right">
                    <ul className="nav-menu">
                        {menuItems.map((item, index) => {
                            const hasDropdown =
                                item.dropdown && item.dropdown.length > 0
                            const active = isLinkActive(item.link_url, index)
                            const isAccordionOpen = activeAccordion === index

                            return (
                                <li key={index} className="nav-item">
                                    <a
                                        href={item.link_url}
                                        className={`nav-link ${active ? "active" : ""}`}
                                        onClick={(e) => {
                                            if (
                                                hasDropdown &&
                                                typeof window !== "undefined" &&
                                                window.innerWidth <= 1199
                                            ) {
                                                e.preventDefault()
                                                setActiveAccordion(
                                                    isAccordionOpen
                                                        ? null
                                                        : index
                                                )
                                            }
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
                                                    marginLeft: "6px",
                                                    transform: isAccordionOpen
                                                        ? "rotate(180deg)"
                                                        : "rotate(0deg)",
                                                    transition:
                                                        "transform 0.25s ease",
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

                                    {hasDropdown && (
                                        <div
                                            className={`dropdown-menu ${isAccordionOpen ? "open" : ""}`}
                                        >
                                            {item.dropdown.map((sub, sIdx) => (
                                                <a
                                                    key={sIdx}
                                                    href={sub.link_url}
                                                    className="dropdown-link"
                                                >
                                                    {sub.title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>

                    {/* 3. 控制列 */}
                    <div className="controls-group">
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
                                    width: searchOpen
                                        ? window.innerWidth <= 767
                                            ? "130px"
                                            : "180px"
                                        : "0px",
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
                                        "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, padding 0.3s ease",
                                }}
                            />

                            <button
                                onClick={() => {
                                    if (!searchOpen) {
                                        setSearchOpen(true)
                                    } else {
                                        if (!searchKeyword.trim()) {
                                            closeSearch()
                                        }
                                    }
                                }}
                                className="search-btn"
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

                            {/* 搜尋結果下拉面板 */}
                            {searchOpen && searchKeyword.trim() && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "40px",
                                        right: 0,
                                        width:
                                            window.innerWidth <= 767
                                                ? "calc(100vw - 70px)"
                                                : "320px",
                                        maxWidth: "340px",
                                        maxHeight: "320px",
                                        overflowY: "auto",
                                        backgroundColor: "#ffffff",
                                        borderRadius: "6px",
                                        boxShadow:
                                            "0px 10px 25px 0px rgba(0, 0, 0, 0.15)",
                                        border: "1px solid rgba(0, 0, 0, 0.08)",
                                        padding: "8px 0",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "2px",
                                        zIndex: 99999,
                                        textAlign: "left",
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
                                            {isEn
                                                ? "Searching..."
                                                : "搜尋中..."}
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
                                                        "#f5f5f5"
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor =
                                                        "transparent"
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
                                                        {item.snippet}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 語系切換 */}
                        <div className="lang-dropdown-container">
                            <button className="lang-btn">
                                🌐 {isEn ? "English" : "繁體中文"}
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    style={{ marginLeft: "2px" }}
                                >
                                    <path
                                        d="M1 1.5L5 4.5L9 1.5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <div className="lang-dropdown-menu">
                                <button
                                    className="lang-dropdown-item"
                                    onClick={() =>
                                        handleLanguageChange(
                                            isEn ? "zh-TW" : "en-US"
                                        )
                                    }
                                >
                                    {isEn ? "繁體中文" : "English"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 手機版漢堡排 */}
                <button
                    className="burger-btn"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? (
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    ) : (
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    )}
                </button>
            </div>
        </header>
    )
}

function getDefaultMenu(locale) {
    if (locale === "en-US") {
        return [
            { title: "Home", link_url: "/en", is_active: true },
            {
                title: "About Aalto EMBA",
                link_url: "/en/about-emba",
                is_active: true,
                dropdown: [
                    {
                        title: "About Aalto EMBA",
                        link_url: "/en/about-emba",
                        is_active: true,
                    },
                    {
                        title: "About Aalto University",
                        link_url: "/en/about-aalto",
                        is_active: true,
                    },
                    {
                        title: "About NCU",
                        link_url: "/en/about-ncu",
                        is_active: true,
                    },
                ],
            },
            {
                title: "Learning Info",
                link_url: "/en/eventlist-2",
                is_active: true,
                dropdown: [
                    {
                        title: "Events",
                        link_url: "/en/eventlist-2",
                        is_active: true,
                    },
                    {
                        title: "Alumni Sharing",
                        link_url: "/en/all-alumni",
                        is_active: true,
                    },
                ],
            },
            {
                title: "Programs",
                link_url: "/en/information",
                is_active: true,
                dropdown: [
                    {
                        title: "Admission Info",
                        link_url: "/en/information",
                        is_active: true,
                    },
                    {
                        title: "Degree & Regulations",
                        link_url: "/en/degree",
                        is_active: true,
                    },
                ],
            },
            { title: "Contact", link_url: "/en/contact", is_active: true },
        ]
    }
    return [
        { title: "首頁 Home", link_url: "/", is_active: true },
        {
            title: "關於 Aalto EMBA",
            link_url: "/about-emba",
            is_active: true,
            dropdown: [
                {
                    title: "關於 Aalto EMBA",
                    link_url: "/about-emba",
                    is_active: true,
                },
                {
                    title: "關於Aalto",
                    link_url: "/about-aalto",
                    is_active: true,
                },
                {
                    title: "關於中央大學",
                    link_url: "/about-ncu",
                    is_active: true,
                },
            ],
        },
        {
            title: "學習資訊",
            link_url: "/eventlist-2",
            is_active: true,
            dropdown: [
                {
                    title: "活動訊息",
                    link_url: "/eventlist-2",
                    is_active: true,
                },
                { title: "校友分享", link_url: "/all-alumni", is_active: true },
            ],
        },
        {
            title: "課程相關",
            link_url: "/information",
            is_active: true,
            dropdown: [
                {
                    title: "招生資訊",
                    link_url: "/information",
                    is_active: true,
                },
                { title: "修業與學位", link_url: "/degree", is_active: true },
            ],
        },
        { title: "聯絡方式", link_url: "/contact", is_active: true },
    ]
}

const headerStyle = {
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 1000,
}

addPropertyControls(Navbar, {
    logoImage: {
        type: ControlType.Image,
        title: "Logo 圖片 (畫布預設備用)",
    },
    activeColor: {
        type: ControlType.Color,
        title: "選單啟用/滑過顏色",
        defaultValue: "#d49b38",
    },
    textColor: {
        type: ControlType.Color,
        title: "選單字體顏色",
        defaultValue: "#111111",
    },
    bgColor: {
        type: ControlType.Color,
        title: "背景顏色",
        defaultValue: "#FAF9F5",
    },
})
