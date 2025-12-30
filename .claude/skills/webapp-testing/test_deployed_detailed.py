"""Detailed test for deployed site with better error capture."""
from playwright.sync_api import sync_playwright
import time

def test_deployed():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture all console and network
        console_msgs = []
        page.on('console', lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))

        try:
            print("=" * 60)
            print("STEP 1: Go to login page")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            print(f"  URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d2_01_login.png')

            print("\n" + "=" * 60)
            print("STEP 2: Fill and submit login form")
            print("=" * 60)

            # Wait for form to be ready
            page.wait_for_selector('#email', timeout=10000)
            page.fill('#email', 'jaeho19@gmail.com')
            page.fill('#password', 'Cory0012')

            print("  Form filled, clicking submit...")

            # Watch for navigation
            with page.expect_navigation(timeout=30000, wait_until='networkidle') as nav:
                page.click('button[type="submit"]')

            print(f"  Navigation completed to: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d2_02_after_login.png')

            # Check result
            if '/dashboard' in page.url:
                print("  SUCCESS: Redirected to dashboard!")
            elif '/login' in page.url:
                # Check for error message
                error = page.locator('.text-red-600, .bg-red-50, [role="alert"]')
                if error.count() > 0:
                    print(f"  LOGIN FAILED: {error.first.inner_text()}")
                else:
                    print("  LOGIN FAILED: Still on login page (no error shown)")
            else:
                print(f"  Redirected to: {page.url}")

            # If logged in, try creating project
            if '/dashboard' in page.url or '/login' not in page.url:
                print("\n" + "=" * 60)
                print("STEP 3: Go to research/new")
                print("=" * 60)

                page.goto(f'{base_url}/research/new', timeout=60000)
                page.wait_for_load_state('networkidle')
                print(f"  URL: {page.url}")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d2_03_new_form.png')

                if '/research/new' in page.url:
                    print("\n" + "=" * 60)
                    print("STEP 4: Fill project form")
                    print("=" * 60)

                    title = page.locator('input[name="title"], input#title')
                    if title.count() > 0:
                        title.first.fill('Deployed Test - ' + time.strftime('%H:%M:%S'))
                        print("  Filled title")

                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d2_04_filled.png')

                    print("\n" + "=" * 60)
                    print("STEP 5: Submit form")
                    print("=" * 60)

                    submit = page.locator('button[type="submit"]')
                    if submit.count() > 0:
                        console_msgs.clear()
                        submit.first.click()
                        time.sleep(5)
                        page.wait_for_load_state('networkidle')

                        print(f"  URL after submit: {page.url}")
                        page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d2_05_result.png')

                        if '/research/' in page.url and '/new' not in page.url:
                            print("  SUCCESS: Project created!")
                        else:
                            # Check error
                            err = page.locator('.text-red-500, .text-red-600')
                            if err.count() > 0:
                                print(f"  ERROR: {err.first.inner_text()}")

            # Print console errors
            errors = [m for m in console_msgs if 'error' in m.lower()]
            if errors:
                print("\n" + "=" * 60)
                print("Console Errors:")
                print("=" * 60)
                for e in errors[:5]:
                    print(f"  {e[:150]}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d2_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_deployed()
