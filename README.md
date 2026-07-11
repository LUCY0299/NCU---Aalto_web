# NCU × Aalto EMBA 後台管理系統

國立中央大學 × 阿爾托大學 EMBA 在職學位學程的網站內容管理系統（CMS）。  
提供網站頁面、區塊、多語系內容的新增、編輯與刪除功能，並透過 REST API 供 Framer 前台動態取用。

---

## 目錄

- [專案結構](#專案結構)
- [技術架構](#技術架構)
- [快速開始](#快速開始)
- [登入帳密](#登入帳密)
- [API 文件](#api-文件)
- [資料模型](#資料模型)
- [後台頁面 × Framer 元件對應表](#後台頁面--framer-元件對應表)
- [Git 協作流程](#git-協作流程)
- [部署指南](#部署指南)
- [注意事項](#注意事項)

---

## 專案結構

```
NCU × Aalto_web/
├── framer-admin/
│   ├── backend/                # Python FastAPI 後端
│   │   ├── main.py             # 應用程式入口點
│   │   ├── models.py           # SQLAlchemy 資料模型
│   │   ├── schemas.py          # Pydantic 資料驗證
│   │   ├── database.py         # 資料庫連線設定
│   │   ├── seed.py             # 初始資料載入腳本
│   │   ├── change_password.py  # 修改管理員密碼工具
│   │   ├── requirements.txt    # Python 套件清單
│   │   ├── .env                # 環境變數（不可上傳 Git）
│   │   ├── .env.example        # 環境變數範本
│   │   └── routers/
│   │       ├── auth.py         # 登入驗證 API
│   │       └── pages.py        # 頁面管理 CRUD API
│   └── frontend/               # 靜態 HTML 後台介面
│       ├── index.html          # 登入頁
│       ├── dashboard.html      # 儀表板（頁面樹狀管理）
│       ├── editor.html         # 頁面內容編輯器
│       └── css/
│           └── admin.css       # 後台樣式
├── deploy.sh                   # GitHub Pages 部署腳本
└── README.md
```

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 後端框架 | FastAPI 0.111 |
| ASGI 伺服器 | Uvicorn |
| ORM | SQLAlchemy 2.0 |
| 資料庫（開發） | SQLite |
| 資料庫（正式） | PostgreSQL |
| 驗證機制 | JWT（python-jose + passlib/bcrypt） |
| 前端 | 原生 HTML / CSS / JavaScript |

---

## 快速開始

### 1. 建立虛擬環境並安裝套件

```bash
cd framer-admin/backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. 設定環境變數

複製 `.env.example` 並修改內容：

```bash
cp .env.example .env
```

`.env` 最低設定：

```env
SECRET_KEY=your-random-secret-key-here
TOKEN_EXPIRE_HOURS=24
DATABASE_URL=sqlite:///./admin.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ncu-aalto-2024
```

> 產生隨機密鑰：`python -c "import secrets; print(secrets.token_hex(32))"`

### 3. 載入初始資料

```bash
python seed.py
```

這會自動建立：
- 管理員帳號
- 網站所有頁面（首頁、關於、校友分享、招生資訊等）
- 每個頁面的初始區塊與繁體中文 / 英文內容

### 4. 啟動伺服器

```bash
uvicorn main:app --reload --port 8000
```

啟動後可前往：

| 網址 | 說明 |
|------|------|
| `http://localhost:8000/admin` | 後台管理介面 |
| `http://localhost:8000/docs` | Swagger API 文件 |
| `http://localhost:8000/redoc` | ReDoc API 文件 |

---

## 登入帳密

| 欄位 | 值 |
|------|-----|
| 帳號 | `admin` |
| 密碼 | `ncu-aalto-2024` |

> **正式上線前務必修改密碼！**  
> 執行 `python change_password.py` 或直接修改 `.env` 後重新執行 `seed.py`。

---

## API 文件

完整互動式 API 文件請啟動伺服器後前往 `/docs`。以下為主要端點摘要：

### 驗證

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登入，取得 JWT Token |
| GET  | `/api/v1/auth/me` | 取得目前登入使用者資訊 |

### 頁面管理（需要登入）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET    | `/api/v1/pages` | 取得所有頁面列表 |
| GET    | `/api/v1/pages/{slug}` | 取得指定頁面完整內容 |
| POST   | `/api/v1/pages` | 新增頁面 |
| PUT    | `/api/v1/pages/{slug}` | 更新頁面基本資訊 |
| DELETE | `/api/v1/pages/{slug}` | 刪除頁面 |
| GET    | `/api/v1/page-tree` | 取得頁面樹狀結構（後台用） |

### 區塊與內容

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST   | `/api/v1/pages/{slug}/sections` | 新增區塊 |
| PUT    | `/api/v1/sections/{id}` | 更新區塊 |
| DELETE | `/api/v1/sections/{id}` | 刪除區塊 |
| PUT    | `/api/v1/sections/{id}/fields` | 批量更新區塊欄位內容 |

### Framer 前台專用（不需登入）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/v1/content/{slug}/{section_key}?locale=zh-TW` | 取得指定區塊內容（key-value 格式） |

**Framer Code Component 範例：**

```javascript
const data = await fetch(
  'https://your-api.com/api/v1/content/home/hero?locale=zh-TW'
).then(r => r.json());

console.log(data.fields.title);    // "培育未來領袖"
console.log(data.fields.subtitle); // "NCU × Aalto University EMBA Program"
```

---

## 資料模型

```
Page（頁面）
  ├── Section（區塊）× N
  │     └── ContentField（欄位）× N × 語系
  └── children（子頁面，遞迴）
```

- **Page**：網站頁面（首頁、校友分享等），支援父子階層
- **Section**：頁面內的功能區塊（Hero、介紹文字、統計數字等）
- **ContentField**：區塊內的文字欄位，每個欄位有 `zh-TW` 和 `en-US` 兩份資料

---

## 後台頁面 × Framer 元件對應表

這份對照表是為了讓你（或之後接手的人）**看到後台某個頁面／區塊**，就能馬上知道**要去 Framer 改哪個檔案**；反過來看到 Framer 某個檔案報錯，也能知道**對應後台哪個資料**。

> ⚠️ Framer 端的程式碼（`.tsx` 檔）存放在 **Framer 雲端專案的 Code 面板裡**，不是這個 Git 專案的檔案，所以本機找不到它們。這裡列出的是目前已知在 Framer 專案「Code」清單裡的檔案。

### 兩種 Framer 程式碼的差別

| 類型 | 檔案怎麼用 | 用在什麼情況 |
|---|---|---|
| **Override**（覆寫） | 直接「套」在畫布上**既有的圖層**上，把資料塞進去（文字、圖片網址等），不會自己畫版面 | 每筆資料**固定只有一組**欄位的情況，例如首頁 Hero 的標題、聯絡頁的地址 |
| **Code Component**（元件） | 從 Assets 面板拖曳到畫布上，是**獨立的一個元件**，自己決定要畫成什麼樣子 | 資料**筆數不固定、需要動態產生清單**的情況，例如活動卡片列表、內文區塊 |

---

### 首頁（home）

| 後台頁面 / 區塊 | 說明 | 對應 Framer 檔案 | 類型 |
|---|---|---|---|
| `home` → `hero` | 首頁最上方大圖橫幅：主標題、副標題、敘述文字、背景圖 | `ConnectHomeHero.tsx` | Override |
| `home` → `intro` | 「關於本計畫」介紹區塊：標題、副標題、介紹內文、圖片 | `ConnectHomeIntro.tsx` | Override |

### 校友分享（alumni，父層 learning）

| 後台頁面 / 區塊 | 說明 | 對應 Framer 檔案 | 類型 |
|---|---|---|---|
| `alumni` → `alumni_sharing` → `alumni_list` | 校友分享清單（標題、大綱、狀態、照片、日期、完整內容富文本） | `AlumniList.tsx` | Code Component |

### 活動訊息（events，父層 learning）

活動訊息是**目前架構最複雜的模組**，同一份資料 `event_news` → `event_list` 被拆成三個 Framer 檔案共同使用：

| 後台欄位 | 說明 | 對應 Framer 檔案 | 類型 | 用在哪個頁面 |
|---|---|---|---|---|
| `title` / `date` / `image_url` / `image_caption` | 卡片列表要顯示的欄位 | `EventList.tsx` | Code Component | 活動列表頁（`/event`），動態產生所有卡片，點「Read More」會帶 `?i=索引` 連到詳情頁 |
| `title` / `date` / `image_url` / `image_caption` | 詳情頁最上方固定欄位（標題、日期、封面圖、封面圖說） | `EventDetail.tsx` | Override（共 5 個：`FetchEventDetail`、`EventDetailTitle`、`EventDetailDate`、`EventDetailImage`、`EventDetailImageCaption`、`EventDetailImageLoadingText`） | 活動詳情頁（`/eventlist-2?i=N`） |
| `blocks`（文字／圖片／圖說區塊陣列，順序、數量不固定） | 詳情頁下方的自訂內文，依照後台設定的順序動態渲染 | `EventDetailBody.tsx` | Code Component | 活動詳情頁（`/eventlist-2?i=N`），放在 `EventDetail.tsx` 綁定的固定欄位下方 |

> **`FetchEventDetail` 一定要套在頁面最外層 Frame 上**，負責打 API 抓資料存進共用的 `detailStore`，其他 4 個 Override 才抓得到值。
> 網址上的 `?i=` 是「這筆活動在清單裡的第幾筆（從 0 開始）」，這個參數只有在**真正發布的網址**（`crowded-pictogram-488999.framer.app/...`）才會正確運作，Framer 編輯器內建的預覽模式不支援。
> `EventDetailBody.tsx` 內部有自己獨立的 `fetch`，跟 `EventDetail.tsx` 的 `FetchEventDetail` 各打一次 API（同一個端點打兩次），這是已知可以優化但目前還沒處理的地方。

### 招生資訊（admission，父層 courses）

| 後台頁面 / 區塊 | 說明 | 對應 Framer 檔案 | 類型 |
|---|---|---|---|
| `admission` → `admission-hero` | 招生頁頂部：主標題、副標題 | `Information.tsx` | Override |
| `admission` → `admission-info` | 招生資訊：標題、圖片 ×2、小標、內文 | `Information.tsx` | Override |
| `admission` → `admission-requirements` | 入學門檻：標題、圖片、小標、內文 | `Information.tsx` | Override |

### 修業與學位（degree，父層 courses）

| 後台頁面 / 區塊 | 說明 | 對應 Framer 檔案 | 類型 |
|---|---|---|---|
| `degree` → `degree-hero` | 頂部：主標題、副標題 | `Degree.tsx` | Override |
| `degree` → `degree-regulations` | 修業規定：標題 + 一、課程架構（小標+內文）+ 二、個人論文（小標+內文） | `Degree.tsx` | Override |
| `degree` → `degree-certification` | 學位授予：標題 + 一、學位證明（小標+內文）+ 二、結業證明（小標+內文） | `Degree.tsx` | Override |

### 聯絡方式（contact）

| 後台頁面 / 區塊 | 說明 | 對應 Framer 檔案 | 類型 |
|---|---|---|---|
| `contact` → `contact-info` | 標題、副標題、地圖搜尋地址、電話、Email、地址 | `Contact.tsx` | Override |

### 其他

| Framer 檔案 | 說明 |
|---|---|
| `Examples.tsx` | Framer 內建範例檔案，非本專案自己寫的，可忽略 |

---

### 圖片欄位的重要規則

後台 `image` 類型欄位存的是**相對路徑**（例如 `/uploads/xxx.jpg`），前端要組合成完整網址才抓得到圖：

```javascript
const BASE_URL = "https://06ffl4gs-8000.jpe1.devtunnels.ms" // 目前用的 Dev Tunnel 網址，重開機/重連可能會變
const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`
```

Framer 圖片填滿型圖層要用 `background: { src, fit: "cover" }` 這種寫法覆寫，**不能用 CSS 的 `backgroundImage`**（對 Framer 原生 Image 圖層無效）。

### 之後要維護前端時的排查順序

1. **畫面完全空白、什麼提示文字都沒有** → 先檢查該圖層的 **Code Overrides** 是否還綁著正確的 File / Override 名稱，再檢查 **Visible / Opacity**，最後才懷疑是資料問題
2. **畫面卡在「載入中」不會結束** → 檢查你電腦上的 backend（`uvicorn`）跟 VS Code Dev Tunnel 是不是都還在跑
3. **想確認到底是「沒資料」還是「還在載入」** → 看 `EventDetail.tsx` 裡的 `detailStore.loaded` 邏輯，載入中／沒資料／有資料三種狀態畫面長得不一樣，一眼就能分辨
4. **排版跑版、位置跑掉** → 通常是某個 Stack 的 Direction（水平/垂直）或 Padding 跟旁邂的 Stack 不一致，兩邊對照著改成一樣
5. **改了程式碼但畫面沒反應** → 先確認是不是在 Framer 編輯器內建預覽（不支援網址參數），要去真正 Publish 後的網址測試；如果還是不行，試試刪除畫布上那個元件的實體，重新從 Assets 拖一個新的上去

---

## Git 協作流程

目前有兩位編輯者，各自在自己的子分支上開發：

| 編輯者 | 分支名稱 |
|--------|----------|
| Lucy | `lucy` |
| Rong | `rong` |

`main` 是主分支，**不要直接在 `main` 上修改內容**，所有修改都在自己的子分支完成，測試沒問題後再合併回 `main`。

### 每次開始修改前：把 main 的最新內容同步到自己的子分支

```bash
# 1. 切回自己的子分支（以 rong 為例，lucy 同理）
git checkout rong

# 2. 從 origin 拉取 main 最新內容
git fetch origin
git pull origin main

# 3. 如果有衝突，解決後再提交
git add <衝突檔案>
git commit
```

> 這樣可以確保自己的分支包含 main 上最新的內容，再開始修改，避免之後合併時衝突太多。

### 修改完成後：提交並推上自己的分支

```bash
git add <修改的檔案>
git commit -m "說明這次修改了什麼"
git push origin rong   # lucy 則是 git push origin lucy
```

### 修改確認沒問題後：合併回 main

```bash
# 1. 先確保自己分支是最新（重複「同步」步驟，避免漏掉別人剛推的更新）
git checkout rong
git pull origin main

# 2. 切到 main 並更新到最新
git checkout main
git pull origin main

# 3. 把自己的分支合併進 main
git merge rong   # lucy 則是 git merge lucy

# 4. 如果有衝突，解決後
git add <衝突檔案>
git commit

# 5. 把合併後的 main 推上 origin（本地端與 origin 都要更新）
git push origin main
```

### 合併完之後

回到自己的子分支繼續開發前，記得再拉一次最新的 `main`：

```bash
git checkout rong   # 或 lucy
git pull origin main
```

### 流程總結

```
1. checkout 自己分支 → pull origin main（同步最新內容）
2. 修改 → commit → push origin 自己分支
3. checkout main → pull origin main → merge 自己分支 → push origin main
4. 回到自己分支 → pull origin main（同步剛合併的內容，準備下一輪修改）
```

> ⚠️ 兩人合併到 `main` 前，建議先在群組裡說一聲，避免同時合併造成衝突或互相覆蓋。

---

## 部署指南

### 後端（必須部署到伺服器）

FastAPI 後端需要能執行 Python 的環境。推薦雲端平台：

| 平台 | 免費方案 | 說明 |
|------|---------|------|
| [Railway](https://railway.app) | 有 | 最簡單，支援一鍵部署 |
| [Render](https://render.com) | 有 | 免費方案會休眠 |
| [fly.io](https://fly.io) | 有 | 效能較好 |

部署到雲端後，記得將三個前端 HTML 檔案裡的 API 網址從本機改為雲端網址：

```javascript
// 改這一行（index.html、dashboard.html、editor.html 都要改）
const API_BASE = 'https://your-deployed-api.com';
```

正式環境也請設定 CORS，將 `main.py` 中的 `allow_origins=["*"]` 改為實際網域。

### 前端（GitHub Pages）

前端是純靜態 HTML，可以部署到 GitHub Pages。  
先確認後端已部署並更新 `API_BASE`，再執行：

```bash
# 需要在 Git Bash 中執行（不支援 PowerShell）
sh deploy.sh
```

部署後網址：`https://lucy0299.github.io/NCU---Aalto_web/`

---

## 注意事項

- `.env` 檔案含有密鑰，**絕對不能上傳 GitHub**（已加入 `.gitignore`）
- `admin.db` 是 SQLite 資料庫檔案，含有所有資料，**不要上傳 Git**
- 正式上線前建議將資料庫從 SQLite 改為 PostgreSQL（`.env` 中修改 `DATABASE_URL`）
- `seed.py` 可重複執行，不會重複建立已存在的資料
