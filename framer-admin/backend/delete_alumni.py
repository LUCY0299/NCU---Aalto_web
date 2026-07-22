import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Section, ContentField

def delete_old_alumni_data():
    db = SessionLocal()
    try:
        print("🗑️ 開始徹底刪除舊的校友分享區塊與資料...")

        # 鎖定要刪除的兩個區塊
        sections_to_delete = db.query(Section).filter(
            Section.section_key.in_(["alumni_sharing", "alumni_header"])
        ).all()

        if not sections_to_delete:
            print("找不到任何校友分享區塊，可能已經刪除乾淨了！")
        else:
            for sec in sections_to_delete:
                # 1. 先把該區塊底下的所有「欄位資料」清空
                deleted_fields = db.query(ContentField).filter(
                    ContentField.section_id == sec.id
                ).delete(synchronize_session=False)
                print(f" ➔ 已清除 [{sec.name}] 的 {deleted_fields} 筆欄位資料")
                
                # 2. 再把「區塊本身」刪掉
                db.delete(sec)
                print(f" ➔ 已刪除區塊本身：{sec.name}")

            # 提交變更到資料庫
            db.commit()
            print("\n✅ 舊資料已徹底清除乾淨！")
            
    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_old_alumni_data()