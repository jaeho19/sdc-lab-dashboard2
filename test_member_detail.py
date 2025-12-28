from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to login page
    page.goto('http://localhost:3007/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    # Login with professor credentials
    page.fill('#email', 'jaeho19@gmail.com')
    page.fill('#password', 'Cory0012')

    # Click submit button
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)

    # Go to members page first
    page.goto('http://localhost:3007/members')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Click on a member card (first one after professor)
    member_cards = page.locator('a[href^="/members/"]').all()
    if len(member_cards) > 0:
        member_cards[0].click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

    # Take screenshot
    page.screenshot(path='C:/dev/sdclab-dashboard/member_detail_screenshot.png', full_page=True)
    print(f"Current URL: {page.url}")
    print("Screenshot saved to member_detail_screenshot.png")
    browser.close()
