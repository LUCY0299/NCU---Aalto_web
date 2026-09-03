import os
from dotenv import load_dotenv
import psycopg2

load_dotenv("c:/Users/peng1/Desktop/Lucy/project/NCU × Aalto_web/framer-admin/backend/.env")
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

try:
    # 1. 找到 layout 頁面 ID
    cursor.execute("SELECT id FROM pages WHERE slug = 'layout'")
    page_row = cursor.fetchone()
    if not page_row:
        print("ERROR: Cannot find layout page!")
        exit(1)
    page_id = page_row[0]

    # 2. 建立 cta_section 區塊
    cursor.execute("""
        SELECT id FROM sections 
        WHERE page_id = %s AND section_key = 'cta_section'
    """, (page_id,))
    section_row = cursor.fetchone()
    
    if not section_row:
        cursor.execute("""
            INSERT INTO sections (page_id, section_key, name, section_type, display_order, is_active)
            VALUES (%s, 'cta_section', '全站 CTA 區塊 (CTA Section)', 'cta', 4, true)
            RETURNING id
        """, (page_id,))
        section_id = cursor.fetchone()[0]
        print(f"SUCCESS: Created cta_section, ID: {section_id}")
    else:
        section_id = section_row[0]
        print(f"SKIP: cta_section already exists, ID: {section_id}")

    # 3. 定義欄位資料
    fields = [
        {
            "key": "title",
            "label": "標題文字 (Title)",
            "type": "text",
            "zh": "跟著我們，一起解鎖北歐\n創新管理新思維！",
            "en": "Join us and unlock new perspectives on Nordic innovation management!"
        },
        {
            "key": "button_text",
            "label": "按鈕文字 (Button Text)",
            "type": "text",
            "zh": "聯絡我們",
            "en": "Contact Us"
        },
        {
            "key": "button_link",
            "label": "自訂跳轉連結 (Button Link)",
            "type": "text",
            "zh": "/contact",
            "en": "/en/contact"
        },
        {
            "key": "left_image",
            "label": "左側圖片 (Left Image)",
            "type": "image",
            "zh": "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-aalto/9a41fe87-23a8-448c-bc67-e4ed7203e7cf.jpg",
            "en": "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-aalto/9a41fe87-23a8-448c-bc67-e4ed7203e7cf.jpg"
        },
        {
            "key": "right_image",
            "label": "右側圖片 (Right Image)",
            "type": "image",
            "zh": "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/7b6f1d3b-bf99-4ba3-ab27-512c0a9693be.jpg",
            "en": "https://gumjociqcucdzfrrtxnt.supabase.co/storage/v1/object/public/uploads/about-ncu/7b6f1d3b-bf99-4ba3-ab27-512c0a9693be.jpg"
        }
    ]

    # 4. 插入或更新欄位
    for field_data in fields:
        for locale, val in [("zh-TW", field_data["zh"]), ("en-US", field_data["en"])]:
            cursor.execute("""
                SELECT id FROM content_fields 
                WHERE section_id = %s AND field_key = %s AND locale = %s
            """, (section_id, field_data["key"], locale))
            f_row = cursor.fetchone()
            
            if not f_row:
                cursor.execute("""
                    INSERT INTO content_fields (section_id, field_key, field_value, field_type, locale, label)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (section_id, field_data["key"], val, field_data["type"], locale, field_data["label"]))
                print(f"  Inserted field {field_data['key']} ({locale})")
            else:
                # 已經有了就更新 label 確保一致
                cursor.execute("""
                    UPDATE content_fields 
                    SET label = %s 
                    WHERE id = %s
                """, (field_data["label"], f_row[0]))
                print(f"  Skipped field {field_data['key']} ({locale}) - updated label")

    conn.commit()
    print("SUCCESS: Supabase database updated successfully!")
except Exception as e:
    conn.rollback()
    print(f"ERROR: Update failed: {e}")
finally:
    conn.close()
