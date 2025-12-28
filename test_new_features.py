from playwright.sync_api import sync_playwright
from datetime import datetime, timedelta

with sync_playwright() as p:
    # Launch in visible mode so user can log in
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to login page
    print("Opening browser for manual login...")
    print("Please log in with your credentials.")
    page.goto('http://localhost:3002/login')

    # Wait for user to complete login and navigate to dashboard
    print("Waiting for navigation to dashboard...")
    page.wait_for_url("**/dashboard**", timeout=120000)
    print("[OK] Login successful!")

    # Navigate to research detail page
    print("\nNavigating to research detail page...")
    page.goto('http://localhost:3002/research/c6d33735-5a60-416c-b03e-0e1c2e9cc70f')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    # Take initial screenshot
    page.screenshot(path='C:/dev/sdclab-dashboard/screenshot_initial.png', full_page=True)
    print("Initial screenshot saved to screenshot_initial.png")

    # Check for Weekly Goals section
    weekly_goals_section = page.locator('text=이번 주 목표')
    if weekly_goals_section.count() > 0:
        print("[OK] Weekly Goals section found!")
    else:
        print("[FAIL] Weekly Goals section NOT found")

    # Check for Project Timeline section
    timeline_section = page.locator('text=프로젝트 타임라인')
    if timeline_section.count() > 0:
        print("[OK] Project Timeline section found!")
    else:
        print("[FAIL] Project Timeline section NOT found")

    # Check for milestone section as control
    milestone_section = page.locator('text=단계별 진행 현황')
    if milestone_section.count() > 0:
        print("[OK] Milestone section found (page loaded correctly)")
    else:
        print("[INFO] Milestone section NOT found")

    # Test adding a weekly goal
    print("\nTesting weekly goal addition...")

    # Click "목표 추가" button
    add_goal_btn = page.locator('button:has-text("목표 추가")')
    if add_goal_btn.count() > 0:
        add_goal_btn.click()
        page.wait_for_timeout(500)

        # Take screenshot of dialog
        page.screenshot(path='C:/dev/sdclab-dashboard/screenshot_add_goal_dialog.png')
        print("Add goal dialog screenshot saved")

        # Fill in goal content
        content_input = page.locator('input[placeholder="목표 내용을 입력하세요"]')
        if content_input.count() > 0:
            content_input.fill('Test Weekly Goal - Automated')
            print("[OK] Filled goal content")

        # Fill in deadline (tomorrow)
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        deadline_input = page.locator('input[type="date"]').first
        if deadline_input.count() > 0:
            deadline_input.fill(tomorrow)
            print(f"[OK] Set deadline to {tomorrow}")

        # Take screenshot before submitting
        page.screenshot(path='C:/dev/sdclab-dashboard/screenshot_goal_filled.png')
        print("Filled goal form screenshot saved")

        # Click add button
        submit_btn = page.locator('button:has-text("추가")').last
        if submit_btn.count() > 0:
            submit_btn.click()
            page.wait_for_timeout(1000)
            print("[OK] Clicked add button")

        # Wait for dialog to close and data to refresh
        page.wait_for_load_state('networkidle')
    else:
        print("[INFO] Add goal button not found")

    # Take final screenshot
    page.wait_for_timeout(500)
    page.screenshot(path='C:/dev/sdclab-dashboard/screenshot_final.png', full_page=True)
    print("\nFinal screenshot saved to screenshot_final.png")

    # Check if goal was added
    new_goal = page.locator('text=Test Weekly Goal')
    if new_goal.count() > 0:
        print("[OK] Weekly goal was successfully added!")
    else:
        print("[INFO] Weekly goal NOT visible (check error in console)")

    print("\nTest completed! Press Enter to close browser...")
    input()
    browser.close()
