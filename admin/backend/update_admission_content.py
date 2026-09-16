#!/usr/bin/env python3
import sys
import json
sys.path.insert(0, '.')

from database import SessionLocal
from models import Section, ContentField

db = SessionLocal()

try:
    # 找到 admission-info-and-requirements 區塊
    section = db.query(Section).filter(
        Section.section_key == "admission-info-and-requirements"
    ).first()

    if not section:
        print("❌ 找不到 admission-info-and-requirements 區塊")
        sys.exit(1)

    print(f"✅ 找到區塊：{section.name}")

    # 更新 info_items（招生資訊）
    info_zh_data = [{"title": "招生資訊", "content": "本學程由國立中央大學與芬蘭阿爾托大學合作開辦，共計15門課程及一份個別論文專案，其中：\n\n(1) 9門課程由國立中央大學管理學院授課。\n(2) 6門課程由阿爾托大學行政教育機構授課。其中5門課程將由大學教授在台灣授課，另1門課程為國際課程。\n\n國立中央大學課程：\n• 應用經濟學\n• 商業研究方法\n• 管理會計實務\n• 數位營運與工業4.0實務\n• 清通\n• 人力資源管理實務\n• 永續商業與ESG\n• 金融與銀行\n• 商業應用數據科學\n\n阿爾托大學課程：\n• 個人與組織領導力\n• 創新管理\n• 社會創新與永續發展\n• 全球供應鏈管理\n• 策略管理\n• 行銷\n\n本校保留隨時變更課程內容、時程及授學方式的權利，如有疑問，請直接聯繫本校以確認最新資訊。", "image_url": "", "is_active": True}]

    info_en_data = [{"title": "Admission Information", "content": "The program is jointly developed by National Central University and Aalto University, comprising 15 courses and an individual thesis project.\n\n(1) 9 courses taught by NCU College of Management\n(2) 6 courses taught by Aalto University. 5 of these courses will be taught by Aalto faculty in Taiwan, and 1 course is an international program.\n\nNCU Courses:\n• Applied Economics\n• Business Research Methods\n• Management Accounting\n• Digital Operations & Industry 4.0\n• Communication\n• Human Resource Management\n• Sustainable Business & ESG\n• Finance & Banking\n• Business Data Science\n\nAalto Courses:\n• Personal & Organizational Leadership\n• Innovation Management\n• Social Innovation & Sustainable Development\n• Global Supply Chain Management\n• Strategic Management\n• Marketing\n\nNCU reserves the right to change course content, schedule, and delivery methods at any time.", "image_url": "", "is_active": True}]

    # 更新 requirements_items（入學門檻）
    req_zh_data = [{"title": "入學門檻", "content": "• 學士學位或同等資格\n• 至少5年相關領域的工作經驗，具有管理階層或資深專業職位背景\n• 個人面試\n• 完整的申請文件\n  - 履歷表（CV）\n  - 學位證書及成績單\n  - 4份論文\n• 2份推薦信", "image_url": "", "is_active": True}]

    req_en_data = [{"title": "Admission Requirements", "content": "• Bachelor's degree or equivalent qualification\n• At least 5 years of professional experience in a relevant field with management level or senior professional position background\n• Personal interview\n• Complete application documents\n  - Resume (CV)\n  - Degree certificate and transcripts\n  - 4 essays\n• 2 letters of recommendation", "image_url": "", "is_active": True}]

    # 更新各欄位
    for locale, info_value, req_value in [
        ("zh-TW", json.dumps(info_zh_data, ensure_ascii=False), json.dumps(req_zh_data, ensure_ascii=False)),
        ("en-US", json.dumps(info_en_data, ensure_ascii=False), json.dumps(req_en_data, ensure_ascii=False))
    ]:
        # 更新 info_items
        info_field = db.query(ContentField).filter(
            ContentField.section_id == section.id,
            ContentField.field_key == "info_items",
            ContentField.locale == locale
        ).first()

        if info_field:
            info_field.field_value = info_value
            print(f"  ✅ 已更新 info_items ({locale})")

        # 更新 requirements_items
        req_field = db.query(ContentField).filter(
            ContentField.section_id == section.id,
            ContentField.field_key == "requirements_items",
            ContentField.locale == locale
        ).first()

        if req_field:
            req_field.field_value = req_value
            print(f"  ✅ 已更新 requirements_items ({locale})")

    db.commit()
    print("\n🎉 招生資訊與入學門檻內容已更新！")

except Exception as e:
    print(f"❌ 錯誤：{e}")
    db.rollback()
    raise
finally:
    db.close()
