"""Capture the actual server response for login."""
from playwright.sync_api import sync_playwright
import time
import json

def test_login():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        responses_data = []

        def capture_response(response):
            try:
                if '/login' in response.url:
                    body = None
                    try:
                        body = response.text()[:500]
                    except:
                        body = "(could not read body)"
                    responses_data.append({
                        'url': response.url,
                        'status': response.status,
                        'headers': dict(response.headers),
                        'body_preview': body
                    })
            except Exception as e:
                responses_data.append({'error': str(e)})

        page.on('response', capture_response)

        try:
            print("Loading login page...")
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            responses_data.clear()

            print("Submitting login...")
            page.locator('#email').fill('jaeho19@gmail.com')
            page.locator('#password').fill('Cory0012')
            page.locator('button[type="submit"]').click()

            # Wait for response
            time.sleep(5)

            print("\n" + "=" * 60)
            print("CAPTURED RESPONSES:")
            print("=" * 60)
            for r in responses_data:
                print(json.dumps(r, indent=2, default=str)[:500])
                print("-" * 40)

            # Also capture page state
            print("\n" + "=" * 60)
            print("PAGE STATE:")
            print("=" * 60)

            # Get any error elements
            page_html = page.content()
            if 'text-red' in page_html:
                print("  Found 'text-red' in page HTML")
            if 'error' in page_html.lower():
                print("  Found 'error' in page HTML")

            # Check specific elements
            error_div = page.locator('.text-red-600')
            if error_div.count() > 0:
                print(f"  Error div text: {error_div.first.inner_text()}")
            else:
                print("  No .text-red-600 error div found")

            print(f"\n  Final URL: {page.url}")

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/response_capture.png')

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
