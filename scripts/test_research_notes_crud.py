"""Research Notes CRUD 테스트 스크립트"""
from playwright.sync_api import sync_playwright
import time
import os

# 테스트 계정 정보
TEST_EMAIL = "jaeho@uos.ac.kr"
TEST_PASSWORD = "jaeho0401!"
BASE_URL = "http://localhost:3000"

# screenshots 폴더 생성
os.makedirs("screenshots", exist_ok=True)

def wait_for_server_ready(page, max_retries=10):
    """서버가 완전히 준비될 때까지 대기"""
    for i in range(max_retries):
        try:
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle", timeout=10000)
            # 에러 페이지가 아닌지 확인
            if "__next_error__" not in page.content():
                return True
        except Exception as e:
            pass
        print(f"   서버 대기 중... ({i+1}/{max_retries})")
        time.sleep(3)
    return False

def test_research_notes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("=" * 60)
        print("Research Notes CRUD 테스트 시작")
        print("=" * 60)

        # 서버 준비 대기
        print("\n[0/5] 서버 준비 대기...")
        if not wait_for_server_ready(page):
            print("   서버가 준비되지 않았습니다.")
            browser.close()
            return

        # 1. 로그인
        print("\n[1/5] 로그인 중...")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        time.sleep(2)  # React hydration 대기
        page.screenshot(path="screenshots/00_login_page.png")
        print(f"   현재 URL: {page.url}")

        # 로그인 폼 확인 (wait_for_selector 사용)
        try:
            page.wait_for_selector('#email', timeout=15000)
            email_input = page.locator('#email')
        except Exception as e:
            print(f"   이메일 입력 필드를 찾을 수 없습니다: {e}")
            page.screenshot(path="screenshots/00_error_no_email.png")
            # 페이지 HTML 출력
            print("   페이지 내용 일부:")
            content = page.content()
            print(content[:1000])
            browser.close()
            return

        # 로그인 폼 입력
        email_input.fill(TEST_EMAIL)
        page.locator('#password').fill(TEST_PASSWORD)
        page.screenshot(path="screenshots/01_login_filled.png")
        print("   로그인 정보 입력 완료")

        # 로그인 버튼 클릭
        page.click('button[type="submit"]')

        # 대시보드로 이동 대기
        try:
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("   로그인 성공!")
            page.screenshot(path="screenshots/02_login_success.png")
        except Exception as e:
            print(f"   로그인 실패 또는 리다이렉트 대기 중: {e}")
            print(f"   현재 URL: {page.url}")
            page.screenshot(path="screenshots/02_login_error.png")
            # 에러 메시지 확인
            error_msg = page.locator('.text-red-600')
            if error_msg.is_visible():
                print(f"   에러 메시지: {error_msg.inner_text()}")
            browser.close()
            return

        # 2. Research 페이지로 이동
        print("\n[2/5] Research 페이지로 이동...")
        page.goto(f"{BASE_URL}/research")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        page.screenshot(path="screenshots/03_research_list.png")
        print(f"   현재 URL: {page.url}")

        # 프로젝트 링크 찾기 (테이블 행 또는 카드)
        project_links = page.locator('a[href^="/research/"]').all()

        if len(project_links) == 0:
            # 클릭 가능한 프로젝트 카드 찾기
            project_cards = page.locator('tr.cursor-pointer, div.cursor-pointer').all()
            if len(project_cards) == 0:
                print("   프로젝트가 없습니다.")
                # 테이블 행 찾기 시도
                table_rows = page.locator('tbody tr').all()
                if len(table_rows) > 0:
                    print(f"   테이블 행 {len(table_rows)}개 발견, 첫 번째 행 클릭")
                    table_rows[0].click()
                else:
                    print("   테스트 종료.")
                    browser.close()
                    return
            else:
                print(f"   {len(project_cards)}개의 프로젝트 카드 발견")
                project_cards[0].click()
        else:
            print(f"   {len(project_links)}개의 프로젝트 링크 발견")
            project_links[0].click()

        page.wait_for_load_state("networkidle")
        time.sleep(3)  # 데이터 로딩 대기
        page.screenshot(path="screenshots/04_project_detail.png")
        print(f"   현재 URL: {page.url}")
        print("   프로젝트 상세 페이지 로드 완료")

        # 3. 연구노트 섹션 확인
        print("\n[3/5] 연구노트 섹션 확인...")

        # 스크롤 다운하여 연구노트 섹션 확인
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
        page.screenshot(path="screenshots/05_scrolled_down.png", full_page=True)

        # 연구노트 섹션 찾기
        notes_section = page.locator('text=연구노트').first
        if notes_section.is_visible():
            print("   연구노트 섹션 발견!")
            notes_section.scroll_into_view_if_needed()
            time.sleep(1)
            page.screenshot(path="screenshots/06_notes_section.png")
        else:
            print("   연구노트 섹션을 찾을 수 없습니다.")

        # 새 노트 작성 버튼 찾기
        new_note_button = page.locator('button:has-text("새 노트 작성")').first

        if new_note_button.is_visible():
            print("   '새 노트 작성' 버튼 발견!")

            # 4. 새 노트 작성 테스트
            print("\n[4/5] 새 노트 작성 테스트...")
            new_note_button.click()
            time.sleep(1)
            page.screenshot(path="screenshots/07_note_form_dialog.png")

            # Dialog 대기
            dialog = page.locator('[role="dialog"]')
            if dialog.is_visible():
                print("   노트 작성 다이얼로그 열림")

                # 제목 입력
                title_input = dialog.locator('input').first
                if title_input.is_visible():
                    title_input.fill("테스트 연구노트 - Playwright 자동화")
                    print("   제목 입력 완료")

                # 단계 선택 (Select)
                stage_trigger = dialog.locator('button[role="combobox"]').first
                if stage_trigger.is_visible():
                    stage_trigger.click()
                    time.sleep(0.5)
                    # 첫 번째 옵션 선택
                    page.locator('[role="option"]').first.click()
                    print("   단계 선택 완료")
                    time.sleep(0.5)

                # 내용 입력 (textarea)
                content_area = dialog.locator('textarea').first
                if content_area.is_visible():
                    content_area.fill("이것은 Playwright를 사용한 자동화 테스트입니다.\n\n## 테스트 내용\n- 노트 생성 테스트\n- CRUD 기능 검증")
                    print("   내용 입력 완료")

                page.screenshot(path="screenshots/08_note_form_filled.png")

                # 저장 버튼 클릭
                save_button = dialog.locator('button:has-text("저장")').first
                if save_button.is_visible():
                    save_button.click()
                    print("   저장 버튼 클릭")
                    time.sleep(3)
                    page.screenshot(path="screenshots/09_after_save.png")

                    # 성공 메시지 또는 노트 추가 확인
                    if page.locator('[role="dialog"]').is_hidden():
                        print("   노트 저장 성공 (다이얼로그 닫힘)")
                    else:
                        print("   다이얼로그가 아직 열려있음 - 에러 확인 필요")
                        page.screenshot(path="screenshots/09_save_error.png")
            else:
                print("   다이얼로그가 열리지 않았습니다.")

        else:
            print("   '새 노트 작성' 버튼을 찾을 수 없습니다.")
            # 권한이 없거나 다른 이유
            page.screenshot(path="screenshots/07_no_new_note_button.png")

        # 5. 현재 상태 확인
        print("\n[5/5] 최종 상태 확인...")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # 페이지 전체 스크린샷
        page.screenshot(path="screenshots/10_final_state.png", full_page=True)

        # 기존 노트 확인
        note_cards = page.locator('[class*="border rounded"]').all()
        print(f"   페이지의 카드 요소 수: {len(note_cards)}")

        # 연구노트 섹션 내 노트 개수 확인
        notes_badge = page.locator('text=연구노트').locator('..').locator('span')
        if notes_badge.count() > 0:
            for i in range(notes_badge.count()):
                badge = notes_badge.nth(i)
                if badge.is_visible():
                    try:
                        text = badge.inner_text()
                        if text.isdigit():
                            print(f"   연구노트 개수: {text}")
                            break
                    except:
                        pass

        print("\n" + "=" * 60)
        print("테스트 완료!")
        print("스크린샷은 screenshots/ 폴더에 저장되었습니다.")
        print("=" * 60)

        browser.close()

if __name__ == "__main__":
    test_research_notes()
