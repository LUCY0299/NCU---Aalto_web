# NCU × Aalto EMBA 後台管理系統

![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

國立中央大學 × 阿爾托大學 EMBA 在職學位學程的**內容管理系統（CMS）**。提供頁面、區塊、多語系內容管理，並透過 REST API 供 Framer 前台動態取用。

**🔗 相關資源**
- [GitHub](https://github.com/LUCY0299/NCU---Aalto_web)
- [後台管理](https://lucy0299.github.io/NCU---Aalto_web/)
- [Framer 前台](https://crowded-pictogram-488999.framer.app)

---

## 目錄

- [功能特性](#功能特性)
- [技術棧](#技術棧)
- [快速開始](#快速開始)
- [登入帳密](#登入帳密)
- [API 文件](#api-文件)
- [資料模型](#資料模型)
- [環境切換](#環境切換)
- [部署指南](#部署指南)
- [Git 協作流程](#git-協作流程)
- [常見問題](#常見問題)
- [故障排除](#故障排除)
- [開發者](#開發者)
- [注意事項](#注意事項)
- [授權](#授權)

---

## 功能特性

- 📄 **頁面管理**：支援無限層級頁面樹狀結構
- 🧩 **區塊編輯**：靈活新增/編輯/刪除內容區塊
- 🌍 **多語系**：支援繁體中文、英文自動切換
- 🔐 **JWT 認證**：安全的登入驗證機制
- 📱 **Framer 集成**：REST API 供前台動態取用
- 🔄 **雙環境**：開發（SQLite）/ 正式（PostgreSQL + Render）
- ⚙️ **自動 API 文件**：Swagger 和 ReDoc

---

## 技術棧

| 項目 | 技術 |
|------|------|
| **框架** | FastAPI 0.111.0 |
| **伺服器** | Uvicorn (ASGI) |
| **ORM** | SQLAlchemy 2.0 |
| **資料庫（開發）** | SQLite |
| **資料庫（正式）** | PostgreSQL (Supabase) |
| **認證** | JWT + passlib/bcrypt |
| **驗證** | Pydantic |
| **前端** | 原生 HTML/CSS/JS |
| **設計工具** | Framer |

---

## 快速開始

### 系統需求
- Python 3.8+
- Git
- VSCode（推薦）

### 1. 克隆並進入項目

```bash
git clone https://github.com/LUCY0299/NCU---Aalto_web.git
cd NCU---Aalto_web/framer-admin/backend
```

### 2. 建立虛擬環境

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. 安裝依賴

```bash
pip install -r requirements.txt
```

### 4. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`（預設本機開發）：

```env
SECRET_KEY=your-random-secret-key-here
TOKEN_EXPIRE_HOURS=24
DATABASE_URL=sqlite:///./admin.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password-here
```

> 產生隨機密鑰：`python -c "import secrets; print(secrets.token_hex(32))"`

### 5. 初始化資料庫

```bash
python seed.py
```

### 6. 啟動伺服器

```bash
uvicorn main:app --reload --port 8000
```

訪問：
- 後台：http://localhost:8000/admin
- API 文件：http://localhost:8000/docs
- ReDoc：http://localhost:8000/redoc

---

## 登入帳密

### 本機開發環境（SQLite）

| 欄位 | 值 |
|------|-----|
| 帳號 | `admin` |
| 密碼 | `your-admin-password-here` |

### 遠端正式環境（Render + Supabase）

| 欄位 | 值 |
|------|-----|
| 帳號 |  `admin` |
| 密碼 | `your-render-password-here` |

> 遠端環境帳密存於 Render 的環境變數中，不公開在程式碼中

---

## API 文件

完整文件請啟動後訪問 `/docs`。主要端點：

### 驗證
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/v1/auth/login` | 登入，取得 JWT |
| GET  | `/api/v1/auth/me` | 取得當前使用者 |

### 頁面管理（需登入）
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET  | `/api/v1/pages` | 取得頁面列表 |
| GET  | `/api/v1/pages/{slug}` | 取得頁面內容 |
| POST | `/api/v1/pages` | 新增頁面 |
| PUT  | `/api/v1/pages/{slug}` | 更新頁面 |
| DELETE | `/api/v1/pages/{slug}` | 刪除頁面 |
| GET  | `/api/v1/page-tree` | 取得頁面樹狀結構 |

### 區塊與內容
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/v1/pages/{slug}/sections` | 新增區塊 |
| PUT  | `/api/v1/sections/{id}` | 更新區塊 |
| DELETE | `/api/v1/sections/{id}` | 刪除區塊 |

### Framer 前台專用（不需登入）
```
GET /api/v1/content/{slug}/{section_key}?locale=zh-TW
```

**範例**：
```javascript
const data = await fetch('/api/v1/content/home/hero?locale=zh-TW').then(r => r.json());
console.log(data.fields.title);
```

---

## 資料模型

```
Page（頁面）
  ├── Section（區塊）× N
  │     └── ContentField（欄位）× N × 語系 (zh-TW, en-US)
  └── children（子頁面，支援遞迴）
```

- **Page**：頁面（首頁、校友分享等），支援無限層級
- **Section**：頁面內的區塊（Hero、介紹文字等）
- **ContentField**：區塊內的文字欄位，每個欄位有中英文兩份

---

## 環境切換

本專案支援 **兩種環境**：

| 項目 | 本機開發 | 遠端正式 |
|------|--------|---------|
| 資料庫 | SQLite | PostgreSQL |
| 本機狀態 | ⚠️ **必須開著** | ✨ **可以關機** |
| 24/7 運行 | ❌ | ✅ |
| 適用場景 | 開發/測試 | 上線/運營 |

### 切換到本機開發（SQLite）

修改 `.env`：
```env
DATABASE_URL=sqlite:///./admin.db
```

重啟 Uvicorn：
```bash
uvicorn main:app --reload --port 8000
```

### 切換到遠端環境（Render + Supabase）

1. **取得 Supabase 連接字串**
   - 登入 [supabase.com/dashboard](https://supabase.com/dashboard)
   - 進入專案 → Settings → Database
   - 複製 Connection string (URI)

2. **修改 `.env`**
   ```env
   DATABASE_URL=postgresql://user:password@host.supabase.co:5432/postgres
   ```

3. **重啟 Uvicorn**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

完成後，本機可隨時關機，網站在 Render 上 24/7 運行。

### ⚠️ Render 免費方案

- 15 分鐘無流量 → 自動休眠
- 重新喚醒需 ~30 秒
- 免費方案限 750 小時/月

升級或改用其他平台：
- [Railway](https://railway.app)：$5 免費額度
- [fly.io](https://fly.io)：免費實例

---

## 部署指南

### 後端部署到 Render

已部署到 Render，無需重新部署（除非代碼大改）。

### 前端部署到 GitHub Pages

```bash
# 需在 Git Bash 中執行
sh deploy.sh
```

部署後訪問：https://lucy0299.github.io/NCU---Aalto_web/

---

## Git 協作流程

團隊成員：Lucy（前台） + Rong（後台）

### 基本流程

```
1. 切回自己分支並拉取最新 main
   git checkout <your-branch>
   git pull origin main

2. 修改 → 提交 → 推上
   git add <files>
   git commit -m "說明"
   git push origin <your-branch>

3. 合併回 main
   git checkout main
   git pull origin main
   git merge <your-branch>
   git push origin main

4. 回到自己分支並拉取最新
   git checkout <your-branch>
   git pull origin main
```

### 注意事項
- 每次開始前都要 `git pull origin main`
- 合併前讓對方知道，避免同時合併
- 有衝突先解決再提交

---

## 常見問題

### 啟動後無法連接 API

1. 虛擬環境是否啟動（看 `(venv)` 提示）
2. Uvicorn 是否在跑
3. 防火牆是否阻止 8000 連接埠
4. `API_BASE` 網址是否正確

### 跑 seed.py 失敗

1. 是否在 `backend` 目錄下
2. `.env` 是否存在且有 `DATABASE_URL`
3. 是否有 `admin.db` 的寫入權限

### 怎麼在本機和遠端環境間切換？

只需修改 `.env` 的 `DATABASE_URL` 並重啟 Uvicorn，詳見 [環境切換](#環境切換)。

### Framer 元件無法讀取資料

1. 後端 Uvicorn 是否還在執行
2. Dev Tunnel 是否還連著（URL 會過期）
3. 圖片 URL 是否包含完整域名

---

## 故障排除

### 生產環境 API 無法訪問

```bash
# 檢查 Render 服務
curl https://your-render-app.onrender.com/docs

# 查看 Render Logs
# 進入 Render Dashboard → 對應的 Web Service → Logs
```

### 資料庫連接失敗

**Supabase 連接失敗**：
- 確認連接字串是否正確（含密碼和埠口 5432）
- 檢查網路連線
- 驗證 Supabase 專案是否還在運行

**本機 SQLite 無法寫入**：
- 檢查磁碟空間
- 確認 `admin.db` 檔案權限
- 嘗試刪除後重新 `python seed.py`

### 編輯器無法保存

1. 檢查瀏覽器開發者工具 Network tab
2. 確認後端 Uvicorn 仍在執行
3. 查看 `.env` 中的 `API_BASE` 是否正確

---

## 開發者

| 名字 | 聯絡方式 |
|------|---------|
| Lucy | [@LUCY0299](https://github.com/LUCY0299) |
| Rong | [lizrong1017@gmail.com](mailto:lizrong1017@gmail.com) |

### 說明

兩位都參與全棧開發，包括系統架構、API、前台設計、後台介面、資料庫設計、內容管理與測試。

### 貢獻指南

1. 不要直接在 `main` 修改
2. 創建自己的子分支
3. 提交前確保本機功能正常
4. 合併前同步最新 `main`

---

## 注意事項

### 安全性

- `.env` 不可上傳 Git（已加入 `.gitignore`）
- 正式上線前務必修改預設密碼
- `main.py` 中改 CORS：`allow_origins` 改為實際網域

### 資料管理

- `admin.db` 是本機資料庫，不要上傳 Git
- 本機資料和遠端資料各自獨立（不會同步）
- 要同步資料需手動匯出/匯入

### Framer 相關

- Framer Code Components 存在雲端專案中（本機 Git 找不到）
- 編輯時確保 `BASE_URL` 指向正確後端
- 發佈前在真實網址測試（編輯器預覽不支援網址參數）

---

## 授權

MIT License © 2025 NCU × Aalto EMBA Program
