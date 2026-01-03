"""Create SDC Lab Dashboard User Guide PDF - Enhanced Research Section"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from PIL import Image as PILImage
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/guide-screenshots"
OUTPUT_PDF = "C:/dev/sdclab-dashboard/SDC_Lab_Dashboard_사용설명서.pdf"

# Register Korean font
pdfmetrics.registerFont(TTFont('Korean', "C:/Windows/Fonts/malgun.ttf"))
korean_font = 'Korean'

# Styles
styles = getSampleStyleSheet()

title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontName=korean_font,
    fontSize=28, spaceAfter=30, alignment=TA_CENTER, textColor=colors.HexColor('#1e293b'))

heading1_style = ParagraphStyle('CustomHeading1', parent=styles['Heading1'], fontName=korean_font,
    fontSize=18, spaceBefore=15, spaceAfter=10, textColor=colors.HexColor('#10b981'))

heading2_style = ParagraphStyle('CustomHeading2', parent=styles['Heading2'], fontName=korean_font,
    fontSize=13, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor('#334155'))

body_style = ParagraphStyle('CustomBody', parent=styles['Normal'], fontName=korean_font,
    fontSize=10, spaceBefore=4, spaceAfter=4, leading=14, alignment=TA_JUSTIFY)

bullet_style = ParagraphStyle('CustomBullet', parent=styles['Normal'], fontName=korean_font,
    fontSize=10, leftIndent=15, spaceBefore=2, spaceAfter=2, leading=13)

caption_style = ParagraphStyle('Caption', parent=styles['Normal'], fontName=korean_font,
    fontSize=9, alignment=TA_CENTER, textColor=colors.gray, spaceBefore=3, spaceAfter=10)

def get_image(filename, max_width=15*cm, max_height=9*cm):
    img_path = f"{SCREENSHOT_DIR}/{filename}"
    if not os.path.exists(img_path):
        return None
    with PILImage.open(img_path) as pil_img:
        orig_width, orig_height = pil_img.size
    aspect = orig_width / orig_height
    if max_width / aspect <= max_height:
        width, height = max_width, max_width / aspect
    else:
        width, height = max_height * aspect, max_height
    return Image(img_path, width=width, height=height)

def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    if page_num > 1:
        canvas.setFont(korean_font, 9)
        canvas.setFillColor(colors.gray)
        canvas.drawCentredString(A4[0] / 2, 1.5*cm, f"- {page_num - 1} -")

def create_pdf():
    doc = SimpleDocTemplate(OUTPUT_PDF, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
        topMargin=1.8*cm, bottomMargin=2.2*cm)
    story = []

    # ===== Title Page =====
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph("SDC Lab Dashboard", title_style))
    story.append(Paragraph("사용 설명서", ParagraphStyle('Subtitle', parent=styles['Title'],
        fontName=korean_font, fontSize=20, textColor=colors.HexColor('#64748b'))))
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph("서울시립대학교 Spatial Data & Community Lab", ParagraphStyle('Info',
        parent=styles['Normal'], fontName=korean_font, fontSize=12, alignment=TA_CENTER,
        textColor=colors.HexColor('#64748b'))))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph("2026년 1월", ParagraphStyle('Date', parent=styles['Normal'],
        fontName=korean_font, fontSize=11, alignment=TA_CENTER, textColor=colors.gray)))
    story.append(PageBreak())

    # ===== Introduction =====
    story.append(Paragraph("도입부", heading1_style))
    story.append(Paragraph(
        "안녕하세요. SDC Lab Dashboard 사용 가이드입니다. 이 대시보드는 연구실 전체의 연구 진행 상황, 일정, 멘토링 기록을 한 곳에서 관리하기 위한 시스템입니다.",
        body_style))
    story.append(Paragraph("이 설명서에서는 각 메뉴를 어떻게 사용하는지 하나씩 살펴보겠습니다.", body_style))
    story.append(Spacer(1, 0.5*cm))

    # ===== 1. Login & Dashboard =====
    sec1 = []
    sec1.append(Paragraph("1. 로그인 및 Dashboard 메인 화면", heading1_style))
    sec1.append(Paragraph("먼저 sdclab-dashboard.netlify.app에 접속합니다. 본인 계정으로 로그인하면 Dashboard 메인 화면이 나타납니다.", body_style))
    sec1.append(Spacer(1, 0.3*cm))
    img = get_image("01-login-page.png", 14*cm, 8*cm)
    if img: sec1.extend([img, Paragraph("로그인 화면", caption_style)])
    story.append(KeepTogether(sec1))

    story.append(Paragraph("로그인 후 Dashboard에서는 연구실 전체 현황을 한눈에 볼 수 있습니다:", body_style))
    for item in ["현재 활동 중인 연구원 수", "진행 중인 연구 프로젝트 수", "전체 평균 진행률", "이번 주 예정된 일정"]:
        story.append(Paragraph(f"• {item}", bullet_style))

    sec1b = []
    sec1b.append(Spacer(1, 0.3*cm))
    img = get_image("02-dashboard-main.png", 15*cm, 9*cm)
    if img: sec1b.extend([img, Paragraph("Dashboard 메인 화면", caption_style)])
    sec1b.append(Paragraph("여기서 직접 수정하는 것은 없습니다. 다른 메뉴에서 입력한 내용이 자동으로 반영됩니다.", body_style))
    story.append(KeepTogether(sec1b))
    story.append(PageBreak())

    # ===== 2. Members =====
    sec2 = []
    sec2.append(Paragraph("2. Members (구성원 정보)", heading1_style))
    sec2.append(Paragraph("좌측 메뉴에서 Members를 클릭합니다. 여기서 본인의 프로필 정보를 관리합니다.", body_style))
    sec2.append(Spacer(1, 0.3*cm))
    img = get_image("03-members-list.png", 15*cm, 9*cm)
    if img: sec2.extend([img, Paragraph("Members 목록 화면", caption_style)])
    story.append(KeepTogether(sec2))

    story.append(Paragraph("반드시 입력해야 할 항목:", heading2_style))
    for item in ["입학일: 석사 또는 박사 과정 시작 날짜", "졸업예정일: 예상 졸업 시점",
                 "관심분야: 본인의 연구 관심 키워드 3~5개", "이메일, 연락처: 최신 정보로 유지"]:
        story.append(Paragraph(f"• {item}", bullet_style))

    sec2b = []
    sec2b.append(Spacer(1, 0.3*cm))
    img = get_image("04-member-profile.png", 14*cm, 11*cm)
    if img: sec2b.extend([img, Paragraph("개인 프로필 상세 화면", caption_style)])
    sec2b.append(Paragraph("입실 후 1주 이내에 이 정보들을 모두 채워주세요.", body_style))
    story.append(KeepTogether(sec2b))
    story.append(PageBreak())

    # ===== 3. Research =====
    sec3 = []
    sec3.append(Paragraph("3. Research (연구 관리) - 가장 중요", heading1_style))
    sec3.append(Paragraph("Research 메뉴로 이동합니다. 이곳이 대시보드의 핵심입니다.", body_style))
    sec3.append(Spacer(1, 0.3*cm))
    img = get_image("05-research-list.png", 15*cm, 9*cm)
    if img: sec3.extend([img, Paragraph("Research 목록 화면 (새 프로젝트 버튼: 우측 상단)", caption_style)])
    story.append(KeepTogether(sec3))

    # 3-1 기본 정보
    sec3_1 = []
    sec3_1.append(Paragraph("3-1. 기본 정보 입력", heading2_style))
    sec3_1.append(Paragraph("프로젝트 상세 페이지 상단에서 다음 항목들을 설정합니다:", body_style))
    for item in ["제목: 논문 또는 프로젝트 제목", "타깃 저널: 투고 목표 저널",
                 "마감일: 투고 목표일", "상태: 준비중/진행중/검토중/완료"]:
        sec3_1.append(Paragraph(f"• {item}", bullet_style))
    sec3_1.append(Spacer(1, 0.3*cm))
    img = get_image("06-research-detail-header.png", 15*cm, 9*cm)
    if img: sec3_1.extend([img, Paragraph("프로젝트 상세 - 기본 정보 및 단계별 진행현황", caption_style)])
    story.append(KeepTogether(sec3_1))

    # 3-2 체크리스트
    sec3_2 = []
    sec3_2.append(Paragraph("3-2. 단계별 진행현황 (체크박스 방식)", heading2_style))
    sec3_2.append(Paragraph("각 단계(문헌조사, 방법론 설계, 데이터 수집, 분석, 초고 작성, 투고)별로 세부 체크리스트가 있습니다. 완료한 항목을 체크하면 진행률이 자동 계산됩니다.", body_style))
    sec3_2.append(Spacer(1, 0.3*cm))
    img = get_image("07-research-milestones.png", 15*cm, 9*cm)
    if img: sec3_2.extend([img, Paragraph("단계별 체크리스트 및 프로젝트 타임라인", caption_style)])
    story.append(KeepTogether(sec3_2))
    story.append(PageBreak())

    # 3-3 타임라인
    sec3_3 = []
    sec3_3.append(Paragraph("3-3. 프로젝트 타임라인", heading2_style))
    sec3_3.append(Paragraph("타임라인 섹션에서 각 단계별 목표 날짜를 설정합니다. 시각적으로 진행 상황을 확인할 수 있습니다.", body_style))
    sec3_3.append(Spacer(1, 0.3*cm))
    img = get_image("13-research-timeline.png", 15*cm, 9*cm)
    if img: sec3_3.extend([img, Paragraph("프로젝트 타임라인 (간트 차트 형태)", caption_style)])
    story.append(KeepTogether(sec3_3))

    # 3-4 흐름도
    sec3_4 = []
    sec3_4.append(Paragraph("3-4. 연구 흐름도 (매우 중요)", heading2_style))
    sec3_4.append(Paragraph("연구 흐름도는 Markdown 형식으로 작성합니다. 연구 질문 → 가설 → 방법론 → 분석 → 결과 해석의 전체 구조를 담습니다.", body_style))
    sec3_4.append(Paragraph("핵심 원칙: 멘토링 미팅 후 흐름도가 변경되면 반드시 업데이트해야 합니다.", body_style))
    sec3_4.append(Spacer(1, 0.3*cm))
    img = get_image("14-research-flowchart.png", 15*cm, 9*cm)
    if img: sec3_4.extend([img, Paragraph("연구 흐름도 (Markdown 렌더링)", caption_style)])
    story.append(KeepTogether(sec3_4))
    story.append(PageBreak())

    # 3-5 새 프로젝트
    sec3_5 = []
    sec3_5.append(Paragraph("3-5. 새 프로젝트 추가", heading2_style))
    sec3_5.append(Paragraph("새로운 연구를 시작할 때는 우측 상단의 '새 프로젝트' 버튼을 클릭합니다.", body_style))
    sec3_5.append(Spacer(1, 0.3*cm))
    img = get_image("09-research-new-project.png", 15*cm, 9*cm)
    if img: sec3_5.extend([img, Paragraph("새 프로젝트 생성 화면", caption_style)])
    story.append(KeepTogether(sec3_5))
    story.append(PageBreak())

    # ===== 4. Calendar =====
    sec4 = []
    sec4.append(Paragraph("4. Calendar (일정 관리)", heading1_style))
    sec4.append(Paragraph("Calendar 메뉴에서 연구원 본인의 일정을 직접 등록합니다.", body_style))
    sec4.append(Spacer(1, 0.3*cm))
    img = get_image("10-calendar.png", 15*cm, 9*cm)
    if img: sec4.extend([img, Paragraph("Calendar 화면", caption_style)])
    story.append(KeepTogether(sec4))

    story.append(Paragraph("등록해야 할 일정:", heading2_style))
    for item in ["학회: 발표 또는 참석 일정", "마감: 논문 투고, 과제 제출",
                 "휴가/출장: 반나절 이상 부재 시", "현장조사: 필드워크 일정"]:
        story.append(Paragraph(f"• {item}", bullet_style))
    story.append(Paragraph("일정이 확정되면 즉시 등록하세요.", body_style))
    story.append(PageBreak())

    # ===== 5. Mentoring =====
    sec5 = []
    sec5.append(Paragraph("5. Mentoring (멘토링 기록)", heading1_style))
    sec5.append(Paragraph("지도교수님과 미팅 후에는 반드시 이곳에 기록을 남겨야 합니다.", body_style))
    sec5.append(Spacer(1, 0.3*cm))
    img = get_image("11-mentoring-list.png", 15*cm, 9*cm)
    if img: sec5.extend([img, Paragraph("Mentoring 목록 화면", caption_style)])
    story.append(KeepTogether(sec5))

    story.append(Paragraph("기록 내용:", heading2_style))
    for item in ["상담 날짜: 미팅 일자", "논의 사항: 핵심 내용", "NEXT STEPS: 다음 과제"]:
        story.append(Paragraph(f"• {item}", bullet_style))
    story.append(Paragraph("미팅 후 24시간 이내에 기록하세요.", body_style))
    story.append(PageBreak())

    # ===== 6. AI Peer Review =====
    sec6 = []
    sec6.append(Paragraph("6. AI Peer Review", heading1_style))
    sec6.append(Paragraph("연구 설계가 타당한지 AI를 통해 검토받는 기능입니다.", body_style))
    sec6.append(Spacer(1, 0.3*cm))
    img = get_image("12-ai-peer-review.png", 15*cm, 9*cm)
    if img: sec6.extend([img, Paragraph("AI Peer Review 화면", caption_style)])
    story.append(KeepTogether(sec6))

    story.append(Paragraph("주의사항:", heading2_style))
    for item in ["API 비용 발생 - 남발 금지", "필요할 때만 사용 (새 연구 설계 후, 큰 방향 수정 후)"]:
        story.append(Paragraph(f"• {item}", bullet_style))
    story.append(PageBreak())

    # ===== Summary =====
    story.append(Paragraph("정리: 주간 업데이트 체크리스트", heading1_style))
    story.append(Paragraph("매주 랩미팅 전까지 다음을 확인하세요:", body_style))
    story.append(Spacer(1, 0.5*cm))

    table_data = [['메뉴', '확인 사항'],
        ['Members', '정보 변경사항 반영'],
        ['Research', '진행현황 체크박스 업데이트, 흐름도 최신화'],
        ['Calendar', '이번 주/다음 주 일정 등록'],
        ['Mentoring', '미팅 후 기록 완료 여부']]
    table = Table(table_data, colWidths=[4*cm, 12*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), korean_font),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(table)
    story.append(Spacer(1, 1*cm))

    story.append(Paragraph("마무리", heading1_style))
    story.append(Paragraph("SDC Lab Dashboard는 연구 진행 상황을 투명하게 공유하고, 멘토링 내용을 체계적으로 기록하기 위한 도구입니다.", body_style))
    story.append(Paragraph("특히 Research의 연구 흐름도와 Mentoring 기록은 연구의 맥락을 유지하는 데 핵심입니다.", body_style))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("질문이 있으면 랩 매니저나 교수님께 문의하세요.", body_style))

    doc.build(story, onFirstPage=lambda c, d: None, onLaterPages=add_page_number)
    print(f"PDF created: {OUTPUT_PDF}")

if __name__ == "__main__":
    create_pdf()
