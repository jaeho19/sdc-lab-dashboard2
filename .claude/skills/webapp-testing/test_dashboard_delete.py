"""Test: Delete project and verify dashboard is updated"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test_dashboard_delete():
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

            # 2. Go to dashboard and count ongoing projects
            print("\n=== Step 2: Check dashboard ongoing projects ===")
            page.goto(f"{BASE_URL}/dashboard")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Count projects in "진행중인 연구" section
            ongoing_section = page.locator("text=진행중인 연구").locator("xpath=..")
            initial_projects = ongoing_section.locator("a[href^='/research/']").all()
            initial_count = len(initial_projects)
            print(f"Dashboard shows {initial_count} ongoing projects")

            # 3. Go to Research page
            print("\n=== Step 3: Go to Research page ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Take screenshot
            page.screenshot(path="/tmp/research_page.png", full_page=True)

            # Find a test project to delete (look for any project with test-like name)
            # Or create a new one first
            print("\n=== Step 4: Create test project ===")
            page.click("text=새 프로젝트")
            page.wait_for_load_state("networkidle")
            time.sleep(1)

            # Fill project form
            test_title = f"Delete Test {int(time.time())}"
            page.fill('input[name="title"]', test_title)
            page.locator('textarea[name="description"]').fill("테스트용 프로젝트입니다.")

            # Select category - 논문 연구
            page.locator('button[role="combobox"]').first.click()
            page.wait_for_timeout(500)
            page.get_by_role("option", name="논문 연구").click()

            # Submit form
            page.click("text=등록")
            page.wait_for_url("**/research/**", timeout=30000)
            print(f"[OK] Created test project: {test_title}")

            # 5. Check dashboard count increased
            print("\n=== Step 5: Verify dashboard count increased ===")
            page.goto(f"{BASE_URL}/dashboard")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            ongoing_section = page.locator("text=진행중인 연구").locator("xpath=..")
            after_create_projects = ongoing_section.locator("a[href^='/research/']").all()
            after_create_count = len(after_create_projects)
            print(f"After creation: {after_create_count} projects (was {initial_count})")

            # 6. Go to the project detail page and delete
            print("\n=== Step 6: Delete the project ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Find and click the test project
            test_project_link = page.locator(f"text={test_title}").first
            if test_project_link.count() > 0:
                test_project_link.click()
                page.wait_for_load_state("networkidle")
                time.sleep(2)

                # Take screenshot before delete
                page.screenshot(path="/tmp/before_delete.png", full_page=True)

                # Find and click delete button
                delete_button = page.locator("text=삭제").first
                if delete_button.count() > 0:
                    delete_button.click()
                    page.wait_for_timeout(1000)

                    # Confirm delete in alert dialog
                    confirm_button = page.locator("button:has-text('삭제')").last
                    if confirm_button.count() > 0:
                        confirm_button.click()
                        page.wait_for_load_state("networkidle", timeout=10000)
                        time.sleep(3)
                        print("[OK] Delete confirmed")
                    else:
                        print("[X] Could not find confirm button")
                else:
                    print("[X] Could not find delete button")
            else:
                print(f"[X] Could not find project: {test_title}")

            # 7. Verify project is gone from dashboard
            print("\n=== Step 7: Verify dashboard updated ===")
            page.goto(f"{BASE_URL}/dashboard")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            ongoing_section = page.locator("text=진행중인 연구").locator("xpath=..")
            after_delete_projects = ongoing_section.locator("a[href^='/research/']").all()
            after_delete_count = len(after_delete_projects)
            print(f"After deletion: {after_delete_count} projects (was {after_create_count})")

            # Take final screenshot
            page.screenshot(path="/tmp/after_delete_dashboard.png", full_page=True)

            # Check if the test project still exists
            test_project_visible = page.locator(f"text={test_title}").count()

            print("\n=== RESULTS ===")
            print(f"Initial count: {initial_count}")
            print(f"After create: {after_create_count}")
            print(f"After delete: {after_delete_count}")
            print(f"Test project visible on dashboard: {test_project_visible > 0}")

            if after_delete_count == initial_count and test_project_visible == 0:
                print("\n[OK] SUCCESS: Dashboard correctly updated after deletion!")
            else:
                print("\n[X] ISSUE: Dashboard may not have updated correctly")

        except Exception as e:
            print(f"[X] Error: {e}")
            page.screenshot(path="/tmp/error.png", full_page=True)
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    test_dashboard_delete()
