"""
schemas.py — Pydantic 資料驗證模型
====================================
定義 API 的輸入（Request）與輸出（Response）資料格式。
FastAPI 會自動根據這些 Schema 做資料驗證，
也會用來產生 Swagger 文件（/docs）。

命名規則：
  XxxBase    = 共用欄位
  XxxCreate  = 新增時用（POST）
  XxxUpdate  = 更新時用（PUT）
  XxxOut     = API 回傳格式
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ════════════════════════════════════════
# 🔐 認證相關（Auth）
# ════════════════════════════════════════

class LoginRequest(BaseModel):
    """登入請求：使用者名稱 + 密碼"""
    username: str = Field(..., example="admin")
    password: str = Field(..., example="your_password")


class TokenResponse(BaseModel):
    """登入成功回傳的 JWT Token"""
    access_token: str
    token_type: str = "bearer"
    # Token 有效秒數（預設 86400 = 24小時）
    expires_in: int = 86400


class UserOut(BaseModel):
    """使用者資訊（不含密碼）"""
    id: int
    username: str
    email: Optional[str]
    is_admin: bool
    is_active: bool

    class Config:
        from_attributes = True  # 允許從 SQLAlchemy 物件轉換


# ════════════════════════════════════════
# 📝 ContentField（內容欄位）
# ════════════════════════════════════════

class ContentFieldBase(BaseModel):
    field_key: str = Field(..., example="title", description="欄位識別碼")
    field_value: Optional[str] = Field("", example="校友分享", description="欄位值")
    field_type: str = Field("text", example="text", description="text/textarea/image/richtext/json")
    locale: str = Field("zh-TW", example="zh-TW", description="語系代碼")
    label: Optional[str] = Field(None, example="頁面標題", description="後台顯示名稱")
    hint: Optional[str] = Field(None, example="顯示在頁面頂部的大標題", description="使用提示")


class ContentFieldCreate(ContentFieldBase):
    """新增欄位時的格式"""
    pass


class ContentFieldUpdate(BaseModel):
    """更新欄位時（只需傳要改的欄位，其他保持不變）"""
    field_value: Optional[str] = None
    label: Optional[str] = None
    hint: Optional[str] = None


class ContentFieldOut(ContentFieldBase):
    """回傳給前端的欄位格式"""
    id: int
    section_id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ════════════════════════════════════════
# 📦 Section（區塊）
# ════════════════════════════════════════

class SectionBase(BaseModel):
    section_key: str = Field(..., example="alumni-list", description="區塊識別碼")
    name: str = Field(..., example="校友分享列表", description="後台顯示名稱")
    section_type: str = Field("text", example="list", description="text/list/image/hero/card")
    display_order: int = Field(0, description="排序（數字越小越前面）")
    is_active: bool = Field(True, description="是否啟用")


class SectionCreate(SectionBase):
    """新增區塊時的格式"""
    pass


class SectionUpdate(BaseModel):
    """更新區塊（只需傳要改的欄位）"""
    name: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class SectionOut(SectionBase):
    """回傳格式（含該區塊所有欄位）"""
    id: int
    page_id: int
    content_fields: List[ContentFieldOut] = []
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ════════════════════════════════════════
# 📋 Page（頁面）
# ════════════════════════════════════════

class PageBase(BaseModel):
    slug: str = Field(..., example="home", description="頁面識別碼（URL用）")
    title: str = Field(..., example="首頁", description="頁面名稱（後台顯示用）")
    parent_slug: Optional[str] = Field(None, example="learning", description="父頁面slug")
    display_order: int = Field(0, description="排序")
    is_active: bool = Field(True, description="是否啟用")


class PageCreate(PageBase):
    """新增頁面"""
    pass


class PageUpdate(BaseModel):
    """更新頁面（只需傳要改的欄位）"""
    title: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class PageOut(PageBase):
    """回傳格式（含所有區塊與欄位）"""
    id: int
    sections: List[SectionOut] = []
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PageListItem(BaseModel):
    """頁面列表項目（不含詳細內容，用於列表頁）"""
    id: int
    slug: str
    title: str
    parent_slug: Optional[str]
    display_order: int
    is_active: bool
    section_count: int = 0  # 該頁面有幾個區塊

    class Config:
        from_attributes = True


# ════════════════════════════════════════
# 🌐 多語系批量更新
# ════════════════════════════════════════

class LocaleContentUpdate(BaseModel):
    """
    同時更新一個區塊的多個欄位（支援多語系）
    用法：前端一次送出整個區塊的所有欄位變更
    """
    locale: str = Field("zh-TW", description="語系")
    fields: dict = Field(..., example={
        "title": "校友分享",
        "subtitle": "聆聽真實聲音"
    }, description="欄位鍵值對")
