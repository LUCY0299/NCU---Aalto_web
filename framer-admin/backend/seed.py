"""
seed.py — 初始資料載入腳本
============================
這個腳本會：
1. 建立管理員帳號
2. 建立網站所有頁面（依照架構圖）
3. 為每個頁面建立基本區塊與欄位
4. 支援繁體中文（zh-TW）與英文（en-US）初始內容

執行方式：
  cd backend
  python seed.py

⚠️  注意：重複執行不會重複建資料（已有資料會跳過）
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import Page, Section, ContentField, User
from routers.auth import hash_password

# ─────────────────────────────────────────
# 初始管理員帳號設定
# 執行 seed.py 後，用這組帳密登入後台
# 正式上線前請務必修改密碼！
# ─────────────────────────────────────────
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ncu-aalto-2024")   # ⚠️ 請在 .env 或雲端環境變數裡設定
ADMIN_EMAIL = "admin@example.com"


# ─────────────────────────────────────────
# 網站頁面架構（對應架構圖）
# 格式：{ slug, title, parent_slug, order, is_active }
# ─────────────────────────────────────────
PAGES = [
    {"slug": "home",            "title": "首頁",           "parent_slug": None,      "order": 1,  "active": True},
    {"slug": "about",           "title": "關於 Aalto EMBA","parent_slug": None,      "order": 2,  "active": True},
    {"slug": "about-aalto-emba","title": "關於 Aalto EMBA（子頁）","parent_slug": "about","order": 1,"active": True},
    {"slug": "about-aalto",     "title": "關於 Aalto",     "parent_slug": "about",   "order": 2,  "active": True},
    {"slug": "about-ncu",       "title": "關於中央大學",    "parent_slug": "about",   "order": 3,  "active": True},
    {"slug": "learning",        "title": "學習回饋",        "parent_slug": None,      "order": 3,  "active": True},
    {"slug": "alumni",          "title": "校友分享",        "parent_slug": "learning","order": 1,  "active": True},
    {"slug": "events",          "title": "活動訊息",        "parent_slug": "learning","order": 2,  "active": True},
    {"slug": "courses",         "title": "課程相關",        "parent_slug": None,      "order": 4,  "active": True},
    {"slug": "admission",       "title": "招生資訊",        "parent_slug": "courses", "order": 1,  "active": True},
    {"slug": "degree",          "title": "修業與學位",      "parent_slug": "courses", "order": 2,  "active": True},
    {"slug": "application",     "title": "入學申請",        "parent_slug": "courses", "order": 3,  "active": True},
    {"slug": "tuition",         "title": "學費與獎學金",    "parent_slug": "courses", "order": 4,  "active": True},
    {"slug": "faq",             "title": "FAQ 常見問題",    "parent_slug": "courses", "order": 5,  "active": True},
    {"slug": "contact",         "title": "聯絡方式",        "parent_slug": None,      "order": 5,  "active": True},
    {"slug": "search",          "title": "搜尋引擎",        "parent_slug": None,      "order": 6,  "active": True},
]


# ─────────────────────────────────────────
# 各頁面初始區塊與內容
# 格式：{ page_slug, key, name, type, order, fields }
# fields 格式：{ key, label, type, zh_TW, en_US }
# ─────────────────────────────────────────
SECTIONS_DATA = [

    # ════════════════════
    # 首頁 (home)
    # ════════════════════
    {
        "page_slug": "home", "key": "hero", "name": "頂部橫幅 (Hero)", "type": "hero", "order": 1,
        "fields": [
            {"key": "title",    "label": "主標題",   "type": "text",
             "zh": "國立中央大學 × 阿爾托大學 高階經營管理碩士在職學位學程",
             "en": "National Central University × Aalto University Executive MBA Program"},
            {"key": "subtitle", "label": "副標題",   "type": "text",
             "zh": "NCU × Aalto Executive MBA Program",
             "en": "NCU × Aalto University EMBA Program"},
            {"key": "description", "label": "敘述文字", "type": "text",
             "zh": "北歐創新 × 亞洲實戰 Leading with Global Vision",
             "en": "Nordic Innovation × Asia Action: Leading with Global Vision"},
             {"key": "image_url", "label": "背景圖片", "type": "image",
             "zh": "",
             "en": ""}
        ]
    },
    {
        "page_slug": "home", "key": "intro", "name": "計畫介紹", "type": "text", "order": 2,
        "fields": [
            {"key": "title",   "label": "區塊標題", "type": "text",
             "zh": "關於本計畫",
             "en": "About the Program"},
            
            # 副標題欄位
            {"key": "subtitle", "label": "副標題", "type": "text",
             "zh": "Lead with Nordic Vision.",
             "en": "Lead with Nordic Vision."},
            
            {"key": "content", "label": "介紹內文", "type": "textarea",
             "zh": "本學程結合國立中央大學與芬蘭阿爾托大學的師資與資源，培育具國際視野的高階管理人才。",
             "en": "This program combines faculty and resources from NCU and Aalto University to cultivate global business leaders."},
            
            # 圖片存放欄位
            {"key": "image_url", "label": "計畫圖片", "type": "image",
             "zh": "", 
             "en": ""}
        ]
    },

    # ════════════════════
    # 關於 Aalto EMBA (標題前言)
    # ════════════════════
    {
        "page_slug": "about-aalto-emba",
        "key": "about_header",
        "name": "關於Aalto EMBA(標題前言)",
        "type": "text", 
        "order": 1,
        "fields": [
            {"key": "title", "label": "主標題", "type": "text", "zh": "關於 Aalto EMBA", "en": "About Aalto EMBA"},
            {"key": "content", "label": "前言內文", "type": "textarea", "zh": "隨著全球企業面臨數位轉型的浪潮，許多公司渴望培養優秀的第二代接班人，並透過學習以提升自身能力，為學術界拓展潛在人才培育資源創造良機。為了應對全球化的挑戰並提升國立中央大學管理學院的國際競爭力，國立中央大學管理學院與芬蘭阿爾托大學設立之高階管理教育機構（Aalto University Executive Ltd,簡稱Aalto EE）合作，推出高階經營管理碩士在職學位學程，本課程旨在強化參與者在跨國商業環境中進行戰略決策的能力，並培養跨領域整合知能。", "en": ""},
            {"key": "image_url", "label": "頂部圖片", "type": "image", "zh": "", "en": ""}
        ]
    },

    # ════════════════════
    # 關於 Aalto EMBA (特色介紹)
    # ════════════════════
    {
        "page_slug": "about-aalto-emba",
        "key": "about_intro",
        "name": "關於Aalto EMBA(特色介紹)",
        "type": "list",
        "order": 2,
        "fields": [
            {"key": "title", "label": "特色標題", "type": "text", "zh": "", "en": ""},
            {"key": "desc", "label": "特色內文", "type": "textarea", "zh": "", "en": ""}
        ]
    },

    # ════════════════════
    # 關於 Aalto EMBA (圖片連結)
    # ════════════════════
    {
        "page_slug": "about-aalto-emba",
        "key": "about_links",
        "name": "關於Aalto EMBA(圖片連結)",
        "type": "list",  # 🌟 改為 list，啟動標準的新增清單按鈕
        "order": 3,
        "fields": [
            # 定義「每一張圖片卡片」需要填寫的欄位
            {"key": "title", "label": "按鈕文字", "type": "text", "zh": "", "en": ""},
            {"key": "image_url", "label": "背景圖片", "type": "image", "zh": "", "en": ""},
            {"key": "link_url", "label": "連結網址", "type": "text", "zh": "", "en": ""}
        ]
    },

    # ════════════════════
    # 校友分享 (標題連結)
    # ════════════════════
    {
        "page_slug": "alumni",
        "key": "alumni_header",
        "name": "校友分享(標題連結)",
        "type": "text", 
        "order": 1,
        "fields": [
            {"key": "section_title", "label": "區塊標題", "type": "text", "zh": "校友分享", "en": "Alumni Sharing"},
            {"key": "show_button", "label": "顯示更多按鈕", "type": "boolean", "zh": "true", "en": "true"},
            {"key": "button_text", "label": "按鈕文字", "type": "text", "zh": "更多 校友分享", "en": "More Alumni"},
            {"key": "button_link", "label": "按鈕連結", "type": "text", "zh": "/校友分享全", "en": "/alumni"}
        ]
    },
    
    # ════════════════════
    # 校友分享 (卡片)
    # ════════════════════
    {
        "page_slug": "alumni",
        "key": "alumni_sharing",
        "name": "校友分享(卡片)",
        "type": "list",
        "order": 2,
        "fields": [
            {
                "key": "alumni_list", 
                "label": "校友分享清單", 
                "type": "list",
                "items": [
                    {"key": "title", "label": "標題", "type": "text"},
                    {"key": "summary", "label": "內容大綱", "type": "text"},
                    {"key": "is_active", "label": "狀態", "type": "boolean"},
                    {"key": "image_url", "label": "照片", "type": "image"},
                    {"key": "date", "label": "日期", "type": "date"},
                    {"key": "content", "label": "完整內容", "type": "richtext"}
                ]
            }
        ]
    },

    # ════════════════════
    # 活動訊息 (event_news)
    # ════════════════════
    {
        "page_slug": "events",
        "key": "event_news",
        "name": "活動訊息",
        "type": "list",
        "order": 1,
        "fields": [
            {
                "key": "event_list",
                "label": "活動清單",
                "type": "list",  # 巢狀列表結構（跟校友分享共用同一套後台介面）
                "items": [
                    {"key": "title", "label": "標題", "type": "text"},
                    {"key": "summary", "label": "列表摘要", "type": "text"},
                    {"key": "is_active", "label": "狀態", "type": "boolean"},
                    {"key": "image_url", "label": "封面圖", "type": "image"},
                    {"key": "image_caption", "label": "圖說（選填，封面圖用）", "type": "text"},
                    {"key": "date", "label": "日期", "type": "date"},
                    {
                        "key": "blocks",
                        "label": "詳情頁內容區塊（可新增/刪除/排序，文字、圖片、圖說各自獨立）",
                        "type": "blocks",
                        "block_types": ["text", "image", "caption"],
                    },
                ]
            }
        ]
    },

    # ════════════════════
    # 招生資訊 (admission)
    # ════════════════════
    {
        "page_slug": "admission", "key": "admission-hero", "name": "招生 頂部", "type": "hero", "order": 1,
        "fields": [
            {"key": "title",    "label": "主標題", "type": "text",
             "zh": "招生資訊",
             "en": "Admission Information"},
            {"key": "subtitle", "label": "副標題", "type": "text",
             "zh": "了解最新說明會、講座與招生活動資訊",
             "en": "Learn about the latest info sessions, seminars, and admission events"},
        ]
    },
    {
        "page_slug": "admission", "key": "admission-info", "name": "招生資訊", "type": "text", "order": 2,
        "fields": [
            {"key": "title",   "label": "區塊標題", "type": "text",
             "zh": "招生資訊",
             "en": "Admission Information"},
            {"key": "image_url", "label": "圖片", "type": "image",
             "zh": "", "en": ""},
            {"key": "image_url_2", "label": "圖片 2（測試用）", "type": "image",
             "zh": "", "en": ""},
            {"key": "heading", "label": "小標", "type": "text",
             "zh": "本專班包含15 門課程及個人論文項目，其中:",
             "en": "This program includes 15 courses and an individual thesis project, of which:"},
            {"key": "content", "label": "內文", "type": "textarea",
             "zh": "(一) 9 門課程由中央大學管理學院授課。\n(二) 6門課程由阿爾托大學設立之高階管理教育機構授課。\nAalto EE的6門課程中，其中5門課程將由該校教授來台授課，另1門則為國際課程。",
             "en": "(1) 9 courses are taught by NCU College of Management.\n(2) 6 courses are taught by Aalto EE, the executive education institute established by Aalto University.\nOf Aalto EE's 6 courses, 5 will be taught in Taiwan by Aalto faculty, and 1 is an international course."},
        ]
    },
    {
        "page_slug": "admission", "key": "admission-requirements", "name": "入學門檻", "type": "text", "order": 3,
        "fields": [
            {"key": "title",   "label": "區塊標題", "type": "text",
             "zh": "入學門檻",
             "en": "Admission Requirements"},
            {"key": "image_url", "label": "圖片", "type": "image",
             "zh": "", "en": ""},
            {"key": "heading", "label": "小標", "type": "text",
             "zh": "申請人可通過以下語言測試之一來證明其英語能力：",
             "en": "Applicants may prove English proficiency through one of the following language tests:"},
            {"key": "content", "label": "內文", "type": "textarea",
             "zh": "(一) IELTS Academic\n1.最低總分：6.5\n2.寫作最低分數：5.5\n(二) TOEFL\n1.TOEFL iBT（網路測驗）：最低 92 分，且寫作 22 分\n2.TOEFL PDT（紙本測驗）：閱讀 22 分、聽力 22 分、寫作 24 分\n(三) TOEIC\n最低800分",
             "en": "(1) IELTS Academic\n1. Minimum overall score: 6.5\n2. Minimum writing score: 5.5\n(2) TOEFL\n1. TOEFL iBT: minimum 92, with a writing score of 22\n2. TOEFL PDT: reading 22, listening 22, writing 24\n(3) TOEIC\nMinimum score: 800"},
        ]
    },

    # ════════════════════
    # 修業與學位 (degree)
    # ════════════════════
    {
        "page_slug": "degree", "key": "degree-hero", "name": "修業與學位 頂部", "type": "hero", "order": 1,
        "fields": [
            {"key": "title",    "label": "主標題", "type": "text",
             "zh": "修業與學位",
             "en": "Degree & Certification"},
            {"key": "subtitle", "label": "副標題", "type": "text",
             "zh": "了解申請資格、流程與所需文件",
             "en": "Learn about eligibility, process, and required documents"},
        ]
    },
    {
        "page_slug": "degree", "key": "degree-regulations", "name": "修業規定", "type": "text", "order": 2,
        "fields": [
            {"key": "title",   "label": "區塊標題", "type": "text",
             "zh": "修業規定",
             "en": "Academic Regulations"},
            {"key": "item1_heading", "label": "小標題 1", "type": "text",
             "zh": "一、課程架構",
             "en": "1. Course Structure"},
            {"key": "item1_content", "label": "內文 1", "type": "textarea",
             "zh": "高階經營管理碩士在職學位學程課程由中央大學及阿爾托大學下設之高階管理教育機構(AaltoEE)共同規劃，包含15 門課程及個人論文項目，共計45 個學分。其中9 門課程由中央大學管理學院授課，另6 門課程由阿爾托大學商學院(Aalto University School of Business)授課。阿爾托大學商學院(Aalto University School of Business)的6門課程中，其中5 門課程將由該校教授在台灣授課，另1 門為國際課程，學生將前往由芬蘭赫辛基阿爾托大學下設之高階管理教育機構(Aalto EE)所安排規課為期1至2週的學習活動。所有在職專班組成要素，包括教職員、課程規劃、修課辦法等規劃皆需經中央大學及阿爾托商學院(Aalto University School of Business)雙方批准後實行。",
             "en": "The Executive MBA program is jointly designed by NCU and Aalto University's Aalto EE, comprising 15 courses and an individual thesis project, totaling 45 credits. 9 courses are taught by NCU College of Management, and 6 courses are taught by Aalto University School of Business. Of these 6 courses, 5 are taught in Taiwan by Aalto faculty, and 1 is an international course requiring a 1-2 week study trip to Aalto EE in Helsinki, Finland. All program elements, including faculty, curriculum, and course requirements, must be approved by both NCU and Aalto University School of Business."},
            {"key": "item2_heading", "label": "小標題 2", "type": "text",
             "zh": "二、個人論文",
             "en": "2. Individual Thesis"},
            {"key": "item2_content", "label": "內文 2", "type": "textarea",
             "zh": "個人論文將由國立中央大學教授擔任主要指導，並須經阿爾托大學審閱與核准論文摘要，以確保跨校學術標準之一致性與研究成果之品質。隨著雙方合作關係持續深化，未來將逐步推動共同論文指導與跨校研究合作機制，進一步提升學生研究能力及國際學術影響力。學生須修習並完成論文相關課程，累計共6 學分。",
             "en": "The individual thesis is primarily supervised by an NCU professor, with the thesis abstract reviewed and approved by Aalto University to ensure consistency of academic standards and research quality across both institutions. As the partnership deepens, joint thesis supervision and cross-institution research collaboration will gradually be promoted to further enhance students' research capabilities and international academic impact. Students must complete thesis-related coursework totaling 6 credits."},
        ]
    },
    {
        "page_slug": "degree", "key": "degree-certification", "name": "學位授予", "type": "text", "order": 3,
        "fields": [
            {"key": "title",   "label": "區塊標題", "type": "text",
             "zh": "學位授予",
             "en": "Degree Conferral"},
            {"key": "item1_heading", "label": "小標題 1", "type": "text",
             "zh": "一、學位證明",
             "en": "1. Degree Certificate"},
            {"key": "item1_content", "label": "內文 1", "type": "textarea",
             "zh": "(一) 完成畢業要求之學生，由中央大學授予「學位證明」，並依芬蘭大學法規定，由阿爾托大學商學院（Aalto University School of Business）頒發「結業證明」，學位及結業證明將以英語頒發。\n(二) 在計畫結束時授予參與者的學位證明：由國立中央大學管理學院頒發的高階主管企管碩士（Executive Master of Business Administration）畢業證書。",
             "en": "(1) Students who complete graduation requirements will be awarded a \"Degree Certificate\" by NCU. In accordance with Finnish university regulations, a \"Certificate of Completion\" will also be issued by Aalto University School of Business. Both certificates will be issued in English.\n(2) Degree certificate awarded upon program completion: Executive Master of Business Administration diploma issued by the NCU College of Management."},
            {"key": "item2_heading", "label": "小標題 2", "type": "text",
             "zh": "二、結業證明",
             "en": "2. Certificate of Completion"},
            {"key": "item2_content", "label": "內文 2", "type": "textarea",
             "zh": "在計畫結束時授予參與者的結業證明：由阿爾托大學商學院(Aalto University School of Business)頒發的高階主管企管碩士（Executive Master of Business Administration）結業證書。",
             "en": "Certificate of completion awarded upon program completion: Executive Master of Business Administration certificate issued by Aalto University School of Business."},
        ]
    },

    # ════════════════════
    # 聯絡方式 (contact)
    # ════════════════════
    {
        "page_slug": "contact", "key": "contact-info", "name": "聯絡資訊", "type": "text", "order": 1,
        "fields": [
            {"key": "title",   "label": "標題",    "type": "text",
             "zh": "聯絡我們",
             "en": "Contact Us"},
            {"key": "subtitle", "label": "副標題",  "type": "text",
             "zh": "請留下您的訊息",
             "en": "Leave us a message"},
            {"key": "map_address", "label": "地圖搜尋地址（建議只留門牌，不要含樓層）", "type": "text",
             "zh": "桃園市中壢區中大路300號",
             "en": "No. 300, Zhongda Rd., Zhongli Dist., Taoyuan City"},
            {"key": "phone",   "label": "電話",    "type": "text",
             "zh": "(03) 422-7151 分機 57601",
             "en": "+886-3-422-7151 ext. 57601"},
            {"key": "email",   "label": "Email",   "type": "text",
             "zh": "emba@cc.ncu.edu.tw",
             "en": "emba@cc.ncu.edu.tw"},
            {"key": "address", "label": "地址",    "type": "text",
             "zh": "桃園市中壢區中大路 300 號",
             "en": "No. 300, Zhongda Rd., Zhongli Dist., Taoyuan City"},
        ]
    },
]


def seed_database():
    """執行初始資料載入"""
    # 確保資料表存在
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ─── 建立管理員帳號 ───
        existing_admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if not existing_admin:
            admin = User(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                hashed_password=hash_password(ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"✅ 管理員帳號已建立：{ADMIN_USERNAME} / {ADMIN_PASSWORD}")
        else:
            print(f"⏭️  管理員帳號已存在，跳過")

        # ─── 建立頁面 ───
        page_objects = {}
        for p in PAGES:
            existing = db.query(Page).filter(Page.slug == p["slug"]).first()
            if not existing:
                page = Page(
                    slug=p["slug"],
                    title=p["title"],
                    parent_slug=p["parent_slug"],
                    display_order=p["order"],
                    is_active=p["active"],
                )
                db.add(page)
                db.commit()
                db.refresh(page)
                page_objects[p["slug"]] = page
                print(f"✅ 頁面已建立：{p['title']} ({p['slug']})")
            else:
                page_objects[p["slug"]] = existing
                print(f"⏭️  頁面已存在：{p['slug']}，跳過")

        # ─── 建立區塊與內容欄位 ───
        for sec_data in SECTIONS_DATA:
            page = page_objects.get(sec_data["page_slug"])
            if not page:
                print(f"⚠️  找不到頁面 {sec_data['page_slug']}，跳過區塊 {sec_data['key']}")
                continue

            existing_section = db.query(Section).filter(
                Section.page_id == page.id,
                Section.section_key == sec_data["key"]
            ).first()

            if not existing_section:
                section = Section(
                    page_id=page.id,
                    section_key=sec_data["key"],
                    name=sec_data["name"],
                    section_type=sec_data["type"],
                    display_order=sec_data["order"],
                )
                db.add(section)
                db.commit()
                db.refresh(section)
                print(f"  ✅ 區塊已建立：{sec_data['name']}")
            else:
                section = existing_section
                print(f"  ⏭️  區塊已存在：{sec_data['key']}，跳過")

            # 建立欄位（zh-TW 和 en-US 各一份）
            for field_data in sec_data.get("fields", []):
                
                # 👇 1. 判斷欄位類型，給予正確的初始值
                if field_data.get("type") in ["list", "global_list"]:
                    # 如果是清單類型，初始值給一個空的 JSON 陣列
                    zh_value = "[]"
                    en_value = "[]"
                else:
                    # 如果是普通欄位，安全地取得 zh 和 en 的值（找不到就給空字串）
                    zh_value = field_data.get("zh", "")
                    en_value = field_data.get("en", "")

                # 👇 2. 將整理好的值帶入原本的迴圈
                for locale, value in [("zh-TW", zh_value), ("en-US", en_value)]:
                    existing_field = db.query(ContentField).filter(
                        ContentField.section_id == section.id,
                        ContentField.field_key == field_data["key"],
                        ContentField.locale == locale,
                    ).first()

                    if not existing_field:
                        field = ContentField(
                            section_id=section.id,
                            field_key=field_data["key"],
                            field_value=value,
                            field_type=field_data["type"],
                            locale=locale,
                            label=field_data["label"],
                        )
                        db.add(field)

            db.commit()

        print("\n🎉 初始資料載入完成！")
        print(f"   後台登入帳號：{ADMIN_USERNAME}")
        print(f"   後台登入密碼：{ADMIN_PASSWORD}")
        print(f"   啟動伺服器後到 http://localhost:8000/docs 測試")

    except Exception as e:
        print(f"❌ 發生錯誤：{e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
