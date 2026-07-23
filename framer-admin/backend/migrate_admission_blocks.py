"""
migrate_admission_blocks.py — 一次性資料搬遷腳本
=====================================================
把「招生資訊 (admission-info)」「入學門檻 (admission-requirements)」
原本分開的 heading / content / image_url / image_url_2 欄位，
合併轉換成新的 blocks（自由區塊）格式，並刪除舊欄位。

⚠️ 這是一次性腳本，執行過一次、確認後台顯示正常後就可以刪除這個檔案。
⚠️ 執行前請先確認 .env 或環境變數的 DATABASE_URL 指向你要處理的資料庫
   （本機測試用 SQLite，還是正式的 Supabase）。

執行方式：
  cd backend
  python migrate_admission_blocks.py
"""

import sys
import os
import json
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Page, Section, ContentField

# 每個區塊的舊欄位要依照什麼順序組成 blocks 陣列
SECTIONS_TO_MIGRATE = [
    {
        "page_slug": "admission",
        "section_key": "admission-info",
        "old_field_order": ["image_url", "image_url_2", "heading", "content"],
    },
    {
        "page_slug": "admission",
        "section_key": "admission-requirements",
        "old_field_order": ["image_url", "heading", "content"],
    },
]


def migrate():
    db = SessionLocal()
    try:
        for cfg in SECTIONS_TO_MIGRATE:
            page = db.query(Page).filter(Page.slug == cfg["page_slug"]).first()
            if not page:
                print(f"⚠️  找不到頁面 {cfg['page_slug']}，跳過")
                continue

            section = db.query(Section).filter(
                Section.page_id == page.id,
                Section.section_key == cfg["section_key"],
            ).first()
            if not section:
                print(f"⚠️  找不到區塊 {cfg['section_key']}，跳過")
                continue

            for locale in ["zh-TW", "en-US"]:
                old_fields = {
                    f.field_key: f
                    for f in db.query(ContentField).filter(
                        ContentField.section_id == section.id,
                        ContentField.locale == locale,
                    ).all()
                }

                # 已經搬過就不要重複搬（blocks 欄位已存在且不是空的）
                existing_blocks_field = old_fields.get("blocks")
                if existing_blocks_field and existing_blocks_field.field_value not in (None, "", "[]"):
                    print(f"⏭️  {cfg['section_key']} ({locale}) 已經有 blocks 資料，跳過")
                    continue

                blocks = []
                for key in cfg["old_field_order"]:
                    field = old_fields.get(key)
                    if not field or not field.field_value:
                        continue
                    if key.startswith("image_url"):
                        blocks.append({"type": "image", "image_url": field.field_value})
                    else:
                        blocks.append({"type": "text", "text": field.field_value})

                # 寫入（或更新）blocks 欄位
                if existing_blocks_field:
                    existing_blocks_field.field_value = json.dumps(blocks, ensure_ascii=False)
                else:
                    db.add(ContentField(
                        section_id=section.id,
                        field_key="blocks",
                        field_value=json.dumps(blocks, ensure_ascii=False),
                        field_type="blocks",
                        locale=locale,
                        label="內容區塊（可自由新增/刪除/排序文字、圖片）",
                    ))

                # 刪除舊欄位（title 保留，不動）
                for key in cfg["old_field_order"]:
                    field = old_fields.get(key)
                    if field:
                        db.delete(field)

                db.commit()
                print(f"✅ {cfg['section_key']} ({locale})：搬遷完成，共 {len(blocks)} 個區塊")

        print("\n🎉 搬遷完成！")
    except Exception as e:
        print(f"❌ 發生錯誤：{e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
