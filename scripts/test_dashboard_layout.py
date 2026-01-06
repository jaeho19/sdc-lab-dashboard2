from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1400, 'height': 900})

    # Navigate to dashboard (will redirect to login)
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')

    # Take screenshot of login page
    screenshot_dir = 'screenshots'
    os.makedirs(screenshot_dir, exist_ok=True)
    page.screenshot(path=f'{screenshot_dir}/01_login_page.png', full_page=True)
    print("Screenshot saved: 01_login_page.png")

    # Login with test credentials
    page.fill('input[type="email"]', 'jaeho@sdc.com')
    page.fill('input[type="password"]', 'test1234')
    page.click('button[type="submit"]')

    # Wait for navigation to dashboard
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)  # Extra wait for JS rendering

    # Take screenshot of dashboard
    page.screenshot(path=f'{screenshot_dir}/02_dashboard_new_layout.png', full_page=True)
    print("Screenshot saved: 02_dashboard_new_layout.png")

    # Scroll down to see more content
    page.evaluate('window.scrollBy(0, 500)')
    page.wait_for_timeout(500)
    page.screenshot(path=f'{screenshot_dir}/03_dashboard_scrolled.png', full_page=True)
    print("Screenshot saved: 03_dashboard_scrolled.png")

    browser.close()
    print("Done!")
