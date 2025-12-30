"""Debug login process on deployed site."""
from playwright.sync_api import sync_playwright
import time

def test_login():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture console and network
        console_msgs = []
        network_requests = []
        network_failures = []

        page.on('console', lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
        page.on('request', lambda req: network_requests.append(f"[REQ] {req.method} {req.url}") if 'supabase' in req.url or 'auth' in req.url else None)
        page.on('response', lambda res: network_requests.append(f"[RES {res.status}] {res.url}") if 'supabase' in res.url or 'auth' in res.url else None)
        page.on('requestfailed', lambda req: network_failures.append(f"[FAIL] {req.url} - {req.failure}"))

        try:
            print("=" * 60)
            print("STEP 1: Load login page")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print(f"  URL: {page.url}")

            print("\n" + "=" * 60)
            print("STEP 2: Fill login form with JavaScript")
            print("=" * 60)

            # Use JavaScript to fill form (more reliable)
            page.evaluate("""
                document.querySelector('#email').value = 'jaeho19@gmail.com';
                document.querySelector('#email').dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('#password').value = 'Cory0012';
                document.querySelector('#password').dispatchEvent(new Event('input', { bubbles: true }));
            """)
            time.sleep(1)

            # Verify form values
            email_val = page.evaluate("document.querySelector('#email').value")
            pwd_val = page.evaluate("document.querySelector('#password').value")
            print(f"  Email value: {email_val}")
            print(f"  Password value: {'*' * len(pwd_val)}")

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/debug_01_filled.png')

            print("\n" + "=" * 60)
            print("STEP 3: Submit form")
            print("=" * 60)

            # Clear previous requests
            network_requests.clear()
            network_failures.clear()

            # Click submit
            page.click('button[type="submit"]')
            print("  Clicked submit...")

            # Wait and monitor
            for i in range(20):
                time.sleep(1)
                current_url = page.url
                print(f"  [{i+1}s] URL: {current_url}")

                if '/dashboard' in current_url:
                    print("  SUCCESS: Redirected to dashboard!")
                    break

                if '/login' not in current_url:
                    print(f"  Redirected to: {current_url}")
                    break

                # Check button state
                btn_text = page.locator('button[type="submit"]').inner_text()
                if '로그인' in btn_text and '중' not in btn_text:
                    # Button reverted, might be error
                    error = page.locator('.text-red-600, .text-red-500, [role="alert"]')
                    if error.count() > 0:
                        print(f"  ERROR on page: {error.first.inner_text()}")
                    break

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/debug_02_result.png')

            print("\n" + "=" * 60)
            print("NETWORK ACTIVITY")
            print("=" * 60)
            for req in network_requests[:20]:
                print(f"  {req[:100]}")

            if network_failures:
                print("\n  FAILURES:")
                for fail in network_failures:
                    print(f"  {fail}")

            print("\n" + "=" * 60)
            print("CONSOLE ERRORS")
            print("=" * 60)
            errors = [m for m in console_msgs if 'error' in m.lower()]
            if errors:
                for e in errors[:10]:
                    print(f"  {e[:150]}")
            else:
                print("  No errors")

            print("\n" + "=" * 60)
            print("FINAL STATE")
            print("=" * 60)
            print(f"  URL: {page.url}")
            email_final = page.evaluate("document.querySelector('#email')?.value || 'N/A'")
            print(f"  Email field value: {email_final}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/debug_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_login()
