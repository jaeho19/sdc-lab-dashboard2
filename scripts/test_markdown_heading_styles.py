"""
Research Notes 마크다운 헤딩 스타일 테스트
- 로그인 후 research-notes 페이지 접속
- 마크다운 프리뷰에서 헤딩 스타일 확인
"""

from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# 테스트 계정
TEST_EMAIL = "jaeho.dev19@gmail.com"
TEST_PASSWORD = "test1234"

def test_markdown_heading_styles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # 콘솔 로그 캡처
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[ERROR] {err}"))

        print("1. 로그인 페이지로 이동...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOT_DIR}/00_login_page.png", full_page=True)

        # 콘솔 에러 출력
        if console_logs:
            print("   콘솔 로그:")
            for log in console_logs[-5:]:
                print(f"     {log[:100]}")
            console_logs.clear()

        # 로그인 수행
        print("2. 로그인 수행...")
        email_input = page.locator('input[type="email"]')
        password_input = page.locator('input[type="password"]')

        if email_input.count() > 0:
            email_input.fill(TEST_EMAIL)
            password_input.fill(TEST_PASSWORD)

            # 로그인 버튼 클릭
            submit_btn = page.locator('button[type="submit"]')
            if submit_btn.count() > 0:
                submit_btn.click()
                print("   로그인 버튼 클릭")
                page.wait_for_timeout(3000)
                page.wait_for_load_state("networkidle")
            else:
                print("   로그인 버튼 없음")
        else:
            print("   로그인 폼 없음 - 이미 로그인됨 또는 에러")

        current_url = page.url
        print(f"   현재 URL: {current_url}")
        page.screenshot(path=f"{SCREENSHOT_DIR}/01_after_login.png", full_page=True)

        # 콘솔 에러 출력
        if console_logs:
            print("   콘솔 로그:")
            for log in console_logs[-5:]:
                print(f"     {log[:100]}")
            console_logs.clear()

        print("\n3. Research Notes 페이지로 이동...")
        page.goto("http://localhost:3000/research-notes", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOT_DIR}/02_research_notes.png", full_page=True)

        current_url = page.url
        print(f"   현재 URL: {current_url}")

        # 콘솔 에러 출력
        if console_logs:
            print("   콘솔 로그:")
            for log in console_logs[-5:]:
                print(f"     {log[:100]}")
            console_logs.clear()

        # 404 확인
        if page.locator('text=404').count() > 0:
            print("   404 에러 - 페이지를 찾을 수 없음")

            # 대시보드로 이동 시도
            print("\n4. 대시보드로 이동 시도...")
            page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
            page.wait_for_timeout(2000)
            print(f"   현재 URL: {page.url}")
            page.screenshot(path=f"{SCREENSHOT_DIR}/03_dashboard.png", full_page=True)

            # 사이드바에서 research-notes 링크 찾기
            research_link = page.locator('a[href*="research-notes"], a:has-text("연구노트")')
            if research_link.count() > 0:
                print("   연구노트 링크 발견, 클릭...")
                research_link.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path=f"{SCREENSHOT_DIR}/04_via_sidebar.png", full_page=True)
            browser.close()
            return

        # 페이지 로딩 완료 확인
        print("\n4. 페이지 요소 확인...")

        # 새 노트 버튼 찾기
        new_note_btn = page.locator('button:has-text("새 노트")')
        if new_note_btn.count() > 0:
            print("   '새 노트 작성' 버튼 발견")
            new_note_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{SCREENSHOT_DIR}/05_new_note_modal.png", full_page=True)

            # 모달 내 에디터 찾기
            print("\n5. 노트 작성 모달에서 테스트...")

            # 제목 입력
            title_input = page.locator('input#title')
            if title_input.count() > 0:
                title_input.fill("마크다운 스타일 테스트")
                print("   제목 입력 완료")

            # 본문 입력 (textarea)
            content_textarea = page.locator('textarea#content')
            if content_textarea.count() > 0:
                test_markdown = """# Heading 1 - 가장 큰 제목

## Heading 2 - 두번째 제목

### Heading 3 - 세번째 제목

#### Heading 4 - 네번째 제목

일반 텍스트입니다.

**굵은 글씨** 와 *기울임* 테스트

- 목록 아이템 1
- 목록 아이템 2

1. 순서 목록 1
2. 순서 목록 2
"""
                content_textarea.fill(test_markdown)
                print("   마크다운 내용 입력 완료")
                page.screenshot(path=f"{SCREENSHOT_DIR}/06_markdown_input.png", full_page=True)

            # 미리보기 버튼 클릭
            preview_btn = page.locator('button:has-text("미리보기")')
            if preview_btn.count() > 0:
                preview_btn.click()
                page.wait_for_timeout(500)
                print("   미리보기 모드 전환")
                page.screenshot(path=f"{SCREENSHOT_DIR}/07_preview_mode.png", full_page=True)

                # 프리뷰 영역에서 헤딩 스타일 분석
                print("\n6. 프리뷰 영역 헤딩 스타일 분석...")

                # prose 컨테이너 찾기
                prose_container = page.locator('.prose')
                if prose_container.count() > 0:
                    print(f"   prose 컨테이너 발견: {prose_container.count()}개")

                    # 각 헤딩 분석
                    for tag in ["h1", "h2", "h3", "h4"]:
                        heading = prose_container.locator(tag).first
                        if heading.count() > 0:
                            try:
                                styles = heading.evaluate("""el => {
                                    const computed = window.getComputedStyle(el);
                                    return {
                                        fontSize: computed.fontSize,
                                        fontWeight: computed.fontWeight,
                                        color: computed.color,
                                        marginTop: computed.marginTop,
                                        marginBottom: computed.marginBottom,
                                        borderBottom: computed.borderBottom
                                    };
                                }""")
                                text = heading.text_content()[:30] if heading.text_content() else ""
                                print(f"\n   {tag.upper()}: '{text}'")
                                print(f"      fontSize: {styles['fontSize']}")
                                print(f"      fontWeight: {styles['fontWeight']}")
                                print(f"      color: {styles['color']}")
                                print(f"      marginTop/Bottom: {styles['marginTop']} / {styles['marginBottom']}")
                            except Exception as e:
                                print(f"   {tag.upper()}: 분석 실패 - {e}")
                        else:
                            print(f"   {tag.upper()}: prose 내 요소 없음")
                else:
                    print("   prose 컨테이너 없음")

                    # 일반 h1~h4 찾기
                    for tag in ["h1", "h2", "h3", "h4"]:
                        count = page.locator(tag).count()
                        if count > 0:
                            heading = page.locator(tag).first
                            try:
                                text = heading.text_content()[:30]
                                styles = heading.evaluate("""el => {
                                    const computed = window.getComputedStyle(el);
                                    return {
                                        fontSize: computed.fontSize,
                                        fontWeight: computed.fontWeight,
                                        color: computed.color
                                    };
                                }""")
                                print(f"   {tag.upper()}: '{text}' - {styles['fontSize']}, {styles['fontWeight']}")
                            except:
                                pass
                        else:
                            print(f"   {tag.upper()}: 요소 없음 (총 {count}개)")

        else:
            print("   '새 노트 작성' 버튼을 찾을 수 없음")

            # 기존 노트 확인
            note_cards = page.locator('article, [class*="card"]')
            print(f"   노트 카드: {note_cards.count()}개")

        print("\n테스트 완료!")
        browser.close()

if __name__ == "__main__":
    test_markdown_heading_styles()
