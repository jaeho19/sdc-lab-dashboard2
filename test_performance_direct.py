from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=" * 50)
    print("SDC Lab - 성과 현황 페이지 직접 테스트")
    print("=" * 50)

    # 1. 로그인
    print("\n1. 로그인...")
    page.goto('https://sdclab-dashboard.netlify.app/login')
    page.wait_for_load_state('networkidle')

    page.fill('input[type="email"]', 'rdt9690@uos.ac.kr')
    page.fill('input[type="password"]', 'SDCLAB03')
    page.click('button[type="submit"]')

    # 로그인 완료 대기
    page.wait_for_url('**/dashboard**', timeout=15000)
    print("   로그인 성공!")
    time.sleep(2)

    # 모달 닫기
    try:
        modal_btn = page.locator('button:has-text("시작하기")')
        if modal_btn.count() > 0:
            modal_btn.click()
            time.sleep(1)
    except:
        pass

    # 2. 김은솔 멤버 ID 확인 (rdt9690@uos.ac.kr)
    # DB에서 확인한 멤버 페이지로 직접 이동
    print("\n2. 멤버 상세 페이지 직접 이동...")
    page.goto('https://sdclab-dashboard.netlify.app/members')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # 모달 닫기
    try:
        modal_btn = page.locator('button:has-text("시작하기")')
        if modal_btn.count() > 0:
            modal_btn.click()
            time.sleep(1)
    except:
        pass

    # 김은솔 (rdt9690) 카드 찾기 및 클릭
    member_card = page.locator('text=김은솔').first
    if member_card.count() > 0:
        member_card.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    page.screenshot(path=f'{SCREENSHOT_DIR}/direct_01_member_detail.png', full_page=True)
    print(f"   URL: {page.url}")

    # 3. 성과 현황 버튼 클릭
    print("\n3. 성과 현황 버튼 클릭...")
    perf_btn = page.locator('text=성과 현황').first

    if perf_btn.is_visible():
        perf_btn.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        page.screenshot(path=f'{SCREENSHOT_DIR}/direct_02_performance.png', full_page=True)
        print(f"   URL: {page.url}")

        # 4. 페이지 검증
        print("\n4. 성과 현황 페이지 검증...")
        print("-" * 40)

        content = page.content()

        checks = [
            ("성과 현황 타이틀", "성과 현황" in content),
            ("참여 연구 지표", "참여 연구" in content),
            ("평균 진행률 지표", "평균 진행률" in content),
            ("완료 마일스톤 지표", "완료 마일스톤" in content),
            ("일정 준수율 지표", "일정 준수율" in content),
            ("프로젝트별 진행 현황", "프로젝트별 진행 현황" in content),
            ("최근 활동 섹션", "최근 활동" in content),
        ]

        passed = 0
        for name, result in checks:
            status = "OK" if result else "NOT FOUND"
            if result:
                passed += 1
            print(f"   {name}: {status}")

        print("-" * 40)
        print(f"\n   결과: {passed}/{len(checks)} 통과")

        if passed == len(checks):
            print("\n   SUCCESS: 모든 요소 확인됨!")
        elif passed >= 5:
            print("\n   PARTIAL: 대부분 요소 확인됨")
        else:
            print("\n   FAIL: 일부 요소 누락")
    else:
        print("   ERROR: 성과 현황 버튼을 찾을 수 없습니다!")
        page.screenshot(path=f'{SCREENSHOT_DIR}/direct_02_error.png', full_page=True)

    browser.close()
    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)
