"""
models.py — SQLAlchemy 資料模型（資料表定義）
=============================================
定義三層架構：
  Page（頁面）→ Section（區塊）→ ContentField（欄位內容）

每個 ContentField 都有 locale 欄位，支援多語系。
User 資料表用於後台登入驗證。
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ──────────────────────────────────────────────────────────
# 📋 Page（頁面表）
# 代表整個網站的一個頁面，例如：首頁、關於我們等
# ──────────────────────────────────────────────────────────
class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)

    # 頁面識別碼（URL slug），例如："home", "alumni", "admission"
    slug = Column(String(100), unique=True, nullable=False, index=True)

    # 頁面名稱（用於後台顯示），例如："首頁", "校友分享"
    title = Column(String(200), nullable=False)

    # 父頁面 slug（用於建立頁面階層關係），例如：alumni 的 parent 是 "learning"
    parent_slug = Column(String(100), nullable=True)

    # 頁面排序（數字越小越前面）
    display_order = Column(Integer, default=0)

    # 是否啟用（對應架構圖中的「可用」）
    is_active = Column(Boolean, default=True)

    # 建立/更新時間（自動記錄）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯：一個 Page 有多個 Section
    sections = relationship("Section", back_populates="page", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────
# 📦 Section（區塊表）
# 代表一個頁面內的某個區塊，例如：Hero 區、校友分享區
# ──────────────────────────────────────────────────────────
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)

    # 外鍵：屬於哪個頁面
    page_id = Column(Integer, ForeignKey("pages.id"), nullable=False)

    # 區塊識別碼（唯一鍵），例如："hero", "alumni-list", "contact-form"
    section_key = Column(String(100), nullable=False)

    # 區塊顯示名稱（後台用），例如："頂部橫幅", "校友分享列表"
    name = Column(String(200), nullable=False)

    # 區塊類型（用來決定後台要顯示什麼編輯介面）
    # 例如："text", "list", "image", "hero", "card"
    section_type = Column(String(50), default="text")

    # 排序
    display_order = Column(Integer, default=0)

    # 是否啟用
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    page = relationship("Page", back_populates="sections")
    content_fields = relationship("ContentField", back_populates="section", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────
# 📝 ContentField（內容欄位表）
# 每個 Section 的具體內容，例如：標題、副標題、圖片URL、描述文字
# 每個欄位都有 locale，支援多語系
# ──────────────────────────────────────────────────────────
class ContentField(Base):
    __tablename__ = "content_fields"

    id = Column(Integer, primary_key=True, index=True)

    # 外鍵：屬於哪個區塊
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)

    # 欄位識別碼，例如："title", "subtitle", "image_url", "body_text"
    field_key = Column(String(100), nullable=False)

    # 欄位值（文字內容，圖片存 URL，複雜資料存 JSON 字串）
    field_value = Column(Text, nullable=True, default="")

    # 欄位類型（影響後台顯示的輸入元件）
    # "text" = 單行文字, "textarea" = 多行, "image" = 圖片URL
    # "richtext" = 富文字, "json" = JSON陣列（如校友列表）
    field_type = Column(String(50), default="text")

    # 語系："zh-TW" 或 "en-US"
    locale = Column(String(10), nullable=False, default="zh-TW")

    # 欄位顯示名稱（後台用），例如："頁面標題", "副標題"
    label = Column(String(200), nullable=True)

    # 欄位說明（後台用工具提示）
    hint = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 關聯
    section = relationship("Section", back_populates="content_fields")


# ──────────────────────────────────────────────────────────
# 👤 User（後台使用者表）
# 用於後台登入驗證，支援多使用者協作
# ──────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # 使用者名稱（登入用）
    username = Column(String(100), unique=True, nullable=False, index=True)

    # Email（顯示用）
    email = Column(String(200), unique=True, nullable=True)

    # 雜湊後的密碼（永遠不儲存明文密碼！）
    hashed_password = Column(String(255), nullable=False)

    # 是否為管理員（admin 可以管理使用者）
    is_admin = Column(Boolean, default=False)

    # 是否啟用帳號
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
