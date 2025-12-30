"""Test delete button on localhost"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "http://localhost:3010"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        try:
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login")

            # Go to a project
            page.goto(f"{BASE_URL}/research/c6d33735-5a60-416c-b03e-0e1c2e9cc70f")
            page.wait_for_load_state("networkidle")
            time.sleep(5)

            # Check console
            print("\n=== Console ===")
            for log in console_logs:
                if "candelete" in log.lower() or "admin" in log.lower() or "render" in log.lower():
                    print(log)

            # Check for delete button
            delete_btns = page.locator('button:has-text("삭제")').count()
            trash_btns = page.locator('button:has(svg.lucide-trash-2)').count()
            print(f"\nDelete buttons (text): {delete_btns}")
            print(f"Trash icon buttons: {trash_btns}")

            # Take screenshot
            page.screenshot(path="/tmp/local_delete.png", full_page=True)
            print("Screenshot saved to /tmp/local_delete.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/tmp/error_local.png", full_page=True)
        finally:
            browser.close()

if __name__ == "__main__":
    test()
