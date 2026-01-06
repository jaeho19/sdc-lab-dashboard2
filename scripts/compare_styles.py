from playwright.sync_api import sync_playwright
import time

BASE_URL = 'http://localhost:3002'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # 1. 로그인
    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    page.screenshot(path='/tmp/login_page.png')
    print("로그인 페이지: /tmp/login_page.png")

    # 이메일과 비밀번호 입력
    inputs = page.locator('input').all()
    print(f"입력 필드 수: {len(inputs)}")

    if len(inputs) >= 2:
        inputs[0].fill('jaeho.lee@uos.ac.kr')
        inputs[1].fill('test1234!')

        # 로그인 버튼 클릭
        page.locator('button:has-text("로그인")').click()

        # 로그인 완료 대기
        try:
            page.wait_for_url('**/dashboard**', timeout=15000)
            print("로그인 성공!")
        except:
            print("로그인 리다이렉트 실패, 현재 URL:", page.url)
            page.screenshot(path='/tmp/after_login.png')

        time.sleep(2)

        # 2. 연구 프로젝트 목록으로 이동
        page.goto(f'{BASE_URL}/research')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        page.screenshot(path='/tmp/research_list.png')
        print("연구 목록: /tmp/research_list.png")

        # 3. 첫 번째 프로젝트 클릭
        project_cards = page.locator('a[href^="/research/"]').all()
        print(f"프로젝트 카드 수: {len(project_cards)}")

        if len(project_cards) > 0:
            project_cards[0].click()
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            page.screenshot(path='/tmp/project_detail.png', full_page=True)
            print("프로젝트 상세: /tmp/project_detail.png")

            # 4. 연구노트 섹션 찾기 및 펼치기
            # 페이지 전체 스크롤
            page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
            time.sleep(1)

            # Collapsible 트리거 클릭 (연구노트 카드 펼치기)
            collapsible_closed = page.locator('[data-state="closed"]').all()
            print(f"닫힌 Collapsible 수: {len(collapsible_closed)}")

            for trigger in collapsible_closed[:3]:
                try:
                    trigger.click()
                    time.sleep(0.5)
                except:
                    pass

            time.sleep(1)
            page.screenshot(path='/tmp/notes_expanded.png', full_page=True)
            print("연구노트 펼침: /tmp/notes_expanded.png")

            # 5. HTML 분석
            html = page.content()
            fc_count = html.count('flowchart-content')
            print(f"\nflowchart-content 클래스 출현 횟수: {fc_count}")

            # flowchart-content 요소들 확인
            fc_elements = page.locator('.flowchart-content').all()
            print(f"flowchart-content 요소 수: {len(fc_elements)}")

    browser.close()
    print("\n완료!")
