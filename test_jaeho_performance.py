from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("이재호 교수 성과 페이지 테스트")
    print("=" * 50)

    # 로그인
    page.goto('https://sdclab-dashboard.netlify.app/login')
    page.wait_for_load_state('networkidle')
    page.fill('input[type="email"]', 'rdt9690@uos.ac.kr')
    page.fill('input[type="password"]', 'SDCLAB03')
    page.click('button[type="submit"]')

    try:
        page.wait_for_url('**/dashboard**', timeout=15000)
    except:
        time.sleep(5)

    print("로그인 완료!")
    time.sleep(2)

    # 모달 닫기
    try:
        btn = page.locator('button:has-text("시작하기")')
        if btn.count() > 0:
            btn.click(timeout=3000)
            time.sleep(1)
    except:
        pass

    # 이재호 성과 페이지 직접 이동 (project_authors에 이재호가 있음)
    # 먼저 members 페이지에서 이재호 ID 찾기
    page.goto('https://sdclab-dashboard.netlify.app/members')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    try:
        btn = page.locator('button:has-text("시작하기")')
        if btn.count() > 0:
            btn.click(timeout=3000)
            time.sleep(1)
    except:
        pass

    # 이재호 링크 찾기
    jaeho_link = page.locator('a[href*="/members/"]:has-text("이재호")')
    if jaeho_link.count() > 0:
        href = jaeho_link.get_attribute('href')
        member_id = href.split('/members/')[1] if '/members/' in href else None

        if member_id:
            print(f"이재호 ID: {member_id}")

            # 성과 페이지로 이동
            page.goto(f'https://sdclab-dashboard.netlify.app/members/{member_id}/performance')
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            try:
                btn = page.locator('button:has-text("시작하기")')
                if btn.count() > 0:
                    btn.click(timeout=3000)
                    time.sleep(1)
            except:
                pass

            page.screenshot(path=f'{SCREENSHOT_DIR}/jaeho_performance.png', full_page=True)
            print(f"URL: {page.url}")

            # 내용 확인
            content = page.content()

            print("\n페이지 검증:")
            print(f"  - 참여 연구 프로젝트가 없습니다: {'있음' if '참여 중인 연구 프로젝트가 없습니다' in content else '없음'}")
            print(f"  - 프로젝트별 진행 현황: {'있음' if '프로젝트별 진행 현황' in content else '없음'}")

            # 프로젝트 카운트 추출
            try:
                cards = page.locator('.text-2xl.font-bold').all()
                if len(cards) >= 1:
                    print(f"  - 참여 연구 수: {cards[0].text_content()}")
                if len(cards) >= 2:
                    print(f"  - 평균 진행률: {cards[1].text_content()}")
            except:
                pass

    browser.close()
    print("\n테스트 완료!")
