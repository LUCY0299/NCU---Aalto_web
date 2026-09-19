import { Override, Data } from "framer"
import { useEffect } from "react"

const BASE_URL = "https://ncu-aalto-web.onrender.com"

// 自動偵測語系
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

const detailStore = Data({
    title: globalLocale === "en-US" ? "Loading..." : "載入中...",
    date: globalLocale === "en-US" ? "Loading..." : "載入中...",
    imageUrl: "",
    imageCaption: "",
    loaded: false,
    notFound: false,
})

// ✅ 改為：獲取索引參數
function getEventIndex(): number {
    if (typeof window === "undefined") return -1
    const params = new URLSearchParams(window.location.search)
    return parseInt(params.get("index") || "-1")
}

export function FetchEventDetail(): Override {
    useEffect(() => {
        // ✅ 改為：獲取索引
        const targetIndex = getEventIndex()
        if (targetIndex < 0) {
            detailStore.notFound = true
            detailStore.loaded = true
            return
        }

        // 帶上語系參數 fetch 對應語言
        fetch(
            `${BASE_URL}/api/v1/content/events/event_news?locale=${globalLocale}&t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => res.json())
            .then((data) => {
                const fields = data.fields || {}
                const list =
                    typeof fields.event_list === "string"
                        ? JSON.parse(fields.event_list)
                        : fields.event_list || []

                // ✅ 改為：直接用索引獲取活動
                const item = list[targetIndex]

                if (!item || item.is_active === false) {
                    detailStore.notFound = true
                    detailStore.title =
                        globalLocale === "en-US"
                            ? "Event not found"
                            : "找不到活動"
                    detailStore.date = ""
                    return
                }

                detailStore.title =
                    item.title ||
                    (globalLocale === "en-US" ? "Event Details" : "活動訊息")

                if (item.date) {
                    const d = new Date(item.date)
                    if (!isNaN(d.getTime())) {
                        detailStore.date =
                            globalLocale === "en-US"
                                ? d.toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                  })
                                : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
                    } else {
                        detailStore.date = item.date
                    }
                } else {
                    detailStore.date = ""
                }

                detailStore.imageCaption = item.image_caption || ""

                if (item.image_url) {
                    detailStore.imageUrl = item.image_url.startsWith("http")
                        ? item.image_url
                        : `${BASE_URL}${item.image_url}`
                } else {
                    detailStore.imageUrl = ""
                }
            })
            .catch((err) => {
                console.error("EventDetail API 連線失敗:", err)
                detailStore.notFound = true
                detailStore.title =
                    globalLocale === "en-US" ? "Connection failed" : "連線失敗"
                detailStore.date = ""
            })
            .finally(() => {
                detailStore.loaded = true
            })
    }, [])

    return {}
}

export function EventDetailTitle(): Override {
    return { text: detailStore.title }
}

export function EventDetailDate(): Override {
    return { text: detailStore.date }
}

export function EventDetailImage(): Override {
    if (!detailStore.loaded || !detailStore.imageUrl) {
        return {
            background: { src: "", fit: "cover" },
            backgroundColor: "#e0e0e0",
        }
    }
    return {
        background: { src: detailStore.imageUrl, fit: "cover" },
        backgroundColor: "transparent",
    }
}

export function EventDetailImageLoadingText(): Override {
    return {
        visible: !detailStore.loaded,
        text: globalLocale === "en-US" ? "Loading..." : "載入中...",
    }
}

export function EventDetailImageCaption(): Override {
    if (!detailStore.loaded) {
        return {
            text: globalLocale === "en-US" ? "Loading..." : "載入中...",
            visible: true,
        }
    }
    if (!detailStore.imageCaption) {
        return { visible: false }
    }
    return { text: detailStore.imageCaption, visible: true }
}
