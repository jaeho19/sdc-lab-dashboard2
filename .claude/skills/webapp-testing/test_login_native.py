"""Test login using native Playwright typing."""
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

        page.on('console', lambda msg: console_msgs.append(f"[{msg.type}] {msg.text}"))
        page.on('request', lambda req: network_requests.append(f"[REQ] {req.method} {req.url}"))
        page.on('response', lambda res: network_requests.append(f"[RES {res.status}] {res.url}"))

        try:
            print("=" * 60)
            print("STEP 1: Load login page")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(3)  # Extra wait for hydration
            print(f"  URL: {page.url}")

            print("\n" + "=" * 60)
            print("STEP 2: Type into form fields (native)")
            print("=" * 60)

            # Click and type into email field
            email_input = page.locator('#email')
            email_input.click()
            time.sleep(0.5)
            email_input.fill('')  # Clear first
            email_input.type('jaeho19@gmail.com', delay=50)  # Type with delay
            print("  Typed email")

            # Click and type into password field
            password_input = page.locator('#password')
            password_input.click()
            time.sleep(0.5)
            password_input.fill('')  # Clear first
            password_input.type('Cory0012', delay=50)  # Type with delay
            print("  Typed password")

            time.sleep(1)
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/native_01_filled.png')

            print("\n" + "=" * 60)
            print("STEP 3: Submit form")
            print("=" * 60)

            # Clear network log to focus on login request
            network_requests.clear()

            # Click submit button
            submit_btn = page.locator('button[type="submit"]')
            print(f"  Submit button text: {submit_btn.inner_text()}")
            submit_btn.click()
            print("  Clicked submit...")

            # Wait for network activity and URL change
            time.sleep(2)
            page.wait_for_load_state('networkidle', timeout=30000)

            # Monitor for 15 seconds
            for i in range(15):
                time.sleep(1)
                current_url = page.url
                btn_text = page.locator('button[type="submit"]').inner_text() if page.locator('button[type="submit"]').count() > 0 else 'N/A'
                print(f"  [{i+1}s] URL: {current_url}, Button: {btn_text}")

                if '/dashboard' in current_url:
                    print("  SUCCESS: Redirected to dashboard!")
                    break

                if '/login' not in current_url:
                    print(f"  Redirected to: {current_url}")
                    break

                # Check for error
                error = page.locator('.text-red-600, .text-red-500, .bg-red-50')
                if error.count() > 0:
                    err_text = error.first.inner_text()
                    if err_text.strip():
                        print(f"  ERROR: {err_text}")
                        break

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/native_02_result.png')

            print("\n" + "=" * 60)
            print("SUPABASE/AUTH NETWORK ACTIVITY")
            print("=" * 60)
            auth_requests = [r for r in network_requests if 'supabase' in r.lower() or 'auth' in r.lower()]
            if auth_requests:
                for req in auth_requests[:15]:
                    print(f"  {req[:120]}")
            else:
                print("  No Supabase/auth requests detected")

            print("\n" + "=" * 60)
            print("CONSOLE MESSAGES")
            print("=" * 60)
            relevant = [m for m in console_msgs if 'error' in m.lower() or 'supabase' in m.lower() or 'auth' in m.lower()]
            if relevant:
                for m in relevant[:10]:
                    print(f"  {m[:150]}")
            else:
                print("  No relevant console messages")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/native_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_login()
