import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_path):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors
    BG_COLOR = RGBColor(10, 15, 29)        # #0A0F1D Deep Midnight Slate
    CARD_BG = RGBColor(19, 26, 44)         # #131A2C Slate Card
    CARD_INNER = RGBColor(27, 36, 60)      # #1B243C Nested Card
    CARD_BORDER = RGBColor(40, 52, 75)     # #28344B Subtle Border
    CARD_BORDER_ACCENT = RGBColor(6, 182, 212) # Cyan border
    
    ACCENT_CYAN = RGBColor(6, 182, 212)    # #06B6D4 Cyber Cyan
    ACCENT_GREEN = RGBColor(16, 185, 129)  # #10B981 Shield Emerald
    ACCENT_RED = RGBColor(239, 68, 68)     # #EF4444 Emergency Coral
    ACCENT_AMBER = RGBColor(245, 158, 11)  # #F59E0B Warning Gold
    ACCENT_BLUE = RGBColor(59, 130, 246)   # #3B82F6 Tech Blue
    ACCENT_PURPLE = RGBColor(168, 85, 247) # #A855F7 Future Purple
    
    TEXT_WHITE = RGBColor(248, 250, 252)   # #F8FAFC Pure/Bright
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Secondary
    TEXT_DIM = RGBColor(100, 116, 139)     # #64748B Muted labels

    def set_slide_bg(slide):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR

    def add_header(slide, kicker, title, slide_num=""):
        # Kicker
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = kicker.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_CYAN
        p.font.name = "Segoe UI"
        
        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(10.2), Inches(0.6))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p2 = tf_title.paragraphs[0]
        p2.text = title
        p2.font.size = Pt(23)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Segoe UI"
        
        # Slide Number Badge
        if slide_num:
            tb_num = slide.shapes.add_textbox(Inches(11.2), Inches(0.72), Inches(1.33), Inches(0.45))
            tf_num = tb_num.text_frame
            tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
            p_num = tf_num.paragraphs[0]
            p_num.alignment = PP_ALIGN.RIGHT
            p_num.text = f"{slide_num} / 09"
            p_num.font.size = Pt(13)
            p_num.font.bold = True
            p_num.font.color.rgb = TEXT_DIM
            p_num.font.name = "Segoe UI"

    def add_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=CARD_BG):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.2)
        return shape

    def add_badge(slide, left, top, width, height, text, bg_color, text_color):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.fill.background()
        tf = shape.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_right = Inches(0.08)
        tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.text = text
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = text_color
        p.font.name = "Segoe UI"
        return shape

    def set_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1)
    
    # Top Category Pill
    add_badge(s1, Inches(0.8), Inches(0.9), Inches(4.2), Inches(0.38), 
              "INNOVATION IN EMERGENCY & PRIVACY TECH", CARD_INNER, ACCENT_CYAN)
    
    # Main Hero Title
    tb = s1.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.7), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PingShield"
    p.font.size = Pt(56)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.font.name = "Segoe UI"
    
    # Subtitle / Tagline
    tb_tag = s1.shapes.add_textbox(Inches(0.8), Inches(2.65), Inches(11.7), Inches(0.8))
    tf_tag = tb_tag.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "Privacy-First QR Lost & Found & Emergency Response System"
    p_tag.font.size = Pt(21)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_GREEN
    p_tag.font.name = "Segoe UI"
    
    p_sub = tf_tag.add_paragraph()
    p_sub.text = "(A High-Impact Safety Extension to the PingME Ecosystem)"
    p_sub.font.size = Pt(14)
    p_sub.font.color.rgb = TEXT_MUTED
    p_sub.font.name = "Segoe UI"
    
    # 3 Pill Badges
    pills = [
        ("ZERO-APP MOBILE WEBFLOW", ACCENT_CYAN),
        ("100% MASKED CLOUD TELEPHONY", ACCENT_GREEN),
        ("TWO-ATTEMPT EMERGENCY PROTOCOL", ACCENT_AMBER)
    ]
    for i, (pill_txt, pill_col) in enumerate(pills):
        add_badge(s1, Inches(0.8 + i * 3.9), Inches(3.7), Inches(3.7), Inches(0.42),
                  pill_txt, CARD_BG, pill_col)
    
    # Metadata Presentation Card
    meta_card = add_card(s1, Inches(0.8), Inches(4.45), Inches(11.733), Inches(2.2), 
                         border_color=CARD_BORDER, bg_color=CARD_BG)
    
    # Left column of card: Team & Leader
    tb_m1 = s1.shapes.add_textbox(Inches(1.2), Inches(4.7), Inches(5.0), Inches(1.7))
    tf_m1 = tb_m1.text_frame
    tf_m1.word_wrap = True
    
    p = tf_m1.paragraphs[0]
    p.text = "TEAM DETAILS"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    
    p2 = tf_m1.add_paragraph()
    p2.text = "PEAKY BLINDERS"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    
    p3 = tf_m1.add_paragraph()
    p3.text = "Team Leader: Parth Sharma"
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_MUTED
    
    p4 = tf_m1.add_paragraph()
    p4.text = "Institution: Punjab Engineering College (PEC), Chandigarh"
    p4.font.size = Pt(12)
    p4.font.color.rgb = ACCENT_AMBER

    # Right column of card: Project Readiness
    tb_m2 = s1.shapes.add_textbox(Inches(6.8), Inches(4.7), Inches(5.2), Inches(1.7))
    tf_m2 = tb_m2.text_frame
    tf_m2.word_wrap = True
    
    p = tf_m2.paragraphs[0]
    p.text = "PROJECT READINESS"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN
    
    p2 = tf_m2.add_paragraph()
    p2.text = "Live Working Prototype & Simulation Mode"
    p2.font.size = Pt(18)
    p2.font.bold = True
    p2.font.color.rgb = TEXT_WHITE
    
    p3 = tf_m2.add_paragraph()
    p3.text = "• Credential-Free Local Simulation Mode enabled\n• Zero-dependency web demo ready for jury evaluation\n• Scalable architecture ready for deployment"
    p3.font.size = Pt(11.5)
    p3.font.color.rgb = TEXT_MUTED
    
    set_notes(s1, 
        "Welcome judges and audience! We are Team PEAKY BLINDERS from Punjab Engineering College, Chandigarh. "
        "I am Parth Sharma, and today we are thrilled to present PingShield—a privacy-first QR Lost & Found and Emergency Response system designed as a high-impact extension to PingME. "
        "In this pitch, we will show you how PingShield bridges the gap between physical items, personal privacy, and life-saving highway emergency response with zero app friction."
    )

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2)
    add_header(s2, "THE PROBLEM • CRITICAL VULNERABILITIES", "Why Physical Tags & Emergency Outreach Are Broken", "02")
    
    problems = [
        {
            "tag": "SECURITY VULNERABILITY",
            "tag_col": ACCENT_RED,
            "title": "Severe Privacy & Doxxing Risks",
            "body": "Pasting plain phone numbers on backpacks, keychains, laptops, or bikes exposes owners directly to unsolicited spam, cyber stalking, extortion, and physical harassment.",
            "stat_label": "THE REALITY",
            "stat_desc": "100% plain text tags expose owner identity and phone records to every passerby with zero access control."
        },
        {
            "tag": "LIFE-THREATENING DELAY",
            "tag_col": ACCENT_AMBER,
            "title": "Golden-Hour Emergency Blindspots",
            "body": "During highway accidents or sudden medical distress, bystanders cannot notify family members because the victim's smartphone is locked behind PINs or biometrics.",
            "stat_label": "THE REALITY",
            "stat_desc": "Golden hour is lost. First responders and bystanders have zero verified contact vectors to alert immediate next of kin."
        },
        {
            "tag": "ADOPTION ROADBLOCK",
            "tag_col": ACCENT_CYAN,
            "title": "Severe App & Registration Friction",
            "body": "Finders will not download a 60MB app, sign up with their personal email, or surrender their own phone number just to do a quick good deed and report a lost item.",
            "stat_label": "THE REALITY",
            "stat_desc": "Over 85% finder drop-off rate when forced to download an application or complete mandatory registration."
        }
    ]
    
    card_w = Inches(3.64)
    gap = Inches(0.4)
    for i, p_info in enumerate(problems):
        c_left = Inches(0.8 + i * (3.64 + 0.4))
        c_top = Inches(1.55)
        c_h = Inches(5.35)
        
        card = add_card(s2, c_left, c_top, card_w, c_h, border_color=CARD_BORDER, bg_color=CARD_BG)
        
        # Pill Tag
        add_badge(s2, c_left + Inches(0.3), c_top + Inches(0.35), Inches(3.04), Inches(0.36),
                  p_info["tag"], CARD_INNER, p_info["tag_col"])
        
        # Text Block
        tb = s2.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(0.85), Inches(3.04), Inches(2.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = p_info["title"]
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.font.name = "Segoe UI"
        
        p_body = tf.add_paragraph()
        p_body.space_before = Pt(8)
        p_body.text = p_info["body"]
        p_body.font.size = Pt(12)
        p_body.font.color.rgb = TEXT_MUTED
        p_body.font.name = "Segoe UI"
        
        # Nested Stat / Reality Box
        stat_box = add_card(s2, c_left + Inches(0.25), c_top + Inches(3.45), Inches(3.14), Inches(1.55),
                            border_color=CARD_BORDER, bg_color=CARD_INNER)
        tb_s = s2.shapes.add_textbox(c_left + Inches(0.4), c_top + Inches(3.55), Inches(2.84), Inches(1.35))
        tf_s = tb_s.text_frame
        tf_s.word_wrap = True
        
        ps1 = tf_s.paragraphs[0]
        ps1.text = p_info["stat_label"]
        ps1.font.size = Pt(10)
        ps1.font.bold = True
        ps1.font.color.rgb = p_info["tag_col"]
        
        ps2 = tf_s.add_paragraph()
        ps2.space_before = Pt(3)
        ps2.text = p_info["stat_desc"]
        ps2.font.size = Pt(11)
        ps2.font.color.rgb = TEXT_WHITE
        
    set_notes(s2,
        "Every single day millions of people attach stickers or baggage tags with their personal phone numbers. "
        "This creates three huge crises: First, privacy: you're broadcasting your personal phone number on trains, buses, and cafes to anyone with bad intentions. "
        "Second, in a road accident or medical emergency, bystanders want to help, but the victim's phone is locked. Family members aren't alerted until hours later. "
        "Third, existing solutions force the finder to install an app or make an account—nobody has the patience for that. PingShield eliminates all three pain points."
    )

    # =========================================================================
    # SLIDE 3: OUR SOLUTION — PINGSHIELD
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3)
    add_header(s3, "THE SOLUTION • PINGSHIELD ECOSYSTEM", "Privacy-Preserving Physical-to-Digital Safety Bridge", "03")
    
    solutions = [
        {
            "badge": "01 • INSTANT WEBFLOW",
            "col": ACCENT_CYAN,
            "title": "Zero-App Dynamic QR Tags",
            "points": [
                "Unique, unpredictable cryptographically salted tokens attached to assets.",
                "Instantly opens a mobile-first web app on any smartphone browser.",
                "Full bilingual localization: Seamless English & Hindi toggling.",
                "Zero downloads, zero registrations, zero user resistance."
            ]
        },
        {
            "badge": "02 • IDENTITY CLOAK",
            "col": ACCENT_GREEN,
            "title": "100% Masked Communication",
            "points": [
                "Finders call or message the owner through a cloud telephony bridge.",
                "Neither party ever sees the other party's actual phone number.",
                "Virtual PBX proxies both voice calls and SMS alerts bidirectionally.",
                "Guarantees permanent immunity from stalking, spam, and doxxing."
            ]
        },
        {
            "badge": "03 • GEOSPATIAL PRIVACY",
            "col": ACCENT_BLUE,
            "title": "Voluntary Location Sharing",
            "points": [
                "One-tap GPS coordinates captured only upon explicit finder consent.",
                "Owner views precise incident spot on an interactive Leaflet map.",
                "Built-in manual landmark fallback if GPS is denied or offline.",
                "No background location polling or invasive device tracking."
            ]
        },
        {
            "badge": "04 • IMMEDIATE LIFELINE",
            "col": ACCENT_RED,
            "title": "Instant Public Helplines",
            "points": [
                "Direct 1-tap dialer for 112 (National Emergency Helpline).",
                "Direct 1-tap dialer for 1033 (National Highway Assistance).",
                "Displays real-time GPS coordinates directly on screen for 911 dispatch.",
                "Empowers bystanders during road accidents with zero guesswork."
            ]
        }
    ]
    
    for i, sol in enumerate(solutions):
        row = i // 2
        col = i % 2
        
        left = Inches(0.8 + col * (5.666 + 0.4))
        top = Inches(1.55 + row * (2.55 + 0.3))
        w = Inches(5.666)
        h = Inches(2.55)
        
        add_card(s3, left, top, w, h, border_color=CARD_BORDER, bg_color=CARD_BG)
        add_badge(s3, left + Inches(0.3), top + Inches(0.25), Inches(2.6), Inches(0.32),
                  sol["badge"], CARD_INNER, sol["col"])
        
        tb = s3.shapes.add_textbox(left + Inches(0.3), top + Inches(0.65), w - Inches(0.6), h - Inches(0.75))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = sol["title"]
        p.font.size = Pt(16.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.font.name = "Segoe UI"
        
        for pt in sol["points"]:
            p_pt = tf.add_paragraph()
            p_pt.space_before = Pt(3)
            p_pt.text = f"•  {pt}"
            p_pt.font.size = Pt(11)
            p_pt.font.color.rgb = TEXT_MUTED
            p_pt.font.name = "Segoe UI"
            
    set_notes(s3,
        "Here is the PingShield solution: A zero-app, mobile-first web experience. When someone finds a lost bag or comes across a vehicle crash, they simply point their camera at the QR code. "
        "It opens an instant mobile web page in English or Hindi. From there, they can initiate a 100% masked phone call or message where neither side sees real phone numbers. "
        "They can voluntarily share their GPS coordinates or type a landmark. And in critical emergencies, they have direct 1-tap access to 112 and 1033 with on-screen GPS coordinates ready to read out to the dispatcher."
    )

    # =========================================================================
    # SLIDE 4: KEY INNOVATION — THE "TWO-ATTEMPT" EMERGENCY RULE
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4)
    add_header(s4, "KEY INNOVATION • FRAUD PREVENTION & ESCALATION", "The 'Two-Attempt' Emergency Escalation Protocol", "04")
    
    # Left Half: How It Works Flow (Width: 5.666)
    left_w = Inches(5.666)
    left_card = add_card(s4, Inches(0.8), Inches(1.55), left_w, Inches(5.35), border_color=CARD_BORDER, bg_color=CARD_BG)
    
    add_badge(s4, Inches(1.1), Inches(1.8), Inches(2.8), Inches(0.34),
              "OPERATIONAL WORKFLOW", CARD_INNER, ACCENT_AMBER)
    
    tb_l = s4.shapes.add_textbox(Inches(1.1), Inches(2.25), left_w - Inches(0.6), Inches(4.4))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    p = tf_l.paragraphs[0]
    p.text = "How the Two-Attempt Rule Works:"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.font.name = "Segoe UI"
    
    steps = [
        ("Step 1: Emergency Mode Trigger", "Finder switches scan page to Emergency Mode (e.g. road crash, severe medical distress)."),
        ("Step 2: Owner Priority Call (Locked Family)", "Owner masked calling button unlocks immediately. Family emergency contacts remain strictly LOCKED to avoid false alarms or accidental panics."),
        ("Step 3: Server-Verified Escalation", "Only after 2 server-verified unanswered calls to the owner does the 'Call Masked Family Contact' button unlock.")
    ]
    
    for title, desc in steps:
        p_t = tf_l.add_paragraph()
        p_t.space_before = Pt(12)
        p_t.text = title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = ACCENT_CYAN
        
        p_d = tf_l.add_paragraph()
        p_d.space_before = Pt(2)
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED

    # Right Half: Anti-Bypass Security (Width: 5.666)
    right_w = Inches(5.666)
    right_card = add_card(s4, Inches(6.866), Inches(1.55), right_w, Inches(5.35), border_color=CARD_BORDER, bg_color=CARD_BG)
    
    add_badge(s4, Inches(7.166), Inches(1.8), Inches(3.2), Inches(0.34),
              "CRYPTOGRAPHIC DEFENSE", CARD_INNER, ACCENT_RED)
    
    tb_r = s4.shapes.add_textbox(Inches(7.166), Inches(2.25), right_w - Inches(0.6), Inches(4.4))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    p = tf_r.paragraphs[0]
    p.text = "Anti-Bypass Security Matrix:"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.font.name = "Segoe UI"
    
    protections = [
        ("Server-Enforced Telephony Callbacks", "Escalation state is not controlled by client clicks. Virtual PBX webhooks transmit signed call outcomes ('no-answer', 'busy', 'duration') directly to the backend."),
        ("Session Timers & Rate-Limited Tokens", "Backend tracks authenticated scan sessions with bounded expiration windows. Rapid-fire redialing or spoofed clicks are rejected by server middleware."),
        ("Tamper-Proof Client Integrity", "Refreshing browser tabs, modifying LocalStorage, or manipulating DOM elements cannot bypass the lock. The API serves family contact tokens only upon verified escalation.")
    ]
    
    for title, desc in protections:
        p_t = tf_r.add_paragraph()
        p_t.space_before = Pt(12)
        p_t.text = title
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = ACCENT_GREEN
        
        p_d = tf_r.add_paragraph()
        p_d.space_before = Pt(2)
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED
        
    set_notes(s4,
        "This slide highlights our core innovation: The 'Two-Attempt' Emergency Rule. "
        "The biggest risk in emergency contact systems is false alarms: you don't want a curious passerby immediately calling someone's mother or spouse at 2 AM. "
        "When emergency mode is triggered, only the owner can be called first. Only after 2 consecutive server-verified unanswered calls does the system safely escalate and unlock the family contact. "
        "Crucially, this is enforced entirely on the backend via telephony webhooks—a user cannot inspect elements or spoof clicks to bypass this rule."
    )

    # =========================================================================
    # SLIDE 5: SYSTEM ARCHITECTURE & TECH STACK
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5)
    add_header(s5, "SYSTEM ARCHITECTURE • TECHNICAL BLUEPRINT", "Engineered for Resilience, Low-Bandwidth & Security", "05")
    
    layers = [
        {
            "num": "01",
            "name": "Frontend & Edge",
            "tech": "Next.js 15 (TypeScript) + Tailwind CSS",
            "col": ACCENT_CYAN,
            "items": [
                "Mobile-first, PWA-ready architecture",
                "Sub-180KB initial payload for 2G/3G connectivity",
                "Instant English/Hindi bilingual toggle system",
                "Responsive on low-end smartphones without app download"
            ]
        },
        {
            "num": "02",
            "name": "Backend & Task Queue",
            "tech": "Node.js Modular APIs + Durable Queue",
            "col": ACCENT_GREEN,
            "items": [
                "Stateless RESTful APIs with strict validation",
                "Durable background queue for bounded retries",
                "Webhook ingestion engine for telephony callbacks",
                "Deterministic state machine for emergency escalation"
            ]
        },
        {
            "num": "03",
            "name": "Database & Security",
            "tech": "PostgreSQL + Cryptographic Salt/Hash",
            "col": ACCENT_BLUE,
            "items": [
                "Relational integrity for items, tags, and contacts",
                "Strict SHA-256 token hashing for all public QR codes",
                "Field-level PII masking (phone numbers never exposed)",
                "Append-only incident audit logging for accountability"
            ]
        },
        {
            "num": "04",
            "name": "Telephony & Geolocation",
            "tech": "Cloud Telephony Bridge + Leaflet Maps",
            "col": ACCENT_AMBER,
            "items": [
                "Masked voice & SMS telephony relay (Twilio/Exotel)",
                "Browser Geolocation API + Leaflet OSM fallback",
                "Direct URL dispatch to 112 & 1033 public emergency lines",
                "Dynamic SVG/PNG vector QR code generation on the fly"
            ]
        }
    ]
    
    col_w = Inches(2.72)
    col_gap = Inches(0.28)
    for i, lyr in enumerate(layers):
        c_left = Inches(0.8 + i * (2.72 + 0.28))
        c_top = Inches(1.55)
        c_h = Inches(5.35)
        
        add_card(s5, c_left, c_top, col_w, c_h, border_color=CARD_BORDER, bg_color=CARD_BG)
        
        # Pill
        add_badge(s5, c_left + Inches(0.2), c_top + Inches(0.3), Inches(2.32), Inches(0.32),
                  f"LAYER {lyr['num']} • {lyr['name'].upper()}", CARD_INNER, lyr["col"])
        
        tb = s5.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.75), Inches(2.32), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = lyr["tech"]
        p.font.size = Pt(13.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.font.name = "Segoe UI"
        
        p_div = tf.add_paragraph()
        p_div.space_before = Pt(4)
        p_div.text = "CORE CAPABILITIES:"
        p_div.font.size = Pt(9.5)
        p_div.font.bold = True
        p_div.font.color.rgb = lyr["col"]
        
        for item in lyr["items"]:
            p_it = tf.add_paragraph()
            p_it.space_before = Pt(6)
            p_it.text = f"• {item}"
            p_it.font.size = Pt(10.5)
            p_it.font.color.rgb = TEXT_MUTED
            p_it.font.name = "Segoe UI"
            
    set_notes(s5,
        "Here is our production-ready tech stack. We chose Next.js with TypeScript and Tailwind CSS to guarantee sub-second load times even on weak 2G or 3G highway networks. "
        "On the backend, Node.js APIs connect to a durable background job queue to ensure webhook retries never drop a call state. "
        "Our database is PostgreSQL with token hashing and PII masking, meaning even if someone intercepts database dumps, phone numbers remain protected. "
        "Finally, our telephony bridge allows masked voice calls and SMS dispatch alongside Leaflet maps."
    )

    # =========================================================================
    # SLIDE 6: ABUSE CONTROLS & SAFETY GUARDRAILS
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6)
    add_header(s6, "SAFETY GUARDRAILS • FRAUD & COST MITIGATION", "Built for Real-World Chaos, Fraud & Privacy Defense", "06")
    
    guardrails = [
        {
            "tag": "RATE LIMITING & QUOTAS",
            "col": ACCENT_CYAN,
            "title": "Anti-Spam Scan & Call Throttling",
            "body": "Maximum 3 ordinary scan alerts per 5 minutes per IP/session. Strict daily SMS & call caps prevent telephony cost spikes and malicious harassment campaigns."
        },
        {
            "tag": "EMERGENCY CHANNELING",
            "col": ACCENT_RED,
            "title": "Distinct Emergency Priority Routing",
            "body": "Verified emergency mode reports bypass ordinary spam rate limits safely via signed tokens, ensuring genuine highway accident alerts are never throttled."
        },
        {
            "tag": "CONSENT & REVOCATION",
            "col": ACCENT_GREEN,
            "title": "Two-Way Opt-In & Instant Blocking",
            "body": "Emergency contacts must explicitly accept digital invitations before receiving alerts. Any contact can withdraw consent or block specific tags at any time."
        },
        {
            "tag": "SYSTEM INTEGRITY",
            "col": ACCENT_AMBER,
            "title": "Honest UI & Zero False Promises",
            "body": "Displays real, transparent delivery statuses (Queued, Sent, Delivered, Answered). PingShield never falsely claims automated ambulance dispatch—it coordinates real people."
        }
    ]
    
    for i, g in enumerate(guardrails):
        row = i // 2
        col = i % 2
        
        left = Inches(0.8 + col * (5.666 + 0.4))
        top = Inches(1.55 + row * (2.55 + 0.3))
        w = Inches(5.666)
        h = Inches(2.55)
        
        add_card(s6, left, top, w, h, border_color=CARD_BORDER, bg_color=CARD_BG)
        add_badge(s6, left + Inches(0.3), top + Inches(0.25), Inches(3.2), Inches(0.32),
                  g["tag"], CARD_INNER, g["col"])
        
        tb = s6.shapes.add_textbox(left + Inches(0.3), top + Inches(0.7), w - Inches(0.6), h - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = g["title"]
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.font.name = "Segoe UI"
        
        p_body = tf.add_paragraph()
        p_body.space_before = Pt(8)
        p_body.text = g["body"]
        p_body.font.size = Pt(11.5)
        p_body.font.color.rgb = TEXT_MUTED
        p_body.font.name = "Segoe UI"
        
    set_notes(s6,
        "Every safety system must consider abuse vectors. PingShield implements 4 layers of guardrails: "
        "First, rate limiting: a troll cannot repeatedly scan a bag to trigger hundreds of SMS alerts—it is capped at 3 per 5 minutes with daily quotas. "
        "Second, genuine emergency calls bypass this cap safely with priority queues. "
        "Third, emergency contacts must explicitly accept the invite; they can revoke consent or block a tag with one tap. "
        "And fourth: Zero False Promises. We don't claim to magically dispatch ambulances. We provide transparent UI delivery status (Queued, Sent, Delivered) to empower real bystanders."
    )

    # =========================================================================
    # SLIDE 7: USER JOURNEYS (OWNER VS. FINDER)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7)
    add_header(s7, "USER JOURNEYS • ASYMMETRIC USER EXPERIENCE", "Seamless Two-Sided Experience for Owners & Finders", "07")
    
    # Top Lane: Owner Journey
    lane_w = Inches(11.733)
    lane_h = Inches(2.45)
    
    add_card(s7, Inches(0.8), Inches(1.55), lane_w, lane_h, border_color=CARD_BORDER, bg_color=CARD_BG)
    add_badge(s7, Inches(1.1), Inches(1.75), Inches(3.5), Inches(0.32),
              "OWNER DASHBOARD JOURNEY (2 MINUTES)", CARD_INNER, ACCENT_GREEN)
    
    owner_steps = [
        ("1. Register Item", "Register asset details (bag, car, keys) & generate unique cryptographic QR tag."),
        ("2. Add Contacts", "Add verified primary & secondary emergency family contacts with consent opt-in."),
        ("3. Print & Attach", "Download high-contrast printable QR badge or weatherproof sticker for your asset."),
        ("4. Track & Recover", "Monitor incident timeline with GPS pins, chat anonymously & mark item recovered.")
    ]
    
    step_w = Inches(2.65)
    for i, (title, desc) in enumerate(owner_steps):
        s_left = Inches(1.1 + i * 2.85)
        tb = s7.shapes.add_textbox(s_left, Inches(2.15), step_w, Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        
        p_d = tf.add_paragraph()
        p_d.space_before = Pt(3)
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED

    # Bottom Lane: Finder Rapid Experience
    add_card(s7, Inches(0.8), Inches(4.35), lane_w, lane_h, border_color=CARD_BORDER, bg_color=CARD_BG)
    add_badge(s7, Inches(1.1), Inches(4.55), Inches(3.8), Inches(0.32),
              "FINDER RAPID EXPERIENCE (<15 SECONDS)", CARD_INNER, ACCENT_CYAN)
    
    finder_steps = [
        ("1. Scan QR Tag", "Finder scans QR with standard camera app. Opens instant web portal without app install."),
        ("2. Select Language", "Instant UI toggle between English and Hindi for high accessibility across India."),
        ("3. Masked Contact", "One-tap GPS sharing + private masked phone call or anonymous messaging relay."),
        ("4. Emergency Mode", "If road crash: Instant 112/1033 hotlines or 2-Attempt verified family escalation.")
    ]
    
    for i, (title, desc) in enumerate(finder_steps):
        s_left = Inches(1.1 + i * 2.85)
        tb = s7.shapes.add_textbox(s_left, Inches(4.95), step_w, Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        
        p_d = tf.add_paragraph()
        p_d.space_before = Pt(3)
        p_d.text = desc
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED
        
    set_notes(s7,
        "Here are the two journeys side-by-side. "
        "The owner takes just 2 minutes to register an item, attach verified emergency contacts, and download a printable QR tag. "
        "On the other side, the finder has an astonishingly fast sub-15-second experience: Point camera, open page in Hindi or English, tap to call or message privately, or trigger emergency mode. Zero downloads, zero friction."
    )

    # =========================================================================
    # SLIDE 8: FUTURE SCOPE & IMPACT
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8)
    add_header(s8, "FUTURE SCOPE & IMPACT • HORIZONS & ROADMAP", "Scaling from Personal Belongings to National Safety", "08")
    
    pillars = [
        {
            "badge": "INTEGRATION HORIZON",
            "col": ACCENT_CYAN,
            "title": "Seamless PingME Integration",
            "points": [
                "Modular REST/GraphQL API boundaries for direct drop-in integration into PingME.",
                "Enables PingME users to manage physical tags directly inside their existing app.",
                "Unified push notifications and emergency escalation alerts.",
                "Turns PingME into an all-in-one digital identity and physical safety platform."
            ]
        },
        {
            "badge": "HARDWARE EXPANSION",
            "col": ACCENT_PURPLE,
            "title": "Smart Hardware & Decals",
            "points": [
                "NFC + Dynamic QR hybrid tags for tap-to-reach interactions.",
                "Industrial-grade waterproof, UV-resistant vinyl vehicle decals.",
                "Tamper-evident holographic stickers for high-value laptops and luggage.",
                "Low-cost manufacturing model suitable for mass distribution."
            ]
        },
        {
            "badge": "SOCIAL IMPACT",
            "col": ACCENT_GREEN,
            "title": "Community Highway Safety",
            "points": [
                "Drastically speeds up Golden Hour notification during Indian highway crashes.",
                "Ensures rapid reporting to NHAI 1033 & Police 112 with exact live GPS pins.",
                "Protects women and travelers by eliminating phone number leakage on public luggage.",
                "Fosters a culture of proactive, privacy-safe Good Samaritan assistance."
            ]
        }
    ]
    
    for i, pil in enumerate(pillars):
        c_left = Inches(0.8 + i * (3.64 + 0.4))
        c_top = Inches(1.55)
        c_h = Inches(5.35)
        
        add_card(s8, c_left, c_top, card_w, c_h, border_color=CARD_BORDER, bg_color=CARD_BG)
        add_badge(s8, c_left + Inches(0.3), c_top + Inches(0.35), Inches(3.04), Inches(0.36),
                  pil["badge"], CARD_INNER, pil["col"])
        
        tb = s8.shapes.add_textbox(c_left + Inches(0.3), c_top + Inches(0.85), Inches(3.04), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = pil["title"]
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.font.name = "Segoe UI"
        
        for pt in pil["points"]:
            p_pt = tf.add_paragraph()
            p_pt.space_before = Pt(8)
            p_pt.text = f"•  {pt}"
            p_pt.font.size = Pt(11)
            p_pt.font.color.rgb = TEXT_MUTED
            p_pt.font.name = "Segoe UI"
            
    set_notes(s8,
        "Looking forward, PingShield is designed for massive scale. "
        "First, seamless integration with PingME: PingME users can manage all physical safety tags without switching apps. "
        "Second, smart hardware: Expanding into NFC + QR hybrid metallic tags and UV-resistant weatherproof vehicle decals. "
        "Third, national community impact: Accelerating golden-hour family notifications on Indian highways while permanently eliminating privacy risks for travelers."
    )

    # =========================================================================
    # SLIDE 9: THANK YOU / Q&A
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9)
    
    # Top Badge
    add_badge(s9, Inches(0.8), Inches(0.9), Inches(3.2), Inches(0.38),
              "PROJECT EVALUATION & CLOSING", CARD_INNER, ACCENT_GREEN)
    
    # Heading
    tb = s9.shapes.add_textbox(Inches(0.8), Inches(1.4), Inches(11.7), Inches(1.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Thank You! Questions & Answers"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.font.name = "Segoe UI"
    
    tb_sub = s9.shapes.add_textbox(Inches(0.8), Inches(2.45), Inches(11.7), Inches(0.5))
    tf_sub = tb_sub.text_frame
    p_s = tf_sub.paragraphs[0]
    p_s.text = "PingShield: Bridging Lost Belongings & Life-Saving Emergency Response with Absolute Privacy"
    p_s.font.size = Pt(16)
    p_s.font.color.rgb = ACCENT_CYAN
    p_s.font.name = "Segoe UI"

    # Two Cards Side-by-Side
    # Left Card: Team
    c_left = add_card(s9, Inches(0.8), Inches(3.2), Inches(5.666), Inches(3.7), border_color=CARD_BORDER, bg_color=CARD_BG)
    add_badge(s9, Inches(1.1), Inches(3.45), Inches(2.5), Inches(0.34),
              "TEAM PEAKY BLINDERS", CARD_INNER, ACCENT_CYAN)
    
    tb_l = s9.shapes.add_textbox(Inches(1.1), Inches(3.9), Inches(5.0), Inches(2.8))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    
    p = tf_l.paragraphs[0]
    p.text = "Parth Sharma (Team Leader)"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    
    p2 = tf_l.add_paragraph()
    p2.space_before = Pt(4)
    p2.text = "Punjab Engineering College (PEC), Chandigarh"
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_AMBER
    
    p3 = tf_l.add_paragraph()
    p3.space_before = Pt(10)
    p3.text = "Focus: Cloud Telephony Relay, Zero-App Web Architecture, Highway Safety & Emergency Protocols."
    p3.font.size = Pt(12)
    p3.font.color.rgb = TEXT_MUTED

    # Right Card: Demo Callout
    c_right = add_card(s9, Inches(6.866), Inches(3.2), Inches(5.666), Inches(3.7), border_color=CARD_BORDER_ACCENT, bg_color=CARD_BG)
    add_badge(s9, Inches(7.166), Inches(3.45), Inches(3.2), Inches(0.34),
              "LIVE DEMO READY RIGHT NOW", CARD_INNER, ACCENT_GREEN)
    
    tb_r = s9.shapes.add_textbox(Inches(7.166), Inches(3.9), Inches(5.0), Inches(2.8))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    p = tf_r.paragraphs[0]
    p.text = "Interactive Local Simulation Mode"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    
    p2 = tf_r.add_paragraph()
    p2.space_before = Pt(6)
    p2.text = "• Credential-Free simulation of masked calls & webhooks\n• Scan dynamic QR codes from any smartphone camera\n• Experience the Two-Attempt Emergency Rule live\n• Bilingual English/Hindi toggle demonstration"
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_MUTED
    
    p3 = tf_r.add_paragraph()
    p3.space_before = Pt(12)
    p3.text = "👉 Ready for live jury testing and walkthrough!"
    p3.font.size = Pt(13)
    p3.font.bold = True
    p3.font.color.rgb = ACCENT_CYAN

    set_notes(s9,
        "Thank you so much! We are Team PEAKY BLINDERS from Punjab Engineering College, Chandigarh. "
        "We have a live, working, credential-free simulation mode running locally right now where you can test the QR scanning, the bilingual UI, the location sharing, and the Two-Attempt Emergency Rule. "
        "We are now open for your questions and feedback!"
    )

    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    out_file = r"e:\ANTIGRAVITY WEBSITE\PingShield_Pitch_Deck.pptx"
    build_presentation(out_file)
