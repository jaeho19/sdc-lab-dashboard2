"""Test: Simple delete project test"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test_delete_simple():
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

            # 2. Go to Research page to see projects
            print("\n=== Step 2: Go to Research page ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(3)

            # Take screenshot
            page.screenshot(path="/tmp/research_list.png", full_page=True)
            print("Saved screenshot to /tmp/research_list.png")

            # Get all project links
            projects = page.locator("a[href^='/research/']").all()
            print(f"Found {len(projects)} projects on research page")

            # List the project titles
            for i, proj in enumerate(projects[:5]):  # Show first 5
                href = proj.get_attribute("href")
                text = proj.inner_text()[:50]
                print(f"  [{i+1}] {href}: {text}")

            # 3. Go to research/new to create a test project
            print("\n=== Step 3: Create test project ===")
            page.goto(f"{BASE_URL}/research/new")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Take screenshot of form
            page.screenshot(path="/tmp/new_project_form.png", full_page=True)
            print("Saved form screenshot to /tmp/new_project_form.png")

            # Check if form exists - look for title input by placeholder or label
            title_input = page.locator('input').first
            if title_input.count() > 0:
                test_title = f"DeleteTest-{int(time.time())}"
                title_input.fill(test_title)
                print(f"Filled title: {test_title}")

                # Fill description
                desc_input = page.locator('textarea[id="description"]')
                if desc_input.count() > 0:
                    desc_input.fill("Test project for deletion")

                # Select category
                category_btn = page.locator('button[role="combobox"]').first
                if category_btn.count() > 0:
                    category_btn.click()
                    time.sleep(1)
                    page.get_by_role("option").first.click()
                    time.sleep(0.5)

                # Submit
                submit_btn = page.locator('button:has-text("프로젝트 생성")')
                if submit_btn.count() > 0:
                    submit_btn.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    time.sleep(2)
                    print("[OK] Project created")

                    # Take screenshot
                    page.screenshot(path="/tmp/project_detail.png", full_page=True)

                    # 4. Now try to delete
                    print("\n=== Step 4: Delete project ===")
                    delete_btn = page.locator('button:has-text("삭제")').first
                    if delete_btn.count() > 0:
                        delete_btn.click()
                        time.sleep(1)

                        # Confirm in dialog
                        confirm_btn = page.locator('button:has-text("삭제")').last
                        if confirm_btn.count() > 0:
                            confirm_btn.click()
                            page.wait_for_load_state("networkidle", timeout=15000)
                            time.sleep(3)

                            # Check where we ended up
                            current_url = page.url
                            print(f"After delete, current URL: {current_url}")

                            # 5. Verify project is gone
                            print("\n=== Step 5: Verify deletion ===")
                            page.goto(f"{BASE_URL}/research")
                            page.wait_for_load_state("networkidle")
                            time.sleep(2)

                            # Search for the test project
                            test_found = page.locator(f"text={test_title}").count()
                            if test_found == 0:
                                print(f"[OK] Project '{test_title}' successfully deleted!")
                            else:
                                print(f"[X] Project '{test_title}' still exists!")

                            # 6. Check dashboard
                            print("\n=== Step 6: Verify dashboard ===")
                            page.goto(f"{BASE_URL}/dashboard")
                            page.wait_for_load_state("networkidle")
                            time.sleep(2)

                            test_on_dashboard = page.locator(f"text={test_title}").count()
                            if test_on_dashboard == 0:
                                print(f"[OK] Project not on dashboard!")
                            else:
                                print(f"[X] Project still on dashboard!")

                            page.screenshot(path="/tmp/final_dashboard.png", full_page=True)
                        else:
                            print("[X] Could not find confirm button")
                    else:
                        print("[X] Delete button not found")
                else:
                    print("[X] Submit button not found")
            else:
                print("[X] Title input not found")
                # Show what's on the page
                content = page.content()[:2000]
                print(f"Page content (first 2000 chars): {content}")

        except Exception as e:
            print(f"[X] Error: {e}")
            page.screenshot(path="/tmp/error.png", full_page=True)
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    test_delete_simple()
