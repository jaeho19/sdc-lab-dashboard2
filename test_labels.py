from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_default_timeout(60000)

    # Go to login page
    page.goto('http://localhost:3007/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('#email', timeout=10000)

    # Login
    page.fill('#email', 'jaeho19@gmail.com')
    page.fill('#password', 'Cory0012')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)

    # Test professor (should show 계약일/계약 만료일)
    page.goto('http://localhost:3007/members/43796ddc-a2fc-44d3-bb9b-b8d40ccd9538/edit')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path='C:/dev/sdclab-dashboard/edit_professor.png', full_page=True)
    print("Professor edit page saved (should show 계약일/계약 만료일)")

    # Go to members list to find a PhD student
    page.goto('http://localhost:3007/members')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Take screenshot of members page
    page.screenshot(path='C:/dev/sdclab-dashboard/members_updated.png', full_page=True)
    print("Members page saved")

    browser.close()
