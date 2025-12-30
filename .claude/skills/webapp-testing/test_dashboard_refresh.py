"""Test: Check if dashboard 진행중인 연구 section updates after delete"""
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
            # Login
            print("=== Login ===")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login")

            # Check dashboard "진행중인 연구" section
            print("\n=== Dashboard Before ===")
            page.goto(f"{BASE_URL}/dashboard")
            page.wait_for_load_state("networkidle")
            time.sleep(3)

            # Find "진행 중인 연구" section
            ongoing_section = page.locator('text=진행 중인 연구').first
            if ongoing_section.count() > 0:
                parent = ongoing_section.locator('xpath=ancestor::div[contains(@class, "Card") or contains(@class, "card")]').first
                if parent.count() > 0:
                    projects = parent.locator('a[href^="/research/"]').all()
                    print(f"Projects in '진행 중인 연구': {len(projects)}")
                    for i, proj in enumerate(projects[:10]):
                        text = proj.inner_text()[:50]
                        print(f"  [{i+1}] {text}")

            page.screenshot(path="/tmp/dashboard_before_delete.png", full_page=True)

            # List all DeleteTest projects
            print("\n=== Finding DeleteTest projects ===")
            delete_tests = page.locator('text=/DeleteTest/').all()
            print(f"Found {len(delete_tests)} DeleteTest items on dashboard")

            # Go to research page and find DeleteTest projects
            print("\n=== Research Page ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Find DeleteTest project links
            all_links = page.locator('a[href^="/research/"]').all()
            delete_test_link = None
            delete_test_title = None

            for link in all_links:
                try:
                    text = link.inner_text()
                    href = link.get_attribute("href")
                    if "DeleteTest" in text and href != "/research/new":
                        delete_test_link = href
                        delete_test_title = text[:50]
                        print(f"Found: {delete_test_title} -> {href}")
                        break
                except:
                    pass

            if delete_test_link:
                # Delete this project
                print(f"\n=== Deleting: {delete_test_title} ===")
                page.goto(f"{BASE_URL}{delete_test_link}")
                page.wait_for_load_state("networkidle")
                time.sleep(3)

                # Find and click delete button
                edit_btn = page.locator('button:has-text("수정")').first
                if edit_btn.count() > 0:
                    parent = edit_btn.locator('xpath=..')
                    buttons = parent.locator('button').all()
                    if len(buttons) >= 2:
                        buttons[1].click()
                        time.sleep(1)

                        # Confirm delete
                        confirm = page.locator('button:has-text("삭제")').last
                        if confirm.count() > 0:
                            confirm.click()
                            time.sleep(5)
                            print("[OK] Delete confirmed")

                            # Check dashboard immediately
                            print("\n=== Dashboard After Delete ===")
                            page.goto(f"{BASE_URL}/dashboard")
                            page.wait_for_load_state("networkidle")
                            time.sleep(3)

                            page.screenshot(path="/tmp/dashboard_after_delete.png", full_page=True)

                            # Check if deleted project is still visible
                            still_visible = page.locator(f'text="{delete_test_title}"').count()
                            print(f"Deleted project still visible: {still_visible > 0}")

                            # Count DeleteTest items now
                            delete_tests_after = page.locator('text=/DeleteTest/').all()
                            print(f"DeleteTest items now: {len(delete_tests_after)}")

                            if still_visible > 0:
                                print("\n[X] ISSUE: Dashboard not updated after delete!")
                            else:
                                print("\n[OK] Dashboard updated correctly!")
            else:
                print("No DeleteTest project found to test")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    test()
