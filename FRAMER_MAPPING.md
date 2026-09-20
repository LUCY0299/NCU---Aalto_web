# Framer Code Components 對應表

本文件記錄所有 Framer Code Components 與後台 API 的對應關係，幫助開發者快速定位前後端數據流。

---

## 🔄 後端修改 → 前端影響

當你在後台修改頁面/區塊時，會影響 Framer 前台的哪個 Component？

### 修改流程

```
後台管理系統
    ↓
修改「頁面」(page_slug) + 「區塊」(section_key)
    ↓
保存至資料庫
    ↓
Framer Component 自動讀取新資料（API call）
    ↓
前台頁面自動更新 ✅
```

### 舉例：修改「學習資訊」頁面

| 你修改了... | 後台位置 | API 端點 | 對應 Framer Component |
|-----------|---------|---------|-----------|
| 標題 | 頁面：learning → 區塊：learning_header → 欄位：title | `/api/v1/content/learning/learning_header` | LearningInfo.tsx 的 `<h1>` |
| 圖片 | 頁面：learning → 區塊：learning_header → 欄位：hero_image | `/api/v1/content/learning/learning_header` | LearningInfo.tsx 的 `<img>` |
| 描述 | 頁面：learning → 區塊：learning_header → 欄位：description | `/api/v1/content/learning/learning_header` | LearningInfo.tsx 的 `<p class="learning-desc">` |
| 停用區塊 | 頁面：learning → 區塊：learning_header → 欄位：is_active = false | `/api/v1/content/learning/learning_header` | LearningInfo.tsx **完全隱藏**（回傳 null） |

### 快速查詢：修改某頁面會影響哪些 Components

| 後台頁面 | 中文名稱 | 對應 Framer Components |
|---------|---------|-----------------|
| `home` | 首頁 | ConnectHomeHero.tsx, ConnectHomeIntro.tsx |
| `learning` | 學習資訊 | LearningInfo.tsx |
| `alumni` | 校友分享 | AlumniList.tsx |
| `events` | 活動訊息 | EventList.tsx, EventDetail.tsx, EventDetailBody.tsx |
| `admission` | 招生資訊 | Information.tsx |
| `degree` | 修業與學位 | Degree.tsx |
| `contact` | 聯絡方式 | Contact.tsx |
| `about` | 關於 Aalto EMBA | AboutNCU.tsx |

---

## 📋 概述

| 項目 | 說明 |
|------|------|
| **總數** | 16 個 Code Components |
| **語言** | React (TypeScript) |
| **API 基礎** | `http://aalto-api.mgt.ncu.edu.tw/api/v1/content/{slug}/{section_key}` |
| **多語系** | 支援 zh-TW（繁體中文）、en-US（英文） |

---

## 🔗 Code Components 列表

### 1. **LearningInfo.tsx** ⭐ 最常修改

| 項目 | 內容 |
|------|------|
| **用途** | 學習資訊區塊（標題、圖片、描述） |
| **對應後台頁面** | `learning`（學習資訊） |
| **對應後台區塊** | `learning_header`（學習資訊(頂部標題與大圖)） |
| **API 端點** | `/api/v1/content/learning/learning_header?locale=zh-TW` |
| **數據字段** | `title`, `hero_image`, `description`, `is_active` |
| **支援語系** | ✅ 自動偵測 / 手動設定 |
| **特殊功能** | 支援區塊啟用/停用 (is_active)、圖片 URL 自動補全、Responsive 響應式 |

**代碼位置**：Framer Code 面板

**後台欄位 → 前端顯示對應**：

| 後台欄位 | 前端渲染位置 | LearningInfo.tsx 代碼 |
|---------|-----------|-----------------|
| `title` | 頁面大標題 | `<h1 className="learning-title">{data.title}</h1>` |
| `hero_image` | 滿版背景圖 | `<img src={data.heroImage} className="learning-hero-img" />` |
| `description` | 圖片下方描述文 | `<p className="learning-desc">{data.description}</p>` |
| `is_active = false` | **整個區塊隱藏** | Component 回傳 `null`（不渲染） |
| `is_active = true` | 區塊正常顯示 | 所有內容正常渲染 |

**備註**：
- 若後台設定 `is_active=false`，元件會完全隱藏（回傳 null）
- 支援自動偵測網址語系（`/en` 或 `-en` 路徑）
- 圖片支援相對路徑和完整 URL
- ⏱️ 前台更新延遲：~3-5 秒（取決於 Render 伺服器）

---

### 2. **AboutNCU.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 關於 NCU 介紹 |
| **對應後台頁面** | `about`（關於 Aalto EMBA） |
| **對應後台區塊** | `about_intro`（關於介紹） |
| **API 端點** | `/api/v1/content/about/about_intro?locale=zh-TW` |

---

### 3. **AlumniList.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 校友分享列表（動態渲染多筆校友卡片） |
| **對應後台頁面** | `alumni`（校友分享） |
| **對應後台區塊** | `alumni_sharing`（校友分享(卡片外部連結)） |
| **API 端點** | `/api/v1/content/alumni/alumni_sharing?locale=zh-TW` |
| **數據格式** | 陣列，每項包含 `title`, `subtitle`, `content`, `image_url`, `date` |
| **類型** | Code Component（動態清單）|

---

### 4. **Contact.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 聯絡資訊（地址、電話、Email） |
| **對應後台頁面** | `contact`（聯絡方式） |
| **對應後台區塊** | `contact-info`（聯絡資訊） |
| **API 端點** | `/api/v1/content/contact/contact-info?locale=zh-TW` |
| **數據字段** | `title`, `address`, `phone`, `email`, `map_url` |

---

### 5. **Degree.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 修業與學位資訊 |
| **對應後台頁面** | `degree`（修業與學位） |
| **對應後台區塊** | `degree-regulations`（修業規定）、`degree-certification`（學位授予） |
| **API 端點** | `/api/v1/content/degree/degree-regulations?locale=zh-TW` |

---

### 6. **Information.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 招生資訊（多區塊組合） |
| **對應後台頁面** | `admission`（招生資訊） |
| **對應後台區塊** | `admission-hero`（招生 頂部）、`admission-info`（招生資訊）、`admission-requirements`（入學門檻） |
| **API 端點** | `/api/v1/content/admission/admission-hero?locale=zh-TW` |

---

### 7. **EventDetail.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 活動詳情頁頂部（標題、日期、圖片） |
| **對應後台頁面** | `events`（活動訊息） |
| **對應後台區塊** | `event_news`（活動訊息） |
| **API 端點** | `/api/v1/content/events/event_news?locale=zh-TW` |
| **特殊功能** | 根據網址參數 `?i=N` 顯示第 N 筆活動 |

**注意**：`FetchEventDetail` Override 需套在頁面最外層，其他 Override 才能讀取資料

---

### 8. **EventList.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 活動列表卡片（動態清單） |
| **對應後台頁面** | `events`（活動訊息） |
| **對應後台區塊** | `event_news`（活動訊息） |
| **API 端點** | `/api/v1/content/events/event_news?locale=zh-TW` |
| **類型** | Code Component（動態清單）|
| **數據字段** | `title`, `date`, `image_url`, `image_caption` |

---

### 9. **EventDetailBody.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 活動詳情頁自訂內文（圖片/文字區塊陣列） |
| **對應後台頁面** | `events`（活動訊息） |
| **對應後台區塊** | `event_news`（活動訊息） |
| **API 端點** | `/api/v1/content/events/event_news?locale=zh-TW` |
| **特殊功能** | 依後台設定順序動態渲染區塊，支援圖片和文字混合 |

**備註**：內部有獨立的 fetch，會重複打同一 API（可優化）

---

### 10. **ConnectHomeHero.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 首頁 Hero 區塊（大標題、副標題、背景圖） |
| **對應後台頁面** | `home`（首頁） |
| **對應後台區塊** | `hero`（頂部橫幅 (Hero)） |
| **API 端點** | `/api/v1/content/home/hero?locale=zh-TW` |
| **類型** | Override（固定欄位）|

---

### 11. **ConnectHomeIntro.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 首頁關於本計畫區塊 |
| **對應後台頁面** | `home`（首頁） |
| **對應後台區塊** | `intro`（計畫介紹） |
| **API 端點** | `/api/v1/content/home/intro?locale=zh-TW` |

---

### 12. **Navbar.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 導航欄（Logo、菜單、語言切換） |
| **特殊功能** | 跨頁面共用，支援多語系切換 |
| **不需 API** | — |

**備註**：可能會從後台讀取 Logo 或菜單結構

---

### 13. **Footer.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 頁尾（聯絡、連結、版權） |
| **特殊功能** | 跨頁面共用 |
| **不需 API** | — |

---

### 14. **CTASection.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | Call-to-Action 區塊（按鈕、標題） |
| **特殊功能** | 可能用在多個頁面 |

---

### 15. **null.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | ❓ 佔位符或測試檔案 |
| **狀態** | ⚠️ 待確認用途 |

---

### 16. **DynamicSEO.tsx**

| 項目 | 內容 |
|------|------|
| **用途** | 動態 SEO 元標籤（title、description、OG 標籤） |
| **特殊功能** | 根據頁面動態設定 meta 標籤 |
| **不需 API** | — |

---

## 🔄 API 通訊流程

```
Framer Component
    ↓
fetch(`http://aalto-api.mgt.ncu.edu.tw/api/v1/content/{slug}/{section_key}?locale=zh-TW`)
    ↓
後台 FastAPI
    ↓
SQLAlchemy Query (SQLite / PostgreSQL)
    ↓
返回 JSON：
{
  "is_active": true,
  "fields": {
    "title": "...",
    "description": "...",
    "image_url": "/uploads/xxx.jpg"
  }
}
```

---

## 🌍 多語系處理

### 自動偵測（LearningInfo 範例）

```typescript
const detectLocale = () => {
    if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase()
        if (path.includes("/en") || path.includes("-en")) {
            return "en-US"
        }
    }
    return "zh-TW"
}
```

### API 請求

```typescript
// 新增 locale 參數
fetch(`${API_URL}?locale=${currentLocale}`)
```

---

## 📷 圖片處理

後台 `image` 類型欄位存的是**相對路徑**，需要前端補全：

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://aalto-api.mgt.ncu.edu.tw";

const getImageUrl = (url) => {
    if (!url) return ""
    return url.startsWith("http")
        ? url
        : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}
```

### Framer 圖片圖層

**✅ 正確**：
```typescript
background: { src: imageUrl, fit: "cover" }
```

**❌ 錯誤**（對 Framer 原生 Image 圖層無效）：
```typescript
CSS: { backgroundImage: `url(${imageUrl})` }
```

---

## 🚨 常見問題

### 元件無法讀取資料

1. ✅ 後端 Uvicorn 是否在執行
2. ✅ Dev Tunnel / Render 網址是否正確
3. ✅ API 是否回應 200（檢查瀏覽器 Network tab）
4. ✅ 後台該區塊是否有資料（`is_active=true`）

### 多語系不切換

1. ✅ 確認 Component 有傳 `locale` props
2. ✅ 確認 API 有帶 `?locale=zh-TW` 參數
3. ✅ 後台是否有該語系的資料

### 區塊被隱藏（無法看到）

1. ✅ 後台是否設定 `is_active=false`
2. ✅ 檢查 Framer 圖層的 Visible / Opacity

---

## 📝 新增 Component 時的檢查清單

- [ ] Component 檔名是否清楚（例如 `EventList.tsx`）
- [ ] 後台對應頁面是否存在（例如 `events`）
- [ ] 後台對應區塊是否存在（例如 `event_news`）
- [ ] API 端點是否正確：`/api/v1/content/{page_slug}/{section_key}`
- [ ] 是否支援多語系（需加 `?locale=` 參數）
- [ ] 圖片路徑是否用 `getImageUrl()` 補全
- [ ] 是否正確處理 `is_active` 停用狀態
- [ ] 是否在本機測試過（用 uvicorn + Dev Tunnel）

---

## 🔗 相關資源

- **後台系統**：本 Repository
- **前台網站**：[Framer](https://crowded-pictogram-488999.framer.app)
- **API 文件**：`http://localhost:8000/docs`（本機）或後端部署網址

---

**最後更新**：2025-08-24
