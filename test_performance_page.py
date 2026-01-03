from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("1. Navigating to localhost:3010...")
    page.goto('http://localhost:3010')
    page.wait_for_load_state('networkidle')

    # Take screenshot to see current state
    page.screenshot(path='C:/dev/sdclab-dashboard/screenshots/01_initial.png', full_page=True)
    print("   Screenshot saved: 01_initial.png")

    # Check if we're on login page
    current_url = page.url
    print(f"   Current URL: {current_url}")

    # If on login page, perform login
    if 'login' in current_url or page.locator('input[type="email"]').count() > 0:
        print("2. Logging in...")
        # Fill email
        email_input = page.locator('input[type="email"]')
        if email_input.count() > 0:
            email_input.fill('jaeho.lee@sdc.ac.kr')

        # Fill password
        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0:
            password_input.fill('test1234')

        # Click login button
        login_button = page.locator('button[type="submit"]')
        if login_button.count() > 0:
            login_button.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

        page.screenshot(path='C:/dev/sdclab-dashboard/screenshots/02_after_login.png', full_page=True)
        print("   Screenshot saved: 02_after_login.png")

    # Navigate to Members page
    print("3. Navigating to Members page...")
    members_link = page.locator('a[href="/members"]')
    if members_link.count() > 0:
        members_link.click()
        page.wait_for_load_state('networkidle')
        time.sleep(1)
    else:
        page.goto('http://localhost:3010/members')
        page.wait_for_load_state('networkidle')

    page.screenshot(path='C:/dev/sdclab-dashboard/screenshots/03_members_page.png', full_page=True)
    print("   Screenshot saved: 03_members_page.png")

    # Click on a member card
    print("4. Clicking on a member...")
    member_cards = page.locator('a[href^="/members/"]')
    print(f"   Found {member_cards.count()} member links")

    if member_cards.count() > 0:
        # Click the first member that's not an edit link
        for i in range(member_cards.count()):
            href = member_cards.nth(i).get_attribute('href')
            if href and '/edit' not in href and '/performance' not in href:
                print(f"   Clicking member: {href}")
                member_cards.nth(i).click()
                page.wait_for_load_state('networkidle')
                time.sleep(1)
                break

    page.screenshot(path='C:/dev/sdclab-dashboard/screenshots/04_member_detail.png', full_page=True)
    print("   Screenshot saved: 04_member_detail.png")
    print(f"   Current URL: {page.url}")

    # Click on "성과 현황" button
    print("5. Clicking '성과 현황' button...")
    performance_button = page.locator('text=성과 현황')
    print(f"   Found {performance_button.count()} '성과 현황' buttons")

    if performance_button.count() > 0:
        performance_button.first.click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        page.screenshot(path='C:/dev/sdclab-dashboard/screenshots/05_performance_page.png', full_page=True)
        print("   Screenshot saved: 05_performance_page.png")
        print(f"   Current URL: {page.url}")

        # Verify performance page content
        print("\n6. Verifying performance page content...")

        # Check for key elements
        has_title = page.locator('text=성과 현황').count() > 0
        has_projects = page.locator('text=참여 연구').count() > 0
        has_progress = page.locator('text=평균 진행률').count() > 0
        has_milestones = page.locator('text=완료 마일스톤').count() > 0
        has_schedule = page.locator('text=일정 준수율').count() > 0
        has_project_section = page.locator('text=프로젝트별 진행 현황').count() > 0
        has_activity = page.locator('text=최근 활동').count() > 0

        print(f"   - 성과 현황 타이틀: {'OK' if has_title else 'NOT FOUND'}")
        print(f"   - 참여 연구 지표: {'OK' if has_projects else 'NOT FOUND'}")
        print(f"   - 평균 진행률 지표: {'OK' if has_progress else 'NOT FOUND'}")
        print(f"   - 완료 마일스톤 지표: {'OK' if has_milestones else 'NOT FOUND'}")
        print(f"   - 일정 준수율 지표: {'OK' if has_schedule else 'NOT FOUND'}")
        print(f"   - 프로젝트별 진행 현황: {'OK' if has_project_section else 'NOT FOUND'}")
        print(f"   - 최근 활동 섹션: {'OK' if has_activity else 'NOT FOUND'}")

        all_ok = all([has_title, has_projects, has_progress, has_milestones, has_schedule, has_project_section, has_activity])
        print(f"\n{'SUCCESS: All elements found!' if all_ok else 'WARNING: Some elements missing'}")
    else:
        print("   ERROR: '성과 현황' button not found!")

    browser.close()
    print("\nTest completed!")
