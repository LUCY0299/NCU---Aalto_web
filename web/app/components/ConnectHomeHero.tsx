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
const heroStore = Data({
    title: isEn ? "Loading..." : "載入中...",
    subtitle: isEn ? "Loading..." : "載入中...",
    description: isEn ? "Loading..." : "載入中...",
    isActive: true,
    imageUrl: "",
})

export function FetchHeroData(): Override {
    useEffect(() => {
        // 3. 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/home/hero?locale=${globalLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                heroStore.isActive = data.is_active !== false

                const fields = data.fields ? data.fields : data

                // 4. 預設文字雙語化防呆
                heroStore.title =
                    fields.title || (isEn ? "Default Title" : "預設主標題")
                heroStore.subtitle =
                    fields.subtitle ||
                    (isEn ? "Default Subtitle" : "預設副標題")
                heroStore.description =
                    fields.description ||
                    (isEn ? "Default Description" : "預設敘述文字")

                if (fields.image_url) {
                    const imgPath = fields.image_url
                    const finalUrl = imgPath.startsWith("http")
                        ? imgPath
                        : `${BASE_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}` // 確保斜線不會重複或少寫

                    heroStore.imageUrl = `${finalUrl}?t=${new Date().getTime()}`
                }
            })
            .catch((err) => {
                console.error("Hero API 連線失敗:", err)
                heroStore.title = isEn ? "Connection Failed" : "連線中斷"
                heroStore.subtitle = isEn
                    ? "Please check server status"
                    : "請檢查後端服務"
                heroStore.description = ""
            })
    }, [])

    if (!heroStore.isActive) {
        return {
            style: { display: "none" },
        }
    }

    return {}
}

export function BindHeroBackgroundImage(): Override {
    if (!heroStore.imageUrl) {
        return {}
    }

    return {
        style: {
            backgroundImage: `url("${heroStore.imageUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "transparent",
        },
    }
}

export function BindHeroBigText(): Override {
    return { text: heroStore.title }
}

export function BindHeroMediumText(): Override {
    return { text: heroStore.subtitle }
}

export function BindHeroSmallText(): Override {
    return { text: heroStore.description }
}