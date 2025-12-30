"""Check all buttons on project detail page"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Add cache-busting
        page.set_extra_http_headers({"Cache-Control": "no-cache, no-store"})

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        try:
            page.goto(f"{BASE_URL}/login?t={int(time.time())}")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login")

            # Go to project
            page.goto(f"{BASE_URL}/research/c6d33735-5a60-416c-b03e-0e1c2e9cc70f?t={int(time.time())}")
            page.wait_for_load_state("networkidle")
            time.sleep(5)

            # Get all buttons
            print("\n=== ALL BUTTONS ===")
            buttons = page.locator('button').all()
            for i, btn in enumerate(buttons):
                try:
                    text = btn.inner_text().strip()
                    classes = btn.get_attribute("class") or ""
                    visible = btn.is_visible()
                    print(f"[{i}] text='{text}' visible={visible}")
                except Exception as e:
                    print(f"[{i}] Error: {e}")

            # Also check for DeleteProjectButton component
            print("\n=== HTML Check ===")
            html = page.content()
            if "DeleteProjectButton" in html:
                print("Found 'DeleteProjectButton' in HTML")
            else:
                print("No 'DeleteProjectButton' in HTML")

            if "canDelete" in html:
                print("Found 'canDelete' in HTML")

            # Check for any element with "삭제"
            delete_elements = page.locator('*:has-text("삭제")').all()
            print(f"\nElements with '삭제': {len(delete_elements)}")

            # Console logs
            print("\n=== Console ===")
            for log in console_logs:
                if "delete" in log.lower() or "admin" in log.lower():
                    print(log)

            page.screenshot(path="/tmp/button_check.png", full_page=True)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test()
