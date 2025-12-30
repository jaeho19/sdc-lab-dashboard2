"""Test that captures error messages on login failure."""
from playwright.sync_api import sync_playwright
import time

def test_login():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_msgs = []
        page.on('console', lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))

        try:
            print("=" * 60)
            print("Loading login page...")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n" + "=" * 60)
            print("Filling and submitting form...")
            print("=" * 60)
            page.locator('#email').fill('jaeho19@gmail.com')
            page.locator('#password').fill('Cory0012')
            page.locator('button[type="submit"]').click()

            # Wait and monitor
            print("\nMonitoring for 30 seconds...")
            for i in range(30):
                time.sleep(1)

                # Check for error message
                error = page.locator('.text-red-600, .text-red-500, .bg-red-50')
                if error.count() > 0:
                    err_text = error.first.inner_text()
                    if err_text.strip():
                        print(f"  [{i+1}s] ERROR DISPLAYED: {err_text}")
                        break

                # Check URL change
                if '/dashboard' in page.url:
                    print(f"  [{i+1}s] SUCCESS: Redirected to dashboard!")
                    break

                # Check button state
                btn = page.locator('button[type="submit"]')
                if btn.count() > 0:
                    btn_text = btn.inner_text()
                    # Button shows "로그인" when not loading
                    if '로그인' in btn_text and '중' not in btn_text:
                        # Check again for error
                        error2 = page.locator('.text-red-600, .text-red-500, .bg-red-50, .border-red-200')
                        if error2.count() > 0:
                            err_text2 = error2.first.inner_text()
                            print(f"  [{i+1}s] ERROR (after button reset): {err_text2}")
                        else:
                            print(f"  [{i+1}s] Button reverted but no error message")
                        break
            else:
                print("  Timeout after 30 seconds")

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/error_display.png')

            # Check page content for any error
            print("\n" + "=" * 60)
            print("Checking page for error elements...")
            print("=" * 60)

            # Various error selectors
            selectors = [
                '.text-red-600',
                '.text-red-500',
                '.bg-red-50',
                '.border-red-200',
                '[role="alert"]',
                '.text-destructive'
            ]

            for sel in selectors:
                elem = page.locator(sel)
                count = elem.count()
                if count > 0:
                    text = elem.first.inner_text()
                    print(f"  {sel}: {count} found - '{text[:100]}'")

            # Console messages
            errors = [m for m in console_msgs if 'error' in m.lower()]
            if errors:
                print("\n" + "=" * 60)
                print("Console errors:")
                print("=" * 60)
                for e in errors[:5]:
                    print(f"  {e[:150]}")

            print(f"\nFinal URL: {page.url}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_login()
