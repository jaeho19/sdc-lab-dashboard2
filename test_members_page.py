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

    # Wait for navigation
    page.wait_for_timeout(5000)

    # Print current URL for debugging
    print(f"Current URL after login: {page.url}")

    # If still on login page, the login failed
    if '/login' in page.url:
        page.screenshot(path='C:/dev/sdclab-dashboard/login_failed.png', full_page=True)
        print("Login failed - screenshot saved to login_failed.png")
    else:
        # Navigate to members page
        page.goto('http://localhost:3007/members')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)  # Extra wait for images to load

        # Take full page screenshot
        page.screenshot(path='C:/dev/sdclab-dashboard/members_page_screenshot.png', full_page=True)
        print("Screenshot saved to members_page_screenshot.png")

    browser.close()
