from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_default_timeout(60000)

    # Go to login page
    page.goto('http://localhost:3007/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('#email', timeout=10000)

    # Login with professor credentials
    page.fill('#email', 'jaeho19@gmail.com')
    page.fill('#password', 'Cory0012')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)

    # Go directly to edit page
    page.goto('http://localhost:3007/members/43796ddc-a2fc-44d3-bb9b-b8d40ccd9538/edit')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Take screenshot of edit page
    page.screenshot(path='C:/dev/sdclab-dashboard/member_edit_page.png', full_page=True)
    print(f"Edit page URL: {page.url}")
    print("Edit page screenshot saved")

    browser.close()
