"""Test: Delete an existing project"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test_delete():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

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

            # 2. Go to research page
            print("\n=== Step 2: Go to research page ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Find a project
            projects = page.locator("a[href^='/research/']").all()
            print(f"Found {len(projects)} project links")

            test_project = None
            for proj in projects:
                href = proj.get_attribute("href")
                if href and "/research/" in href and href != "/research/new":
                    test_project = href
                    break

            if test_project:
                # 3. Go to project detail
                print(f"\n=== Step 3: Navigate to {test_project} ===")
                page.goto(f"{BASE_URL}{test_project}")
                page.wait_for_load_state("networkidle")
                time.sleep(3)
                page.screenshot(path="/tmp/project_detail.png", full_page=True)

                # 4. List buttons
                print("\n=== Step 4: List all buttons ===")
                buttons = page.locator('button').all()
                for i, btn in enumerate(buttons[:15]):
                    try:
                        text = btn.inner_text().strip()
                        if text:
                            print(f"  [{i}] {text}")
                    except:
                        pass

                # Look for delete
                delete_btn = page.locator('button:has-text("삭제")')
                print(f"\nDelete buttons found: {delete_btn.count()}")

        except Exception as e:
            print(f"[X] Error: {e}")
            page.screenshot(path="/tmp/error.png", full_page=True)
        finally:
            browser.close()

if __name__ == "__main__":
    test_delete()
