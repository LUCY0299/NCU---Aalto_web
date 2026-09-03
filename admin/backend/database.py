"""
database.py — 資料庫連線設定
=============================
使用 SQLAlchemy 2.0 建立 SQLite 資料庫連線。
開發階段使用 SQLite（不需安裝任何軟體），
未來升級到 PostgreSQL 只需改 DATABASE_URL 這一行。
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 載入 .env 環境變數（如果存在）
load_dotenv()

# ─────────────────────────────────────────
# 資料庫連線字串
# 開發：SQLite 檔案（自動在 backend/ 目錄建立 admin.db）
# 生產：改成 "postgresql://user:password@host/dbname"
# ─────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./admin.db")

# 建立資料庫引擎
# check_same_thread=False 是 SQLite 特有設定，允許多執行緒存取
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# SessionLocal：每個 API 請求都會建立一個獨立的 Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base：所有 SQLAlchemy 資料模型都要繼承這個 Base
Base = declarative_base()


def get_db():
    """
    FastAPI 依賴注入函數。
    每個 API 請求開始時建立 DB Session，
    請求結束後自動關閉，避免連線洩漏。
    用法：在 router 函數裡加 db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
