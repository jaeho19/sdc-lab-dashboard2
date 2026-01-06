"""
Research Notes 페이지 UI 테스트
"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "http://localhost:3003"

def test_research_notes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()

        # 콘솔 로그 캡처
        console_logs = []
        def on_console(msg):
            if msg.type in ['error', 'warning']:
                console_logs.append(f"[{msg.type}] {msg.text}")
        page.on('console', on_console)

        print("1. 홈페이지로 이동...")
        page.goto(f'{BASE_URL}/')
        page.wait_for_load_state('networkidle')

        # 로그인 필요한지 확인
        if 'login' in page.url:
            print("2. 로그인 진행...")
            page.locator('input[type="email"]').fill('jaeho19@uos.ac.kr')
            page.locator('input[type="password"]').fill('jaeho1234!')
            page.locator('button[type="submit"]').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print(f"   로그인 후 URL: {page.url}")

        print("3. Research Notes 페이지로 이동...")
        page.goto(f'{BASE_URL}/research-notes')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        page.screenshot(path='screenshots/research_notes_page.png')
        print(f"   URL: {page.url}")

        # 페이지 확인
        page_title = page.locator('h1').first.text_content() if page.locator('h1').count() > 0 else 'N/A'
        print(f"   페이지 제목: {page_title}")

        # 새 노트 작성 버튼 찾기
        print("4. 새 노트 작성 버튼 찾기...")
        new_note_btn = page.locator('button:has-text("새 노트")')

        if new_note_btn.count() > 0:
            print("   버튼 발견! 클릭...")
            new_note_btn.first.click()
            time.sleep(1)
            page.screenshot(path='screenshots/note_form_open.png')

            # 다이얼로그가 열렸는지 확인
            dialog = page.locator('[role="dialog"]')
            if dialog.count() > 0:
                print("5. 폼 다이얼로그 열림 확인!")

                # 프로젝트 선택
                project_select = page.locator('button:has-text("프로젝트 선택")')
                if project_select.count() > 0:
                    project_select.first.click()
                    time.sleep(0.5)
                    # 첫 번째 프로젝트 선택
                    first_option = page.locator('[role="option"]').first
                    if first_option.count() > 0:
                        first_option.click()
                        time.sleep(0.3)

                # 연구 단계 선택 (이미 기본값 있음)

                # 제목 입력
                print("6. 폼 데이터 입력...")
                title_input = page.locator('input#title')
                if title_input.is_visible():
                    title_input.fill('테스트 연구노트 - ' + time.strftime('%H:%M:%S'))

                # 내용 입력
                content_area = page.locator('textarea#content')
                if content_area.is_visible():
                    content_area.fill('## 테스트 내용\n\n- 항목 1\n- 항목 2\n- 항목 3')

                page.screenshot(path='screenshots/note_form_filled.png')

                # 저장 버튼 클릭
                print("7. 저장 버튼 클릭...")
                save_btn = page.locator('button[type="submit"]:has-text("저장")')
                if save_btn.count() > 0 and save_btn.is_enabled():
                    save_btn.click()
                    time.sleep(3)
                    page.screenshot(path='screenshots/after_save.png')

                    # 에러 메시지 확인
                    error_el = page.locator('.bg-red-50, .text-red-600')
                    if error_el.count() > 0:
                        error_text = error_el.first.text_content()
                        print(f"   [오류] {error_text}")
                    else:
                        # 다이얼로그가 닫혔는지 확인
                        if dialog.count() == 0 or not dialog.is_visible():
                            print("   저장 성공! (다이얼로그 닫힘)")
                        else:
                            print("   다이얼로그가 아직 열려있음")
                else:
                    print("   저장 버튼이 비활성화되어 있거나 찾을 수 없음")
            else:
                print("   [오류] 다이얼로그가 열리지 않음")
        else:
            print("   [오류] 새 노트 작성 버튼을 찾을 수 없음")
            # 버튼 목록 출력
            buttons = page.locator('button').all()
            print(f"   페이지의 버튼들 ({len(buttons)}개):")
            for btn in buttons[:10]:
                try:
                    print(f"     - {btn.text_content()[:50]}")
                except:
                    pass

        # 최종 스크린샷
        page.screenshot(path='screenshots/final_state.png', full_page=True)

        # 콘솔 에러 출력
        if console_logs:
            print("\n[콘솔 에러/경고]")
            for log in console_logs[:10]:
                print(f"  {log[:200]}")

        browser.close()
        print("\n테스트 완료! 스크린샷은 screenshots/ 폴더에 저장되었습니다.")

if __name__ == '__main__':
    import os
    os.makedirs('screenshots', exist_ok=True)
    test_research_notes()
