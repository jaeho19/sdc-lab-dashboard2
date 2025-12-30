"""Full test: Create project, delete it, verify dashboard updates"""
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
            print("=== STEP 1: Login ===")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login successful")

            # Count initial projects on dashboard
            print("\n=== STEP 2: Count initial dashboard projects ===")
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            initial_count = page.locator("a[href^='/research/']").count()
            print(f"Initial dashboard project links: {initial_count}")

            # Create a test project
            print("\n=== STEP 3: Create test project ===")
            page.goto(f"{BASE_URL}/research/new")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            test_title = f"DeleteTest-{int(time.time())}"
            page.locator('input').first.fill(test_title)
            print(f"Created project title: {test_title}")

            # Submit form
            page.locator('button:has-text("프로젝트 생성")').click()
            time.sleep(5)  # Wait for creation

            # Check if redirected to project detail
            current_url = page.url
            if "/research/" in current_url and "/new" not in current_url:
                print("[OK] Project created and redirected to detail page")

                # Find the delete button (icon button next to edit)
                print("\n=== STEP 4: Delete the project ===")
                edit_btn = page.locator('button:has-text("수정")').first
                parent = edit_btn.locator('xpath=..')
                buttons = parent.locator('button').all()

                if len(buttons) >= 2:
                    # Second button should be delete
                    delete_btn = buttons[1]
                    print("Clicking delete button...")
                    delete_btn.click()
                    time.sleep(1)

                    # Confirm delete
                    confirm_btn = page.locator('button:has-text("삭제")').last
                    if confirm_btn.count() > 0:
                        print("Clicking confirm delete...")
                        confirm_btn.click()
                        time.sleep(5)  # Wait for deletion and redirect

                        print(f"After delete URL: {page.url}")

                        # Verify deletion
                        print("\n=== STEP 5: Verify deletion ===")
                        page.goto(f"{BASE_URL}/research")
                        page.wait_for_load_state("networkidle")
                        time.sleep(2)

                        # Check if project is gone
                        found = page.locator(f'text="{test_title}"').count()
                        if found == 0:
                            print(f"[OK] Project '{test_title}' successfully deleted from research list")
                        else:
                            print(f"[X] Project still exists in research list")

                        # Check dashboard
                        print("\n=== STEP 6: Verify dashboard update ===")
                        page.goto(f"{BASE_URL}/dashboard")
                        page.wait_for_load_state("networkidle")
                        time.sleep(2)

                        final_count = page.locator("a[href^='/research/']").count()
                        found_on_dash = page.locator(f'text="{test_title}"').count()

                        print(f"Final dashboard project links: {final_count}")
                        print(f"Project found on dashboard: {found_on_dash > 0}")

                        if found_on_dash == 0:
                            print("\n[OK] SUCCESS: Delete and dashboard update working!")
                            print("=" * 50)
                        else:
                            print("\n[X] Project still showing on dashboard")

                        page.screenshot(path="/tmp/final_dashboard.png", full_page=True)
                    else:
                        print("[X] Could not find confirm button")
                else:
                    print("[X] Delete button not found")
            else:
                print(f"[X] Project creation failed. URL: {current_url}")

        except Exception as e:
            print(f"[X] Error: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path="/tmp/error.png", full_page=True)
        finally:
            browser.close()

if __name__ == "__main__":
    test()
