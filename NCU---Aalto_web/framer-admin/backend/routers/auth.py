"""
routers/auth.py — JWT 登入驗證 API
=====================================
提供登入、取得使用者資訊等功能。

JWT（JSON Web Token）運作流程：
  1. 使用者 POST /login，帶帳號密碼
  2. 後端驗證密碼（bcrypt 雜湊比對）
  3. 驗證成功 → 產生 JWT Token（有效24小時）
  4. 前端收到 Token，儲存在 localStorage
  5. 之後每次 API 請求都帶 Authorization: Bearer <token>
  6. 後端 verify_token() 驗證 Token 有效性
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import LoginRequest, TokenResponse, UserOut

# ─────────────────────────────────────────
# 設定常數（實際部署請改為環境變數！）
# ─────────────────────────────────────────

# JWT 簽名密鑰：請改成一個隨機的長字串
# 產生方式：在終端執行 python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY = os.getenv("SECRET_KEY", "請在.env裡設定一個隨機密鑰不要用這個預設值")

# JWT 演算法（HS256 是最常見的對稱加密）
ALGORITHM = "HS256"

# Token 有效時間（小時）
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))

# ─────────────────────────────────────────
# 工具初始化
# ─────────────────────────────────────────

# bcrypt 密碼雜湊工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme（FastAPI 依賴注入用）
# tokenUrl 是前端發送登入請求的路徑
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# 建立路由器
router = APIRouter(prefix="/api/v1/auth", tags=["認證"])


# ─────────────────────────────────────────
# 工具函數
# ─────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """
    將明文密碼轉換成 bcrypt 雜湊值。
    每次雜湊結果不同（因為有隨機 salt），但比對時可以驗證。
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證明文密碼與雜湊值是否相符。
    bcrypt 自動處理 salt，直接比對即可。
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    產生 JWT Token。
    data 通常包含 {"sub": username}（sub = subject）。
    expires_delta 設定 Token 有效時間。
    """
    to_encode = data.copy()

    # 計算到期時間
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})

    # 用 SECRET_KEY 簽名產生 JWT
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """從資料庫查詢使用者"""
    return db.query(User).filter(User.username == username, User.is_active == True).first()


def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    FastAPI 依賴注入函數：驗證 JWT Token。
    在需要登入才能存取的 API 上加 current_user: User = Depends(verify_token)
    如果 Token 無效或過期，回傳 401 錯誤。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token 無效或已過期，請重新登入",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 解碼 JWT Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")

        if username is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # 驗證使用者是否存在
    user = get_user_by_username(db, username)
    if user is None:
        raise credentials_exception

    return user


# ─────────────────────────────────────────
# API 路由
# ─────────────────────────────────────────

@router.post("/login", response_model=TokenResponse, summary="後台登入")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    使用帳號密碼登入，成功後回傳 JWT Token。

    **前端使用方式：**
    ```javascript
    const formData = new FormData();
    formData.append('username', 'admin');
    formData.append('password', 'your_password');

    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      body: formData
    });
    const { access_token } = await response.json();
    localStorage.setItem('token', access_token);
    ```
    """
    # 查詢使用者
    user = get_user_by_username(db, form_data.username)

    # 驗證使用者存在且密碼正確（故意不說是哪個錯，防止帳號探測）
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 產生 JWT Token
    token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600
    )


@router.get("/me", response_model=UserOut, summary="取得目前登入的使用者資訊")
async def get_current_user(current_user: User = Depends(verify_token)):
    """
    回傳目前登入的使用者資訊（不含密碼）。
    前端可用來確認 Token 是否有效，或顯示使用者名稱。
    """
    return current_user


@router.post("/logout", summary="登出")
async def logout():
    """
    JWT 是無狀態的，後端無法主動使 Token 失效。
    登出的正確做法是前端刪除 localStorage 裡的 Token。
    此端點僅回傳成功訊息（供前端確認）。
    """
    return {"message": "請刪除本地端儲存的 Token 完成登出"}
