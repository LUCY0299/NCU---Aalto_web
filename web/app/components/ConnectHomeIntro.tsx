import { Override, Data } from "framer"
import { useEffect } from "react"

const BASE_URL = "https://ncu-aalto-web.onrender.com"

// 1. 加入自動偵測網址語系的邏輯
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase()
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US"
        }
    }
    return "zh-TW"
}

// 取得當前網址語系
const globalLocale = detectLocale()
const isEn = globalLocale === "en-US"

// 2. 讓預設載入文字支援雙語
const aboutStore = Data({
    title: isEn ? "Loading title..." : "載入標題中...",
    subtitle: isEn ? "Loading subtitle..." : "載入副標題中...",
    content: isEn ? "Loading content..." : "載入內文中...",
    imageUrl: "",
    isActive: true,
})

export function FetchAboutData(): Override {
    useEffect(() => {
        console.log(
            "🚀 嘗試連線 API:",
            `${BASE_URL}/api/v1/content/home/intro?locale=${globalLocale}`
        )

        // 3. 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/home/intro?locale=${globalLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP 錯誤: ${res.status}`)
                return res.json()
            })
            .then((data) => {
                console.log("✅ 成功收到後端資料:", data)

                aboutStore.isActive = data.is_active !== false

                const fields = data.fields
                if (fields) {
                    // 4. 預設文字雙語化防呆
                    aboutStore.title =
                        fields.title || (isEn ? "Default Title" : "預設標題")
                    aboutStore.subtitle =
                        fields.subtitle ||
                        (isEn ? "Default Subtitle" : "預設副標題")
                    aboutStore.content =
                        fields.content ||
                        (isEn ? "Default Content" : "預設內文")

                    if (fields.image_url) {
                        const imgPath = fields.image_url
                        // 防呆：確保斜線不會重複或少寫
                        const finalUrl = imgPath.startsWith("http")
                            ? imgPath
                            : `${BASE_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`

                        aboutStore.imageUrl = `${finalUrl}?t=${new Date().getTime()}`
                    } else {
                        aboutStore.imageUrl =
                            "https://images.unsplash.com/photo-1451187580459-43490279c0fa"
                    }
                    console.log("🖼️ 最終圖片 URL:", aboutStore.imageUrl)
                }
            })
            .catch((err) => {
                console.error("❌ About API 連線失敗:", err)
                aboutStore.title = isEn ? "Connection Failed" : "連線失敗"
                aboutStore.subtitle = isEn
                    ? "Please check server"
                    : "請檢查後端服務"
                aboutStore.content = ""
            })
    }, [])

    if (!aboutStore.isActive) {
        return {
            style: { display: "none" },
        }
    }

    return {}
}

export function BindAboutTitle(): Override {
    return { text: aboutStore.title }
}

export function BindAboutSubtitle(): Override {
    return { text: aboutStore.subtitle }
}

export function BindAboutContent(): Override {
    return { text: aboutStore.content }
}

export function BindAboutImage(): Override {
    if (!aboutStore.imageUrl) {
        return { opacity: 0 }
    }

    return {
        style: {
            backgroundImage: `url("${aboutStore.imageUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "transparent",
        },
    }
}