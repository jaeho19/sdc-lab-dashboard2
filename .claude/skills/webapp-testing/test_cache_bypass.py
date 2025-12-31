"""Test with cache bypass headers"""
from playwright.sync_api import sync_playwright
import time
import random

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Set cache control headers
        context.set_extra_http_headers({
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
        })

        page = context.new_page()

        try:
            # Add random query param to bypass cache
            cache_bust = f"?_={random.randint(100000, 999999)}"

            # Login
            print("=== Login ===")
            page.goto(f"{BASE_URL}/login{cache_bust}")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login")

            # Check dashboard with cache bypass
            print("\n=== Dashboard (with cache bypass) ===")
            page.goto(f"{BASE_URL}/dashboard{cache_bust}")
            page.wait_for_load_state("networkidle")
            time.sleep(3)

            # Find DeleteTest items
            delete_tests = page.locator('text=/DeleteTest/').all()
            print(f"DeleteTest items on dashboard: {len(delete_tests)}")

            for dt in delete_tests:
                try:
                    text = dt.inner_text()[:50]
                    print(f"  - {text}")
                except:
                    pass

            page.screenshot(path="/tmp/cache_bypass_dashboard.png", full_page=True)
            print("Screenshot: /tmp/cache_bypass_dashboard.png")

            # Check research page
            print("\n=== Research Page (with cache bypass) ===")
            page.goto(f"{BASE_URL}/research{cache_bust}")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Find DeleteTest items
            delete_tests_research = page.locator('text=/DeleteTest/').all()
            print(f"DeleteTest items on research: {len(delete_tests_research)}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test()
