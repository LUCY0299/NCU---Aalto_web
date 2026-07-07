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
