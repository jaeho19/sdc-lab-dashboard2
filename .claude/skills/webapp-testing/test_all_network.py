"""Test capturing ALL network activity during login."""
from playwright.sync_api import sync_playwright
import time
import json

def test_login():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture ALL network
        all_requests = []
        all_responses = []
        failed_requests = []

        def on_request(req):
            all_requests.append({
                'method': req.method,
                'url': req.url,
                'post_data': req.post_data[:200] if req.post_data else None
            })

        def on_response(res):
            all_responses.append({
                'status': res.status,
                'url': res.url
            })

        def on_failed(req):
            failed_requests.append({
                'url': req.url,
                'failure': str(req.failure)
            })

        page.on('request', on_request)
        page.on('response', on_response)
        page.on('requestfailed', on_failed)

        try:
            print("=" * 60)
            print("STEP 1: Load login page")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(3)
            print(f"  URL: {page.url}")

            # Clear network logs before login
            all_requests.clear()
            all_responses.clear()
            failed_requests.clear()

            print("\n" + "=" * 60)
            print("STEP 2: Fill and submit form")
            print("=" * 60)

            email_input = page.locator('#email')
            email_input.fill('jaeho19@gmail.com')

            password_input = page.locator('#password')
            password_input.fill('Cory0012')

            print("  Form filled")

            submit_btn = page.locator('button[type="submit"]')
            submit_btn.click()
            print("  Clicked submit...")

            # Wait for response
            time.sleep(10)

            print("\n" + "=" * 60)
            print("ALL REQUESTS MADE")
            print("=" * 60)
            for req in all_requests:
                print(f"  [{req['method']}] {req['url'][:100]}")
                if req['post_data']:
                    print(f"      POST: {req['post_data'][:100]}")

            print("\n" + "=" * 60)
            print("ALL RESPONSES RECEIVED")
            print("=" * 60)
            for res in all_responses:
                print(f"  [{res['status']}] {res['url'][:100]}")

            if failed_requests:
                print("\n" + "=" * 60)
                print("FAILED REQUESTS")
                print("=" * 60)
                for req in failed_requests:
                    print(f"  {req['url'][:80]}")
                    print(f"      Failure: {req['failure']}")

            print("\n" + "=" * 60)
            print("CURRENT STATE")
            print("=" * 60)
            print(f"  URL: {page.url}")
            btn_text = page.locator('button[type="submit"]').inner_text() if page.locator('button[type="submit"]').count() > 0 else 'N/A'
            print(f"  Button text: {btn_text}")

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/network_test.png')

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
