from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=" * 50)
    print("SDC Lab - 연구원 성과 현황 페이지 테스트")
    print("=" * 50)

    # 1. 로그인
    print("\n1. 로그인 (김은솔 계정)...")
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

    # 모달 닫기
    def close_modal():
        try:
            start_btn = page.locator('button:has-text("시작하기")')
            if start_btn.count() > 0 and start_btn.is_visible():
                start_btn.click(timeout=3000)
                time.sleep(1)
        except:
            pass

    close_modal()

    # 2. Members 페이지에서 연구원 목록 확인
    print("\n2. Members 페이지에서 연구원 확인...")
    page.goto('https://sdclab-dashboard.netlify.app/members')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    close_modal()

    # 모든 멤버 링크 수집
    member_links = []
    all_links = page.locator('a[href*="/members/"]').all()
    for link in all_links:
        href = link.get_attribute('href')
        if href and '/members/' in href and '/edit' not in href and '/performance' not in href:
            parts = href.split('/members/')
            if len(parts) > 1 and len(parts[1]) > 20:
                member_links.append(parts[1])

    print(f"   발견된 멤버: {len(member_links)}명")

    # 3. 각 멤버의 성과 페이지 테스트 (프로젝트가 있는 멤버 찾기)
    tested_members = []

    for i, member_id in enumerate(member_links[:5]):  # 최대 5명만 테스트
        print(f"\n3-{i+1}. 멤버 {member_id[:8]}... 성과 페이지 확인")

        page.goto(f'https://sdclab-dashboard.netlify.app/members/{member_id}/performance')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        close_modal()

        # 페이지 내용 확인
        content = page.content()

        # 멤버 이름 추출
        name_match = page.locator('h1:has-text("성과 현황")').text_content() if page.locator('h1:has-text("성과 현황")').count() > 0 else "Unknown"

        # 참여 연구 수 확인
        has_projects = "참여 중인 연구 프로젝트가 없습니다" not in content

        # 지표 값 추출 시도
        project_count = "0건"
        progress = "0%"

        try:
            cards = page.locator('.text-2xl.font-bold').all()
            if len(cards) >= 2:
                project_count = cards[0].text_content()
                progress = cards[1].text_content()
        except:
            pass

        member_info = {
            "id": member_id[:8],
            "name": name_match.replace(" 성과 현황", ""),
            "has_projects": has_projects,
            "project_count": project_count,
            "progress": progress
        }
        tested_members.append(member_info)

        print(f"      이름: {member_info['name']}")
        print(f"      참여 연구: {project_count}")
        print(f"      평균 진행률: {progress}")
        print(f"      프로젝트 있음: {'예' if has_projects else '아니오'}")

        # 프로젝트가 있는 멤버 발견 시 스크린샷
        if has_projects:
            page.screenshot(path=f'{SCREENSHOT_DIR}/researcher_{member_id[:8]}.png', full_page=True)
            print(f"      스크린샷 저장됨!")

    # 4. 결과 요약
    print("\n" + "=" * 50)
    print("테스트 결과 요약")
    print("=" * 50)

    members_with_projects = [m for m in tested_members if m["has_projects"]]

    print(f"\n총 테스트 멤버: {len(tested_members)}명")
    print(f"프로젝트 있는 멤버: {len(members_with_projects)}명")

    if members_with_projects:
        print("\n프로젝트가 있는 멤버:")
        for m in members_with_projects:
            print(f"  - {m['name']}: {m['project_count']}, 진행률 {m['progress']}")
    else:
        print("\n현재 프로젝트가 배정된 연구원이 없습니다.")
        print("(project_members 테이블에 데이터 추가 필요)")

    browser.close()
    print("\n테스트 완료!")
