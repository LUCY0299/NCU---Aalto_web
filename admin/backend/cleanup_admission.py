#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import Section

db = SessionLocal()

try:
    # 刪除舊的 admission 相關區塊
    old_blocks = [
        "admission-info",
        "admission-requirements"
    ]

    for block_key in old_blocks:
        section = db.query(Section).filter(
            Section.section_key == block_key
        ).first()

        if section:
            print(f"🗑️  刪除舊區塊：{section.section_key} ({section.name})")
            db.delete(section)
            db.commit()
            print(f"✅ 已刪除")
        else:
            print(f"✅ 未找到：{block_key}")

    print("\n🎉 舊區塊已清理完畢")

except Exception as e:
    print(f"❌ 錯誤：{e}")
    db.rollback()
    raise
finally:
    db.close()
