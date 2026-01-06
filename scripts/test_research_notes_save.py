"""
Research Notes 저장 기능 테스트 스크립트
- 연구노트 저장 시 발생하는 오류를 확인합니다.
"""

from playwright.sync_api import sync_playwright
import json
import time

BASE_URL = "http://localhost:3000"

def test_research_notes_save():
    console_logs = []
    network_errors = []
    api_responses = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()

        # 콘솔 로그 캡처
        def on_console(msg):
            console_logs.append({
                'type': msg.type,
                'text': msg.text,
                'location': str(msg.location) if msg.location else None
            })
        page.on('console', on_console)

        # 네트워크 요청/응답 캡처
        def on_response(response):
            url = response.url
            if 'supabase' in url or 'research' in url.lower() or 'auth' in url.lower():
                try:
                    body = response.text() if response.status >= 400 else None
                except:
                    body = None
                api_responses.append({
                    'url': url,
                    'status': response.status,
                    'ok': response.ok,
                    'body': body[:500] if body else None
                })
        page.on('response', on_response)

        # 페이지 에러 캡처
        def on_page_error(error):
            network_errors.append(str(error))
        page.on('pageerror', on_page_error)

        print("1. 홈페이지로 이동...")
        page.goto(f'{BASE_URL}/')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        page.screenshot(path='screenshots/01_home.png')

        # 현재 URL 확인
        current_url = page.url
        print(f"   현재 URL: {current_url}")

        # 로그인 페이지로 리다이렉트되었는지 확인
        if 'login' in current_url:
            print("2. 로그인 페이지에서 로그인...")
            page.screenshot(path='screenshots/02_login_page.png')

            # 이메일, 비밀번호 입력
            email_input = page.locator('input[type="email"]')
            password_input = page.locator('input[type="password"]')

            if email_input.is_visible():
                email_input.fill('jaeho19@uos.ac.kr')
                password_input.fill('jaeho1234!')

                # 로그인 버튼 클릭
                login_btn = page.locator('button[type="submit"]')
                login_btn.click()

                # 로그인 완료 대기
                time.sleep(3)
                page.wait_for_load_state('networkidle')

                current_url = page.url
                print(f"   로그인 후 URL: {current_url}")
                page.screenshot(path='screenshots/03_after_login.png')
        else:
            print("2. 이미 로그인된 상태")
            page.screenshot(path='screenshots/02_dashboard.png')

        # 페이지 HTML 확인
        page_content = page.content()
        if '404' in page_content or 'not be found' in page_content:
            print("   [경고] 404 페이지 감지됨")

        # 사이드바에서 Research 링크 찾기
        print("3. 사이드바에서 Research 메뉴 찾기...")
        page.screenshot(path='screenshots/04_current_state.png')

        # 사이드바 링크들 확인
        sidebar_links = page.locator('nav a, aside a').all()
        print(f"   사이드바 링크 수: {len(sidebar_links)}")
        for link in sidebar_links[:10]:
            try:
                href = link.get_attribute('href')
                text = link.text_content()
                print(f"     - {text}: {href}")
            except:
                pass

        # Research 링크 클릭
        research_link = page.locator('a[href="/research"]')
        if research_link.count() > 0:
            print("4. Research 페이지로 이동...")
            research_link.first.click()
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            page.screenshot(path='screenshots/05_research_list.png')
        else:
            # 직접 URL로 이동 시도
            print("4. Research 링크 없음, 직접 URL로 이동...")
            page.goto(f'{BASE_URL}/research')
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            page.screenshot(path='screenshots/05_research_direct.png')

        # 프로젝트 목록 확인
        print("5. 프로젝트 목록 확인...")
        project_cards = page.locator('[class*="card"], [class*="Card"]').all()
        print(f"   카드 수: {len(project_cards)}")

        # 프로젝트 링크 찾기
        project_links = page.locator('a[href^="/research/"]').all()
        print(f"   프로젝트 링크 수: {len(project_links)}")

        if len(project_links) > 0:
            # 첫 번째 프로젝트 클릭
            print("6. 첫 번째 프로젝트 상세 페이지로 이동...")
            project_links[0].click()
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            page.screenshot(path='screenshots/06_project_detail.png')

            # 연구노트 섹션으로 스크롤
            print("7. 연구노트 섹션 찾기...")
            page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
            time.sleep(0.5)
            page.screenshot(path='screenshots/07_scrolled.png')

            # 새 노트 작성 버튼 찾기
            new_note_btn = page.locator('button:has-text("새 노트"), button:has-text("노트 작성")')

            if new_note_btn.count() > 0:
                print("8. 새 노트 작성 버튼 클릭...")
                new_note_btn.first.click()
                time.sleep(1)
                page.screenshot(path='screenshots/08_note_form.png')

                # 폼 입력
                print("9. 폼 데이터 입력...")

                # 제목 입력
                title_input = page.locator('input#title')
                if title_input.is_visible():
                    title_input.fill('테스트 연구노트 - ' + time.strftime('%Y%m%d_%H%M%S'))

                # 내용 입력
                content_textarea = page.locator('textarea#content')
                if content_textarea.is_visible():
                    content_textarea.fill('이것은 테스트 연구노트입니다.\n\n- 항목 1\n- 항목 2\n- 항목 3')

                # 키워드 입력
                keyword_input = page.locator('input[placeholder*="키워드"]')
                if keyword_input.is_visible():
                    keyword_input.fill('테스트')
                    keyword_input.press('Enter')
                    time.sleep(0.3)

                page.screenshot(path='screenshots/09_form_filled.png')

                # 저장 버튼 클릭
                print("10. 저장 버튼 클릭...")
                save_btn = page.locator('button[type="submit"]:has-text("작성"), button[type="submit"]:has-text("저장")')
                if save_btn.count() > 0:
                    save_btn.first.click()
                    time.sleep(3)  # 저장 처리 대기
                    page.screenshot(path='screenshots/10_after_save.png')

                    # 에러 메시지 확인
                    error_msg = page.locator('[class*="error"], [class*="Error"], .text-red, .bg-red-50')
                    if error_msg.count() > 0:
                        for err in error_msg.all():
                            err_text = err.text_content()
                            if err_text and err_text.strip():
                                print(f"   [에러 메시지] {err_text}")
                else:
                    print("   저장 버튼을 찾을 수 없습니다!")
            else:
                print("   새 노트 작성 버튼을 찾을 수 없습니다!")
                # 버튼 목록 출력
                all_buttons = page.locator('button').all()
                print(f"   페이지의 버튼들 ({len(all_buttons)}개):")
                for btn in all_buttons[:15]:
                    try:
                        print(f"     - {btn.text_content()[:50]}")
                    except:
                        pass
        else:
            print("   프로젝트 링크를 찾을 수 없습니다!")
            # 페이지 내용 출력
            all_links = page.locator('a').all()
            print(f"   페이지의 링크들 ({len(all_links)}개):")
            for link in all_links[:15]:
                try:
                    href = link.get_attribute('href')
                    text = link.text_content()
                    print(f"     - {text[:30] if text else 'N/A'}: {href}")
                except:
                    pass

        # 최종 스크린샷
        page.screenshot(path='screenshots/11_final.png', full_page=True)

        browser.close()

    # 결과 출력
    print("\n" + "="*60)
    print("테스트 결과")
    print("="*60)

    # 콘솔 에러 필터링
    console_errors = [log for log in console_logs if log['type'] in ['error', 'warning']]
    if console_errors:
        print("\n[콘솔 에러/경고]")
        for err in console_errors[:15]:
            print(f"  [{err['type']}] {err['text'][:200]}")

    # 네트워크 에러
    if network_errors:
        print("\n[페이지 에러]")
        for err in network_errors:
            print(f"  {err[:200]}")

    # API 오류 응답
    api_errors = [r for r in api_responses if not r['ok']]
    if api_errors:
        print("\n[API 오류 응답]")
        for err in api_errors:
            print(f"  {err['status']} - {err['url'][:100]}")
            if err['body']:
                print(f"    응답: {err['body'][:300]}")

    # 성공적인 API 호출
    api_success = [r for r in api_responses if r['ok'] and ('research' in r['url'].lower() or 'notes' in r['url'].lower())]
    if api_success:
        print("\n[성공한 Research API 호출]")
        for s in api_success[:5]:
            print(f"  {s['status']} - {s['url'][:100]}")

    if not console_errors and not network_errors and not api_errors:
        print("\n[결과] 명시적인 오류가 감지되지 않았습니다.")

    print("\n스크린샷이 screenshots/ 폴더에 저장되었습니다.")

if __name__ == '__main__':
    # screenshots 폴더 생성
    import os
    os.makedirs('screenshots', exist_ok=True)

    test_research_notes_save()
