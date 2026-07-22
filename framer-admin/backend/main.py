"""
main.py — FastAPI 主程式（入口點）
=====================================
這是整個後端的起點。
它把所有的路由（auth、pages）組合起來，
設定 CORS（允許 Framer 前台跨域存取），
並在啟動時自動建立資料庫資料表。

啟動方式：
  cd backend
  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi import UploadFile, File, HTTPException
import shutil
import uuid
import httpx

# ─────────────────────────────────────────
# Supabase Storage 設定（圖片改存這裡，不再存 Render 本機硬碟）
# ─────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

# 匯入資料庫設定
from database import engine, Base

# 匯入所有資料模型（讓 SQLAlchemy 知道要建哪些資料表）
import models  # noqa: F401

# 匯入路由器
from routers import auth, pages
from routers.auth import verify_token
from models import User
from fastapi import Depends

# ─────────────────────────────────────────
# 建立 FastAPI 應用程式實例
# ─────────────────────────────────────────
app = FastAPI(
    title="NCU × Aalto EMBA 後台管理 API",
    description="""
    提供 NCU × Aalto EMBA 網站的後台管理功能。
    
    ## 功能
    - 🔐 JWT 登入驗證
    - 📋 頁面內容管理（新增/修改/刪除）
    - 🌐 多語系支援（zh-TW / en-US）
    - 📦 區塊與欄位管理
    
    ## 使用方式
    1. 先到 `/api/v1/auth/login` 取得 Token
    2. 點右上角「Authorize」輸入 Token
    3. 就能使用需要登入的 API 了
    """,
    version="1.0.0",
    docs_url="/docs",       # Swagger UI 路徑
    redoc_url="/redoc",     # ReDoc 路徑
)

# ─────────────────────────────────────────
# CORS 設定（非常重要！）
# 讓 Framer 前台可以跨域呼叫這個 API
# ─────────────────────────────────────────
# 允許的來源：
# - http://localhost:*   本機開發
# - https://*.framer.app Framer 預覽網址
# - https://*.framer.website Framer 發布網址
# 正式上線時，把 allow_origins 改成你的實際網址！
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5500",   # VS Code Live Server
    "http://localhost:5500",
    "https://*.framer.app",
    "https://*.framer.website",
    # 如果你有自訂網域，加在這裡：
    # "https://your-domain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 開發階段允許所有來源，上線前改為 ALLOWED_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],          # 允許所有 HTTP 方法（GET/POST/PUT/DELETE）
    allow_headers=["*"],          # 允許所有 Header（包含 Authorization）
)

# ─────────────────────────────────────────
# 啟動事件：自動建立資料庫資料表
# ─────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """
    伺服器啟動時自動執行：
    1. 根據 models.py 裡的定義，在資料庫建立對應的資料表（已存在不會重複建立）
    2. 執行 seed.py，補上管理員帳號與頁面初始資料（已存在的資料會自動跳過，不會覆蓋）

    這樣即使在 Render 免費方案（沒有 Shell 可以手動下指令）上，
    重新部署或資料庫被清空時，也能自動恢復基本資料。
    """
    Base.metadata.create_all(bind=engine)
    print("Database tables created (or already exist)")

    try:
        from seed import seed_database
        seed_database()
    except Exception as e:
        print(f"Seed 執行失敗（不影響伺服器啟動）：{e}")

    print("NCU x Aalto EMBA Backend API started!")
    print("API Docs: http://localhost:8000/docs")

# ─────────────────────────────────────────
# 掛載路由器
# ─────────────────────────────────────────
# 認證相關 API（/api/v1/auth/...）
app.include_router(auth.router)

# 頁面管理 API（/api/v1/pages/...、/api/v1/sections/... 等）
app.include_router(pages.router)

# ─────────────────────────────────────────
# 掛載後台靜態檔案（HTML/CSS/JS）
# ─────────────────────────────────────────
# 檢查 frontend 資料夾是否存在再掛載
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/admin", StaticFiles(directory=frontend_path, html=True), name="frontend")

# ─────────────────────────────────────────
# 根路徑：導向後台登入頁
# ─────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    """根路徑，重導向到後台登入頁"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/admin/index.html")

# ─────────────────────────────────────────
# 掛載上傳的圖片資料夾 (讓前端可以讀取圖片)
# ─────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─────────────────────────────────────────
# 圖片上傳 API 端點
# ─────────────────────────────────────────
@app.post("/api/v1/upload", tags=["上傳"])
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(verify_token),  # 需要登入
):
    """接收後台上傳的圖片，存到 Supabase Storage（永久保存），並回傳完整網址"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="尚未設定 SUPABASE_URL / SUPABASE_SERVICE_KEY 環境變數")

    # 幫圖片產生一個獨一無二的檔名 (UUID)，避免檔名重複導致覆蓋
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_bytes = await file.read()

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{unique_filename}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": file.content_type or "application/octet-stream",
            },
            content=file_bytes,
        )

    if res.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"上傳到 Supabase Storage 失敗：{res.text}")

    # 回傳完整的公開網址，讓資料庫和 Framer 直接使用
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{unique_filename}"
    return {"url": public_url}

# ─────────────────────────────────────────
# 健康檢查端點（部署平台用）
# ─────────────────────────────────────────
@app.get("/health", tags=["系統"])
async def health_check():
    """確認 API 是否正常運作（部署平台用）"""
    return {"status": "ok", "message": "NCU × Aalto EMBA 後台 API 運作正常"}
