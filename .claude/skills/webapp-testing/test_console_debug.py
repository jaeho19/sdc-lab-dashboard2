"""Test: Capture console logs to debug delete permission"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test_console():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        try:
            # 1. Login
            print("\n=== Step 1: Login ===")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login successful")

            # 2. Go to a project detail page
            print("\n=== Step 2: Go to project detail ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Find first real project
            projects = page.locator("a[href^='/research/']").all()
            project_link = None
            for proj in projects:
                href = proj.get_attribute("href")
                if href and "/research/" in href and href != "/research/new":
                    project_link = href
                    break

            if project_link:
                print(f"Going to: {project_link}")
                page.goto(f"{BASE_URL}{project_link}")
                page.wait_for_load_state("networkidle")
                time.sleep(5)  # Wait for JS to execute and log

                # Print console logs
                print("\n=== Console Logs ===")
                for log in console_logs:
                    if "user" in log.lower() or "admin" in log.lower() or "creator" in log.lower() or "member" in log.lower() or "delete" in log.lower():
                        print(log)

                # Check for delete button
                delete_btn = page.locator('button:has-text("삭제")')
                print(f"\nDelete buttons found: {delete_btn.count()}")

                # Take screenshot
                page.screenshot(path="/tmp/console_debug.png", full_page=True)

        except Exception as e:
            print(f"[X] Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_console()
