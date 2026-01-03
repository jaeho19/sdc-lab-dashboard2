from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=" * 50)
    print("SDC Lab - 성과 현황 페이지 테스트")
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
        print("   로그인 성공!")
    except:
        print("   로그인 대기 중...")
        time.sleep(5)

    time.sleep(2)

    # 모달 닫기
    try:
        modal_btn = page.locator('button:has-text("시작하기")')
        if modal_btn.count() > 0:
            modal_btn.click(timeout=3000)
            time.sleep(1)
    except:
        pass

    # 2. Members 페이지로 이동
    print("\n2. Members 페이지 이동...")
    page.goto('https://sdclab-dashboard.netlify.app/members')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # 모달 닫기
    try:
        modal_btn = page.locator('button:has-text("시작하기")')
        if modal_btn.count() > 0:
            modal_btn.click(timeout=3000)
            time.sleep(1)
    except:
        pass

    page.screenshot(path=f'{SCREENSHOT_DIR}/final_01_members.png', full_page=True)

    # 3. 교수(이재호) 카드 클릭 - 메인 영역의 카드
    print("\n3. 교수 프로필 카드 클릭...")

    # 메인 콘텐츠 영역에서 교수 카드 찾기
    professor_card = page.locator('main a[href*="/members/"]').first

    if professor_card.count() > 0:
        href = professor_card.get_attribute('href')
        print(f"   멤버 링크: {href}")
        professor_card.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)
    else:
        # 직접 URL로 이동
        print("   카드 찾기 실패, URL로 직접 이동...")
        page.goto('https://sdclab-dashboard.netlify.app/members')
        page.wait_for_load_state('networkidle')

    page.screenshot(path=f'{SCREENSHOT_DIR}/final_02_detail.png', full_page=True)
    print(f"   현재 URL: {page.url}")

    # URL에서 멤버 ID 추출해서 직접 이동
    if '/members/' not in page.url or page.url.endswith('/members'):
        print("\n   멤버 페이지 직접 이동 시도...")
        # DB에서 확인된 멤버 ID 중 하나 사용
        page.goto('https://sdclab-dashboard.netlify.app/members')
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # 링크 href 직접 추출
        all_links = page.locator('a[href*="/members/"]').all()
        for link in all_links:
            href = link.get_attribute('href')
            if href and '/members/' in href and '/edit' not in href and '/performance' not in href:
                parts = href.split('/members/')
                if len(parts) > 1 and len(parts[1]) > 20:  # UUID 길이 체크
                    print(f"   직접 이동: {href}")
                    page.goto(f'https://sdclab-dashboard.netlify.app{href}')
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                    break

        page.screenshot(path=f'{SCREENSHOT_DIR}/final_03_detail2.png', full_page=True)
        print(f"   현재 URL: {page.url}")

    # 4. 성과 현황 버튼 확인
    print("\n4. 성과 현황 버튼 확인...")

    # 버튼 또는 링크 찾기
    perf_link = page.locator('a[href*="/performance"]')

    if perf_link.count() > 0:
        print(f"   성과 현황 링크 발견! ({perf_link.count()}개)")
        perf_link.first.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        page.screenshot(path=f'{SCREENSHOT_DIR}/final_04_performance.png', full_page=True)
        print(f"   현재 URL: {page.url}")

        # 5. 페이지 검증
        print("\n5. 성과 현황 페이지 검증...")
        print("-" * 40)

        content = page.content()

        checks = [
            ("성과 현황 타이틀", "성과 현황" in content),
            ("참여 연구", "참여 연구" in content),
            ("평균 진행률", "평균 진행률" in content),
            ("완료 마일스톤", "완료 마일스톤" in content),
            ("일정 준수율", "일정 준수율" in content),
            ("프로젝트별 진행 현황", "프로젝트별 진행 현황" in content),
            ("최근 활동", "최근 활동" in content),
        ]

        passed = 0
        for name, result in checks:
            if result:
                passed += 1
            print(f"   {name}: {'OK' if result else 'NOT FOUND'}")

        print("-" * 40)
        print(f"\n   결과: {passed}/{len(checks)} 통과")

        if passed >= 6:
            print("\n   SUCCESS: 성과 현황 페이지 정상 작동!")
        else:
            print("\n   WARNING: 일부 요소 누락")
    else:
        print("   성과 현황 링크를 찾을 수 없습니다.")
        print(f"   현재 URL: {page.url}")

        # 페이지 소스에서 확인
        if "성과 현황" in page.content():
            print("   (페이지에 '성과 현황' 텍스트는 존재함)")

    browser.close()
    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)
