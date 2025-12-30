"""Check for trash icon button specifically"""
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

            # Look for button with svg inside
            buttons_with_svg = page.locator('button:has(svg)').all()
            print(f"\nButtons with SVG: {len(buttons_with_svg)}")

            # Check for trash-2 icon specifically
            trash_buttons = page.locator('button:has(svg.lucide-trash-2)').count()
            print(f"Buttons with lucide-trash-2: {trash_buttons}")

            # Check buttons near the edit button
            edit_area = page.locator('div.flex.gap-2').first
            if edit_area.count() > 0:
                buttons_in_area = edit_area.locator('button').all()
                print(f"\nButtons in header area: {len(buttons_in_area)}")
                for i, btn in enumerate(buttons_in_area):
                    text = btn.inner_text().strip()
                    has_svg = btn.locator('svg').count() > 0
                    print(f"  [{i}] text='{text}' has_svg={has_svg}")

            # Screenshot of top area
            page.screenshot(path="/tmp/header_area.png", clip={"x": 0, "y": 0, "width": 1200, "height": 200})
            print("\nScreenshot of header saved to /tmp/header_area.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test()
