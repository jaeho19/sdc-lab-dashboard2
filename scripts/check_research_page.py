from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # First login
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')

    # Fill login form (use test credentials)
    page.fill('input[type="email"]', 'jaeho.lee@uos.ac.kr')
    page.fill('input[type="password"]', 'test1234')
    page.click('button[type="submit"]')

    page.wait_for_timeout(3000)  # Wait for login redirect
    page.wait_for_load_state('networkidle')

    print(f"After login, URL: {page.url}")

    # Navigate to research detail page
    page.goto('http://localhost:3000/research/88c9f4dc-716c-446e-acf0-5d9cdee6d504')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print(f"Research page URL: {page.url}")

    # Take full page screenshot
    page.screenshot(path='C:/dev/sdclab-dashboard/screenshot_research.png', full_page=True)
    print("Screenshot saved to screenshot_research.png")

    # Get page content for debugging
    content = page.content()

    # Check for milestone section
    if '단계별 진행 현황' in content:
        print("Found: 단계별 진행 현황 section")
    else:
        print("NOT found: 단계별 진행 현황 section")

    if '문헌조사' in content:
        print("Found: 문헌조사 text")
    else:
        print("NOT found: 문헌조사 text")

    # Check for checkboxes
    checkboxes = page.locator('button[role="checkbox"]')
    print(f"Found {checkboxes.count()} checkboxes")

    browser.close()
