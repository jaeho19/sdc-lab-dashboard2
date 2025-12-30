"""Check DOM structure around edit button"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login")

            page.goto(f"{BASE_URL}/research/c6d33735-5a60-416c-b03e-0e1c2e9cc70f")
            page.wait_for_load_state("networkidle")
            time.sleep(5)

            # Find the Edit button and get its parent
            edit_btn = page.locator('button:has-text("수정")').first
            if edit_btn.count() > 0:
                parent = edit_btn.locator('xpath=..')
                parent_html = parent.inner_html()
                print("\n=== Parent of Edit button ===")
                print(parent_html[:500])

                # Check siblings
                siblings = parent.locator('button').all()
                print(f"\nSiblings count: {len(siblings)}")

            # Also get the full HTML of header area
            header = page.locator('div.flex.items-start.justify-between').first
            if header.count() > 0:
                header_html = header.inner_html()
                print("\n=== Header HTML ===")
                print(header_html[:1000])

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test()
