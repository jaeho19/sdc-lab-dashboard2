from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to dashboard
    page.goto('http://localhost:3001/dashboard')
    page.wait_for_load_state('networkidle')

    # Take initial screenshot
    page.screenshot(path='C:/dev/sdclab-dashboard/test_screenshots/01_dashboard.png', full_page=True)
    print("1. Dashboard loaded - screenshot saved")

    # Check if we're on login page
    if 'login' in page.url.lower() or page.locator('text=로그인').count() > 0:
        print("2. Login page detected - need to login first")

        # Try to find login form
        email_input = page.locator('input[type="email"], input[placeholder*="email"]').first
        password_input = page.locator('input[type="password"]').first

        if email_input.count() > 0 and password_input.count() > 0:
            # Use test credentials (you may need to update these)
            email_input.fill('jaeho19@uos.ac.kr')
            password_input.fill('test1234')

            # Click login button
            login_btn = page.locator('button:has-text("로그인")').first
            if login_btn.count() > 0:
                login_btn.click()
                page.wait_for_load_state('networkidle')
                time.sleep(2)

                page.screenshot(path='C:/dev/sdclab-dashboard/test_screenshots/02_after_login.png', full_page=True)
                print("3. After login attempt - screenshot saved")

    # Navigate to dashboard if not already there
    if '/dashboard' not in page.url:
        page.goto('http://localhost:3001/dashboard')
        page.wait_for_load_state('networkidle')

    # Take screenshot of dashboard
    page.screenshot(path='C:/dev/sdclab-dashboard/test_screenshots/03_dashboard_main.png', full_page=True)
    print("4. Dashboard main page - screenshot saved")

    # Look for the dropdown in submitted projects section
    dropdowns = page.locator('button[role="combobox"]').all()
    print(f"5. Found {len(dropdowns)} dropdown(s) on page")

    if len(dropdowns) > 0:
        # Click first dropdown to open it
        dropdowns[0].click()
        time.sleep(0.5)

        page.screenshot(path='C:/dev/sdclab-dashboard/test_screenshots/04_dropdown_open.png', full_page=True)
        print("6. Dropdown opened - screenshot saved")

        # Check for dropdown options
        options = page.locator('[role="option"]').all()
        print(f"7. Dropdown options found: {len(options)}")
        for opt in options:
            print(f"   - {opt.text_content()}")
    else:
        print("5. No dropdowns found - checking page content")
        # Check for submitted projects section
        content = page.content()
        if 'Under Review' in content or 'Submitted' in content:
            print("   Submission status labels found in page")
        else:
            print("   No submission status content found")

    browser.close()
    print("\nTest completed!")
