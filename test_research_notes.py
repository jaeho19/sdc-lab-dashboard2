from playwright.sync_api import sync_playwright
import time

def close_modal(page):
    """Close welcome modal if present"""
    time.sleep(0.5)
    start_btn = page.locator('button:has-text("시작하기")')
    if start_btn.count() > 0:
        try:
            start_btn.click(timeout=2000)
            time.sleep(0.5)
            return True
        except:
            pass
    page.keyboard.press('Escape')
    time.sleep(0.3)
    page.keyboard.press('Escape')
    time.sleep(0.3)
    return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_errors = []
    page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)
    page.on("pageerror", lambda err: console_errors.append(f"[PAGE ERROR] {err}"))

    print("1. Navigating to login page...")
    page.goto('https://sdclab-dashboard.netlify.app/login')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    print("2. Logging in...")
    page.fill('input[type="email"]', 'jinnieel@uos.ac.kr')
    page.fill('input[type="password"]', 'SDCLAB07')
    page.click('button[type="submit"]')

    print("   Waiting for login...")
    try:
        page.wait_for_url('**/dashboard**', timeout=10000)
    except:
        pass
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    print(f"   Current URL: {page.url}")

    if '/dashboard' in page.url:
        print("\n3. Closing welcome modal...")
        close_modal(page)
        time.sleep(1)

        print("\n4. Navigating to Research page...")
        page.goto('https://sdclab-dashboard.netlify.app/research')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        close_modal(page)

        print("\n5. Finding projects...")
        project_links = page.locator('a[href^="/research/"]:not([href="/research/new"])').all()
        print(f"   Found {len(project_links)} projects")

        if len(project_links) > 0:
            href = project_links[0].get_attribute('href')
            print(f"   Going to: {href}")

            page.goto(f'https://sdclab-dashboard.netlify.app{href}')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n6. Closing modal on project page...")
            close_modal(page)
            time.sleep(1)

            print("\n7. Scrolling to research notes...")
            page.evaluate('window.scrollTo(0, 2500)')
            time.sleep(1)

            print("\n8. Looking for new note button...")
            new_note_btn = page.locator('button:has-text("새 노트 작성")')
            print(f"   Found button: {new_note_btn.count()} times")

            if new_note_btn.count() > 0:
                new_note_btn.scroll_into_view_if_needed()
                time.sleep(0.5)
                close_modal(page)
                time.sleep(0.5)

                print("   Clicking new note button...")
                new_note_btn.click(timeout=5000)
                time.sleep(1)

                page.screenshot(path='/tmp/05_note_form.png', full_page=True)
                print("   Screenshot saved: /tmp/05_note_form.png")

                # Check milestone dropdown using JavaScript to get styles
                print("\n9. Checking milestone dropdown styles...")

                # Get all combobox buttons in the dialog
                comboboxes = page.locator('[role="dialog"] button[role="combobox"]').all()
                print(f"   Found {len(comboboxes)} combobox(es) in dialog")

                if len(comboboxes) > 0:
                    for i, cb in enumerate(comboboxes):
                        text = cb.text_content()
                        color = cb.evaluate('el => window.getComputedStyle(el).color')
                        bg = cb.evaluate('el => window.getComputedStyle(el).backgroundColor')
                        print(f"\n   Combobox {i+1}:")
                        print(f"   - Text: '{text}'")
                        print(f"   - Text color: {color}")
                        print(f"   - Background: {bg}")

                    # Use JavaScript to click the dropdown to bypass overlay
                    print("\n   Opening dropdown with JavaScript...")
                    comboboxes[0].evaluate('el => el.click()')
                    time.sleep(0.5)

                    page.screenshot(path='/tmp/06_dropdown_open.png', full_page=True)
                    print("   Screenshot saved: /tmp/06_dropdown_open.png")

                    # Check dropdown items
                    items = page.locator('[role="option"]').all()
                    print(f"\n   Dropdown items ({len(items)}):")
                    for i, item in enumerate(items):
                        text = item.text_content()
                        color = item.evaluate('el => window.getComputedStyle(el).color')
                        bg = item.evaluate('el => window.getComputedStyle(el).backgroundColor')
                        print(f"   {i+1}. '{text}'")
                        print(f"      - Text color: {color}")
                        print(f"      - Background: {bg}")
                else:
                    print("   No combobox found in dialog")
            else:
                print("   New note button not found")
        else:
            print("   No projects found")
    else:
        print("   Login failed")

    if console_errors:
        print("\n--- Console Errors ---")
        for err in console_errors[:5]:
            print(f"   {err[:200]}")

    browser.close()
    print("\nTest completed!")
