from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to login page
    page.goto('http://localhost:3002/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Debug: get all input elements
    inputs = page.locator('input').all()
    print(f"Found {len(inputs)} input elements")
    for i, inp in enumerate(inputs):
        print(f"Input {i}: placeholder='{inp.get_attribute('placeholder')}', type='{inp.get_attribute('type')}'")

    # Get page HTML structure
    html = page.content()
    with open('login_page.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Saved login page HTML")

    browser.close()
