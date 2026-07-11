import React, { useState, useEffect } from "react"

const BASE_URL = "https://06ffl4gs-8000.jpe1.devtunnels.ms"

function getEventIndex() {
    if (typeof window === "undefined") return -1
    const params = new URLSearchParams(window.location.search)
    const i = params.get("i")
    return i !== null ? parseInt(i, 10) : -1
}

export default function EventDetailBody() {
    const [blocks, setBlocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const index = getEventIndex()
        if (index < 0) {
            setError("網址缺少 ?i= 參數")
            setLoading(false)
            return
        }

        fetch(
            `${BASE_URL}/api/v1/content/events/event_news?t=${new Date().getTime()}`,
            {
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            }
        )
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((data) => {
                const fields = data.fields || {}
                const list =
                    typeof fields.event_list === "string"
                        ? JSON.parse(fields.event_list)
                        : fields.event_list || []

                const item = list[index]
                if (!item) {
                    setError(`找不到索引 ${index} 的活動資料`)
                    return
                }
                setBlocks(Array.isArray(item.blocks) ? item.blocks : [])
            })
            .catch((err) => {
                console.error("EventDetailBody API 連線失敗:", err)
                setError(`連線失敗：${err.message}`)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    if (loading)
        return (
            <div style={{ padding: "20px 0", color: "#999" }}>內文載入中...</div>
        )
    if (error)
        return <div style={{ padding: "20px 0", color: "#c00" }}>⚠️ {error}</div>
    if (blocks.length === 0)
        return (
            <div style={{ padding: "20px 0", color: "#999" }}>
                此活動尚無詳細內容
            </div>
        )

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                width: "100%",
            }}
        >
            {blocks.map((block, index) => (
                <div key={index}>
                    {block.type === "text" && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "16px",
                                lineHeight: 1.8,
                                color: "#333",
                            }}
                        >
                            {block.text}
                        </p>
                    )}

                    {block.type === "image" && block.image_url && (
                        <img
                            src={
                                block.image_url.startsWith("http")
                                    ? block.image_url
                                    : `${BASE_URL}${block.image_url}`
                            }
                            style={{
                                width: "100%",
                                borderRadius: "8px",
                                display: "block",
                            }}
                        />
                    )}

                    {block.type === "caption" && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "13px",
                                fontStyle: "italic",
                                color: "#888",
                                borderLeft: "3px solid #ccc",
                                paddingLeft: "12px",
                            }}
                        >
                            {block.text}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
