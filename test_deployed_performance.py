from playwright.sync_api import sync_playwright
import time
import os

# 스크린샷 저장 경로
SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=" * 50)
    print("SDC Lab Dashboard - 성과 현황 페이지 테스트")
    print("=" * 50)

    print("\n1. 배포 사이트 접속...")
    page.goto('https://sdclab-dashboard.netlify.app')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    page.screenshot(path=f'{SCREENSHOT_DIR}/deploy_01_initial.png', full_page=True)
    print(f"   URL: {page.url}")

    # 로그인 페이지인지 확인
    if 'login' in page.url:
        print("\n2. 로그인 시도...")

        # 이메일 입력
        email_input = page.locator('input[type="email"], input[name="email"]')
        if email_input.count() > 0:
            email_input.fill('rdt9690@uos.ac.kr')
            print("   이메일 입력 완료")

        # 비밀번호 입력
        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0:
            password_input.fill('SDCLAB03')
            print("   비밀번호 입력 완료")

        # 로그인 버튼 클릭
        page.screenshot(path=f'{SCREENSHOT_DIR}/deploy_02_login_filled.png', full_page=True)

        login_btn = page.locator('button[type="submit"]')
        if login_btn.count() > 0:
            login_btn.click()
            print("   로그인 버튼 클릭")
            page.wait_for_load_state('networkidle')
            time.sleep(3)

        page.screenshot(path=f'{SCREENSHOT_DIR}/deploy_03_after_login.png', full_page=True)
        print(f"   로그인 후 URL: {page.url}")

    # Welcome 모달 닫기
    print("\n3. Welcome 모달 확인 및 닫기...")
    time.sleep(2)
    modal_close = page.locator('button:has-text("시작하기"), button:has-text("닫기"), [data-state="open"] button')
    if modal_close.count() > 0:
        try:
            modal_close.first.click()
            print("   모달 닫기 완료")
            time.sleep(1)
        except:
            # ESC 키로 모달 닫기 시도
            page.keyboard.press('Escape')
            print("   ESC로 모달 닫기 시도")
            time.sleep(1)

    # Members 페이지로 이동
    print("\n4. Members 페이지 이동...")
    page.goto('https://sdclab-dashboard.netlify.app/members')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # 모달이 다시 나타나면 닫기
    modal_close = page.locator('button:has-text("시작하기"), button:has-text("닫기")')
    if modal_close.count() > 0:
        try:
            modal_close.first.click()
            time.sleep(1)
        except:
            page.keyboard.press('Escape')
            time.sleep(1)

    page.screenshot(path=f'{SCREENSHOT_DIR}/deploy_04_members.png', full_page=True)
    print(f"   URL: {page.url}")

    # 멤버 카드 찾기
    print("\n5. 멤버 선택...")
    member_links = page.locator('a[href*="/members/"]').all()

    clicked = False
    for link in member_links:
        href = link.get_attribute('href')
        if href and '/edit' not in href and '/performance' not in href and '/members/' in href:
            # UUID 패턴 확인
            parts = href.split('/members/')
            if len(parts) > 1 and len(parts[1]) > 10:
                print(f"   멤버 링크 클릭: {href}")
                link.click()
                clicked = True
                break

    if clicked:
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        page.screenshot(path=f'{SCREENSHOT_DIR}/deploy_05_member_detail.png', full_page=True)
        print(f"   멤버 상세 URL: {page.url}")

        # 성과 현황 버튼 찾기
        print("\n6. 성과 현황 버튼 클릭...")
        perf_btn = page.locator('a:has-text("성과 현황"), button:has-text("성과 현황")')

        if perf_btn.count() > 0:
            perf_btn.first.click()
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            page.screenshot(path=f'{SCREENSHOT_DIR}/deploy_06_performance.png', full_page=True)
            print(f"   성과 현황 URL: {page.url}")

            # 페이지 검증
            print("\n7. 성과 현황 페이지 검증...")
            print("-" * 40)

            checks = {
                "성과 현황 타이틀": "성과 현황",
                "참여 연구 지표": "참여 연구",
                "평균 진행률 지표": "평균 진행률",
                "완료 마일스톤 지표": "완료 마일스톤",
                "일정 준수율 지표": "일정 준수율",
                "프로젝트별 진행 현황": "프로젝트별 진행 현황",
                "최근 활동 섹션": "최근 활동",
            }

            results = []
            for name, text in checks.items():
                found = page.locator(f'text="{text}"').count() > 0 or page.locator(f':has-text("{text}")').first.is_visible() if page.locator(f':has-text("{text}")').count() > 0 else False
                status = "OK" if found else "NOT FOUND"
                results.append(found)
                print(f"   {name}: {status}")

            print("-" * 40)
            success_rate = sum(results) / len(results) * 100
            print(f"\n   검증 결과: {sum(results)}/{len(results)} ({success_rate:.0f}%)")

            if success_rate >= 70:
                print("\n   SUCCESS: 성과 현황 페이지가 정상 작동합니다!")
            else:
                print("\n   WARNING: 일부 요소가 누락되었습니다.")
        else:
            print("   ERROR: 성과 현황 버튼을 찾을 수 없습니다!")
    else:
        print("   ERROR: 멤버 링크를 찾을 수 없습니다!")

    browser.close()
    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)
