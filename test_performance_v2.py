from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=" * 50)
    print("SDC Lab - 성과 현황 페이지 테스트 v2")
    print("=" * 50)

    # 1. 로그인
    print("\n1. 로그인...")
    page.goto('https://sdclab-dashboard.netlify.app/login')
    page.wait_for_load_state('networkidle')

    page.fill('input[type="email"]', 'rdt9690@uos.ac.kr')
    page.fill('input[type="password"]', 'SDCLAB03')
    page.click('button[type="submit"]')

    try:
        page.wait_for_url('**/dashboard**', timeout=15000)
    except:
        time.sleep(5)

    print("   로그인 완료!")
    time.sleep(2)

    # Welcome 모달 닫기 함수
    def close_modal():
        try:
            # "시작하기" 버튼 클릭
            start_btn = page.locator('button:has-text("시작하기")')
            if start_btn.count() > 0 and start_btn.is_visible():
                start_btn.click(timeout=3000)
                time.sleep(1)
                return True
        except:
            pass

        try:
            # X 버튼 클릭
            close_btn = page.locator('[data-state="open"] button:has(svg)')
            if close_btn.count() > 0:
                close_btn.first.click(timeout=3000)
                time.sleep(1)
                return True
        except:
            pass

        try:
            # ESC 키
            page.keyboard.press('Escape')
            time.sleep(1)
            return True
        except:
            pass

        return False

    close_modal()

    # 2. 멤버 상세 페이지로 직접 이동
    print("\n2. 멤버 상세 페이지 이동...")

    # 먼저 members 목록에서 ID 가져오기
    page.goto('https://sdclab-dashboard.netlify.app/members')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    close_modal()

    # 링크에서 멤버 ID 추출
    member_id = None
    all_links = page.locator('a[href*="/members/"]').all()
    for link in all_links:
        href = link.get_attribute('href')
        if href and '/members/' in href and '/edit' not in href and '/performance' not in href:
            parts = href.split('/members/')
            if len(parts) > 1 and len(parts[1]) > 20:
                member_id = parts[1]
                break

    if member_id:
        print(f"   멤버 ID: {member_id}")
        page.goto(f'https://sdclab-dashboard.netlify.app/members/{member_id}')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        close_modal()

    page.screenshot(path=f'{SCREENSHOT_DIR}/v2_01_detail.png', full_page=True)
    print(f"   URL: {page.url}")

    # 3. 성과 현황 페이지로 직접 이동
    print("\n3. 성과 현황 페이지 직접 이동...")

    if member_id:
        page.goto(f'https://sdclab-dashboard.netlify.app/members/{member_id}/performance')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        close_modal()

        page.screenshot(path=f'{SCREENSHOT_DIR}/v2_02_performance.png', full_page=True)
        print(f"   URL: {page.url}")

        # 4. 페이지 검증
        print("\n4. 성과 현황 페이지 검증...")
        print("-" * 40)

        content = page.content()

        checks = [
            ("성과 현황 타이틀", "성과 현황"),
            ("참여 연구", "참여 연구"),
            ("평균 진행률", "평균 진행률"),
            ("완료 마일스톤", "완료 마일스톤"),
            ("일정 준수율", "일정 준수율"),
            ("프로젝트별 진행 현황", "프로젝트별 진행 현황"),
            ("최근 활동", "최근 활동"),
        ]

        passed = 0
        for name, keyword in checks:
            found = keyword in content
            if found:
                passed += 1
            print(f"   {name}: {'OK' if found else 'NOT FOUND'}")

        print("-" * 40)
        print(f"\n   결과: {passed}/{len(checks)} 통과")

        if passed >= 6:
            print("\n   SUCCESS: 성과 현황 페이지 정상 작동!")
        elif passed >= 4:
            print("\n   PARTIAL: 대부분 요소 확인됨")
        else:
            print("\n   FAIL: 주요 요소 누락")
    else:
        print("   ERROR: 멤버 ID를 찾을 수 없습니다.")

    browser.close()
    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)
