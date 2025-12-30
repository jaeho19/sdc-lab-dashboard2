"""Check the second button in header"""
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

            # Find Edit button and check siblings
            edit_btn = page.locator('button:has-text("수정")').first
            if edit_btn.count() > 0:
                parent = edit_btn.locator('xpath=..')
                buttons = parent.locator('button').all()

                print(f"Found {len(buttons)} buttons in the header div:")
                for i, btn in enumerate(buttons):
                    outer_html = btn.evaluate("el => el.outerHTML")
                    print(f"\n=== Button {i} ===")
                    print(outer_html[:500])

                    # Check if it's visible
                    visible = btn.is_visible()
                    print(f"Visible: {visible}")

                    # Try clicking to see if it opens dialog
                    if i == 1:  # Second button (should be delete)
                        print("Attempting click on second button...")
                        btn.click()
                        time.sleep(1)

                        # Check for dialog
                        dialog = page.locator('[role="dialog"], [role="alertdialog"]')
                        if dialog.count() > 0:
                            print("Dialog appeared!")
                            dialog_text = dialog.inner_text()
                            print(f"Dialog text: {dialog_text[:200]}")

                        page.screenshot(path="/tmp/after_click.png")
                        print("Screenshot saved to /tmp/after_click.png")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    test()
