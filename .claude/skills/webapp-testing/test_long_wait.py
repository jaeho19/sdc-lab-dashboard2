"""Test with longer wait to capture timeout error."""
from playwright.sync_api import sync_playwright
import time

def test_login():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture console
        console_msgs = []
        page.on('console', lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))

        responses = []
        def on_response(res):
            responses.append({'status': res.status, 'url': res.url})

        page.on('response', on_response)

        try:
            print("Loading login page...")
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            responses.clear()

            print("Filling form...")
            page.locator('#email').fill('jaeho19@gmail.com')
            page.locator('#password').fill('Cory0012')

            print("Clicking submit...")
            page.locator('button[type="submit"]').click()

            print("Waiting up to 60 seconds for response...")
            start = time.time()
            while time.time() - start < 60:
                time.sleep(2)
                elapsed = int(time.time() - start)
                url = page.url

                # Check for any responses
                new_responses = [r for r in responses if '/login' in r['url'] or 'dashboard' in r['url']]
                if new_responses:
                    print(f"  [{elapsed}s] Response received: {new_responses[-1]}")

                # Check URL change
                if '/login' not in url:
                    print(f"  [{elapsed}s] URL changed to: {url}")
                    break

                # Check for error message
                error = page.locator('.text-red-600, .text-red-500, .bg-red-50')
                if error.count() > 0:
                    err_text = error.first.inner_text()
                    if err_text.strip():
                        print(f"  [{elapsed}s] ERROR: {err_text}")
                        break

                # Check button state
                btn = page.locator('button[type="submit"]')
                if btn.count() > 0:
                    btn_text = btn.inner_text()
                    if '로그인' in btn_text and '중' not in btn_text:
                        print(f"  [{elapsed}s] Button reverted (login failed)")
                        break

                print(f"  [{elapsed}s] Still waiting...")
            else:
                print("  Timeout after 60 seconds")

            # Final state
            print("\n" + "=" * 60)
            print("FINAL STATE")
            print("=" * 60)
            print(f"  URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/long_wait.png')

            # Check for any error messages
            errors = [m for m in console_msgs if 'error' in m.lower()]
            if errors:
                print("\nConsole errors:")
                for e in errors[:10]:
                    print(f"  {e[:150]}")

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
