from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1400, 'height': 900})

    # Navigate to Netlify deployed site
    page.goto('https://sdclab-dashboard.netlify.app/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Take screenshot of login page
    screenshot_dir = 'screenshots'
    os.makedirs(screenshot_dir, exist_ok=True)

    # Login with test credentials
    page.fill('input[type="email"]', 'jaeho@sdc.com')
    page.fill('input[type="password"]', 'test1234')
    page.click('button[type="submit"]')

    # Wait for navigation to dashboard
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)  # Extra wait for JS rendering

    # Take screenshot of dashboard
    page.screenshot(path=f'{screenshot_dir}/04_netlify_dashboard.png', full_page=True)
    print("Screenshot saved: 04_netlify_dashboard.png")

    browser.close()
    print("Done!")
