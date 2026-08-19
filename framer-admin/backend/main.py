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
from fastapi import UploadFile, File, Form, HTTPException
import shutil
import uuid
import httpx

# ─────────────────────────────────────────
# Supabase Storage 設定（圖片改存這裡，不再存 Render 本機硬碟）
# ─────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

# ─────────────────────────────────────────
# Framer API 設定（動態更新網站圖片）
# ─────────────────────────────────────────
FRAMER_API_KEY = os.getenv("FRAMER_API_KEY", "")
FRAMER_SITE_ID = os.getenv("FRAMER_SITE_ID", "")

# 匯入資料庫設定
from database import engine, Base

# 匯入所有資料模型（讓 SQLAlchemy 知道要建哪些資料表）
import models  # noqa: F401

# 匯入路由器
from routers import auth, pages
from routers.auth import verify_token
from models import User, Section, ContentField
from fastapi import Depends
from database import get_db
from sqlalchemy.orm import Session

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
    page_slug: str = Form("misc"),  # 依照目前編輯的頁面自動分類到對應資料夾
    current_user: User = Depends(verify_token),  # 需要登入
):
    """接收後台上傳的圖片，存到 Supabase Storage（永久保存），依頁面分資料夾，並回傳完整網址"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="尚未設定 SUPABASE_URL / SUPABASE_SERVICE_KEY 環境變數")

    # 幫圖片產生一個獨一無二的檔名 (UUID)，避免檔名重複導致覆蓋
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    storage_path = f"{page_slug}/{unique_filename}"
    file_bytes = await file.read()

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{storage_path}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": file.content_type or "application/octet-stream",
            },
            content=file_bytes,
        )

    if res.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"上傳到 Supabase Storage 失敗：{res.text}")

    # 回傳完整的公開網址，讓資料庫和 Framer 直接使用
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{storage_path}"
    return {"url": public_url}

# ─────────────────────────────────────────
# 翻譯 API（用 MyMemory，免費、不需金鑰）
# ─────────────────────────────────────────
MYMEMORY_URL = "https://api.mymemory.translated.net/get"
MYMEMORY_CHUNK_SIZE = 450  # MyMemory 單次請求長度限制，超過要切段分別翻譯
# 帶上這組 Email 讓 MyMemory 把每日免費額度從 5000 字提升到 50000 字（不需註冊，純粹是它們的規則）
MYMEMORY_CONTACT_EMAIL = os.getenv("MYMEMORY_CONTACT_EMAIL", "")


def _split_text_for_translation(text: str) -> list[str]:
    """把長文字依照換行、句號切成不超過 MYMEMORY_CHUNK_SIZE 的段落，避免超過 MyMemory 單次請求上限"""
    if len(text) <= MYMEMORY_CHUNK_SIZE:
        return [text]

    chunks = []
    current = ""
    for line in text.split("\n"):
        candidate = f"{current}\n{line}" if current else line
        if len(candidate) > MYMEMORY_CHUNK_SIZE:
            if current:
                chunks.append(current)
            current = line
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks


# ⚠️ MyMemory API 翻譯功能已停用
# 原因：Render 共享 IP，導致免費額度快速用盡（50,000 字/天被數千個網站瓜分）
# 未來改用 Google Cloud Translation 或其他付費方案

# @app.post("/api/v1/translate", tags=["翻譯"])
# async def translate_text(
#     payload: dict,
#     current_user: User = Depends(verify_token),
# ):
#     """把中文文字翻譯成英文（用 MyMemory 免費 API），需要登入"""
#     text = (payload.get("text") or "").strip()
#     if not text:
#         return {"translated": ""}
#
#     chunks = _split_text_for_translation(text)
#     translated_chunks = []
#
#     async with httpx.AsyncClient(timeout=15) as client:
#         for chunk in chunks:
#             try:
#                 params = {"q": chunk, "langpair": "zh-TW|en-US"}
#                 if MYMEMORY_CONTACT_EMAIL:
#                     params["de"] = MYMEMORY_CONTACT_EMAIL
#                 res = await client.get(MYMEMORY_URL, params=params)
#                 data = res.json()
#                 translated = data.get("responseData", {}).get("translatedText", "")
#
#                 if not translated or "MYMEMORY WARNING" in translated.upper():
#                     raise HTTPException(
#                         status_code=429,
#                         detail="翻譯服務額度已達上限（MyMemory 免費配額已用盡）。請稍後重試，或手動輸入英文內容。"
#                     )
#                 else:
#                     translated_chunks.append(translated)
#             except HTTPException:
#                 raise
#             except Exception as e:
#                 raise HTTPException(
#                     status_code=503,
#                     detail=f"翻譯服務暫時無法使用，請稍後重試。錯誤：{str(e)[:100]}"
#                 )
#
#     return {"translated": "\n".join(translated_chunks)}

# ─────────────────────────────────────────
# Logo 管理 API（更新 branding section）
# ─────────────────────────────────────────
@app.post("/api/v1/update-logo", tags=["Logo 管理"])
async def update_logo(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token),
):
    """
    更新網站 Logo（admin_logo、navbar_logo、favicon）

    請求格式：
    {
        "logo_type": "admin_logo" | "navbar_logo" | "favicon",
        "logo_url": "https://...",
        "locale": "zh-TW"  # 可選，預設 zh-TW
    }
    """
    logo_type = payload.get("logo_type", "").strip()
    logo_url = payload.get("logo_url", "").strip()
    locale = payload.get("locale", "zh-TW")

    # 驗證參數
    if logo_type not in ("admin_logo", "navbar_logo", "favicon"):
        raise HTTPException(
            status_code=400,
            detail="logo_type 必須是 'admin_logo'、'navbar_logo' 或 'favicon'"
        )

    if not logo_url:
        raise HTTPException(status_code=400, detail="logo_url 不能為空")

    # 取得 layout page 中的 branding section
    from sqlalchemy.orm import Session as SessionType
    db_session: SessionType = db

    branding_section = db_session.query(Section).filter(
        Section.section_key == "branding",
        Section.page.has(slug="layout")
    ).first()

    if not branding_section:
        raise HTTPException(status_code=404, detail="找不到 branding section")

    # 找或建立對應的 ContentField
    content_field = db_session.query(ContentField).filter(
        ContentField.section_id == branding_section.id,
        ContentField.field_key == logo_type,
        ContentField.locale == locale
    ).first()

    if content_field:
        content_field.field_value = logo_url
    else:
        content_field = ContentField(
            section_id=branding_section.id,
            field_key=logo_type,
            field_value=logo_url,
            field_type="image",
            locale=locale,
            label=f"{logo_type} ({locale})"
        )
        db_session.add(content_field)

    db_session.commit()
    db_session.refresh(content_field)

    # 如果是更新 favicon，同時呼叫 Framer API
    if logo_type == "favicon":
        try:
            if not FRAMER_API_KEY or not FRAMER_SITE_ID:
                # 如果沒有設定 Framer API，仍然返回成功（只更新數據庫）
                return {
                    "status": "success",
                    "message": f"成功更新 {logo_type}（尚未設定 Framer API）",
                    "logo_type": logo_type,
                    "logo_url": logo_url
                }

            headers = {
                "Authorization": f"Bearer {FRAMER_API_KEY}",
                "Content-Type": "application/json"
            }

            framer_payload = {
                "siteImage": {
                    "favicon": logo_url
                }
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.patch(
                    f"https://api.framer.com/v1/sites/{FRAMER_SITE_ID}",
                    json=framer_payload,
                    headers=headers,
                )

            if response.status_code == 200:
                return {
                    "status": "success",
                    "message": f"成功更新 {logo_type} 並同步到 Framer",
                    "logo_type": logo_type,
                    "logo_url": logo_url,
                    "framer_synced": True
                }
            else:
                # Framer API 失敗，但數據庫已更新
                return {
                    "status": "partial_success",
                    "message": f"成功更新 {logo_type}，但 Framer 同步失敗",
                    "logo_type": logo_type,
                    "logo_url": logo_url,
                    "framer_error": response.text[:200]
                }
        except Exception as e:
            # Framer API 異常，但數據庫已更新
            return {
                "status": "partial_success",
                "message": f"成功更新 {logo_type}，但無法連接 Framer API",
                "logo_type": logo_type,
                "logo_url": logo_url,
                "error": str(e)[:100]
            }

    return {
        "status": "success",
        "message": f"成功更新 {logo_type}",
        "logo_type": logo_type,
        "logo_url": logo_url
    }


# ─────────────────────────────────────────
# Framer 網站圖片更新 API（保留向後相容）
# ─────────────────────────────────────────
@app.post("/api/v1/update-framer-image", tags=["Framer"])
async def update_framer_image(
    payload: dict,
    current_user: User = Depends(verify_token),
):
    """
    動態更新 Framer 網站的 Favicon 或 Social Preview 圖片

    需要登入，支援 SEO 和社交分享

    請求格式：
    {
        "image_type": "favicon" 或 "socialPreview",
        "image_url": "https://supabase-url.com/images/xxxxx.png"
    }
    """
    if not FRAMER_API_KEY or not FRAMER_SITE_ID:
        raise HTTPException(
            status_code=500,
            detail="尚未設定 FRAMER_API_KEY / FRAMER_SITE_ID 環境變數"
        )

    image_type = payload.get("image_type", "").strip()
    image_url = payload.get("image_url", "").strip()

    if not image_type or image_type not in ("favicon", "socialPreview"):
        raise HTTPException(
            status_code=400,
            detail="image_type 必須是 'favicon' 或 'socialPreview'"
        )

    if not image_url:
        raise HTTPException(status_code=400, detail="image_url 不能為空")

    headers = {
        "Authorization": f"Bearer {FRAMER_API_KEY}",
        "Content-Type": "application/json"
    }

    update_payload = {
        "siteImage": {
            image_type: image_url
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.patch(
                f"https://api.framer.com/v1/sites/{FRAMER_SITE_ID}",
                json=update_payload,
                headers=headers,
            )

        if response.status_code == 200:
            return {
                "status": "success",
                "message": f"成功更新 {image_type}",
                "image_type": image_type,
                "image_url": image_url
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Framer API 回應錯誤：{response.text[:200]}"
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Framer API 請求超時")
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"無法連接到 Framer API：{str(e)[:100]}"
        )

# ─────────────────────────────────────────
# 健康檢查端點（部署平台用）
# ─────────────────────────────────────────
@app.get("/health", tags=["系統"])
async def health_check():
    """確認 API 是否正常運作（部署平台用）"""
    return {"status": "ok", "message": "NCU × Aalto EMBA 後台 API 運作正常"}
