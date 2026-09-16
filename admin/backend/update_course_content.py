#!/usr/bin/env python3
"""
更新課程卡片的完整內容 (content 字段)
"""
import json
import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import Section, ContentField

db = SessionLocal()

try:
    section = db.query(Section).filter(
        Section.section_key == "admission-info-and-requirements"
    ).first()

    if not section:
        print("❌ 找不到 admission-info-and-requirements section")
        sys.exit(1)

    # 中文內容
    zh_content_intro = """<p>本學程由國立中央大學與芬蘭阿爾托大學合作開辦，共計15門課程及一份個別論文專案，其中：</p>
<p style="margin-bottom: 0.3em;">(1) 9門課程由國立中央大學管理學院授課。</p>
<p>(2) 6門課程由阿爾托大學行政教育機構授課。其中5門課程將由大學教授在台灣授課，另1門課程為國際課程。</p>"""

    zh_courses_ncu = """<ul>
<li>應用經濟學</li>
<li>商業研究方法</li>
<li>管理會計實務</li>
<li>數位營運與工業4.0實務</li>
<li>溝通</li>
<li>人力資源管理實務</li>
<li>永續商業與ESG</li>
<li>金融與銀行</li>
<li>商業應用數據科學</li>
</ul>"""

    zh_courses_aalto = """<ul>
<li>個人與組織領導力</li>
<li>創新管理</li>
<li>社會創新與永續發展</li>
<li>全球供應鏈管理</li>
<li>策略管理</li>
<li>行銷</li>
</ul>"""

    # 英文內容
    en_content_intro = """<p>The program is jointly developed by National Central University and Aalto University, comprising 15 courses and an individual thesis project.</p>
<p style="margin-bottom: 0.3em;">(1) 9 courses taught by NCU College of Management</p>
<p>(2) 6 courses taught by Aalto University. 5 of these courses will be taught by Aalto faculty in Taiwan, and 1 course is an international program.</p>"""

    en_courses_ncu = """<ul>
<li>Applied Economics</li>
<li>Business Research Methods</li>
<li>Management Accounting</li>
<li>Digital Operations & Industry 4.0</li>
<li>Communication</li>
<li>Human Resource Management</li>
<li>Sustainable Business & ESG</li>
<li>Finance & Banking</li>
<li>Business Data Science</li>
</ul>"""

    en_courses_aalto = """<ul>
<li>Personal & Organizational Leadership</li>
<li>Innovation Management</li>
<li>Social Innovation & Sustainable Development</li>
<li>Global Supply Chain Management</li>
<li>Strategic Management</li>
<li>Marketing</li>
</ul>"""

    # 更新中文版本
    for locale, intro_content, ncu_content, aalto_content in [
        ("zh-TW", zh_content_intro, zh_courses_ncu, zh_courses_aalto),
        ("en-US", en_content_intro, en_courses_ncu, en_courses_aalto),
    ]:
        field = db.query(ContentField).filter(
            ContentField.section_id == section.id,
            ContentField.field_key == "info_items",
            ContentField.locale == locale
        ).first()

        if field:
            try:
                info_items = json.loads(field.field_value)
            except:
                info_items = []

            # 更新各卡片的 content
            if len(info_items) > 0:
                info_items[0]["content"] = intro_content
                print(f"  ✅ 已更新招生資訊卡片 ({locale})")

            if len(info_items) > 1:
                info_items[1]["content"] = ncu_content
                print(f"  ✅ 已更新國立中央大學課程卡片 ({locale})")

            if len(info_items) > 2:
                info_items[2]["content"] = aalto_content
                print(f"  ✅ 已更新阿爾托大學課程卡片 ({locale})")

            field.field_value = json.dumps(info_items, ensure_ascii=False)

    db.commit()
    print("\n🎉 課程內容已更新！")

except Exception as e:
    print(f"❌ 錯誤：{e}")
    import traceback
    traceback.print_exc()
    db.rollback()
    raise
finally:
    db.close()
