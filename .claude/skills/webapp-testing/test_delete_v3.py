"""Test: Delete project and verify dashboard update - v3"""
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

            # 2. Count initial dashboard projects
            print("\n=== Step 2: Count initial dashboard projects ===")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Get project count from research section
            initial_count = page.locator("a[href^='/research/']").count()
            print(f"Initial projects on page: {initial_count}")

            # 3. Create test project
            print("\n=== Step 3: Create test project ===")
            page.goto(f"{BASE_URL}/research/new")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            test_title = f"DeleteTest-{int(time.time())}"

            # Fill title
            page.locator('input').first.fill(test_title)
            print(f"Title: {test_title}")

            # Click submit and wait for navigation
            page.locator('button:has-text("프로젝트 생성")').click()

            # Wait for redirect to project detail page
            print("Waiting for project creation...")
            page.wait_for_url("**/research/**", timeout=30000)
            time.sleep(3)

            current_url = page.url
            print(f"Current URL after creation: {current_url}")

            # Check if we're on a project detail page (not /new)
            if "/research/new" not in current_url and "/research/" in current_url:
                print("[OK] Redirected to project detail page")

                # Take screenshot of detail page
                page.screenshot(path="/tmp/project_created.png", full_page=True)

                # 4. Look for delete button
                print("\n=== Step 4: Find and click delete button ===")

                # List all buttons on page
                buttons = page.locator('button').all()
                print(f"Found {len(buttons)} buttons on page")
                for i, btn in enumerate(buttons[:10]):
                    try:
                        text = btn.inner_text()
                        print(f"  Button {i}: '{text}'")
                    except:
                        pass

                # Try to find delete button
                delete_btn = page.locator('button:has-text("삭제")').first
                if delete_btn.count() > 0:
                    print("Found delete button, clicking...")
                    delete_btn.click()
                    time.sleep(1)

                    # Take screenshot of dialog
                    page.screenshot(path="/tmp/delete_dialog.png", full_page=True)

                    # Find confirm button in dialog
                    confirm_btns = page.locator('button:has-text("삭제")').all()
                    print(f"Found {len(confirm_btns)} buttons with '삭제'")

                    if len(confirm_btns) >= 2:
                        # Click the last one (confirm in dialog)
                        confirm_btns[-1].click()
                        print("Clicked confirm delete")

                        # Wait for redirect
                        time.sleep(5)

                        final_url = page.url
                        print(f"After delete URL: {final_url}")

                        # 5. Verify on research list
                        print("\n=== Step 5: Verify deletion ===")
                        page.goto(f"{BASE_URL}/research")
                        page.wait_for_load_state("networkidle")
                        time.sleep(2)

                        # Check if project exists
                        found = page.locator(f'text="{test_title}"').count()
                        if found == 0:
                            print(f"[OK] Project '{test_title}' deleted from research list!")
                        else:
                            print(f"[X] Project '{test_title}' still in research list")

                        # 6. Check dashboard
                        print("\n=== Step 6: Check dashboard ===")
                        page.goto(f"{BASE_URL}/dashboard")
                        page.wait_for_load_state("networkidle")
                        time.sleep(2)

                        final_count = page.locator("a[href^='/research/']").count()
                        print(f"Final projects on dashboard: {final_count}")

                        found_on_dash = page.locator(f'text="{test_title}"').count()
                        if found_on_dash == 0:
                            print(f"[OK] Project not on dashboard!")
                            print("\n=== SUCCESS: Delete and dashboard update working! ===")
                        else:
                            print(f"[X] Project still on dashboard")

                        page.screenshot(path="/tmp/final_state.png", full_page=True)
                    else:
                        print("[X] Could not find confirm button")
                else:
                    print("[X] Delete button not found on project detail page")
                    print("This might mean the deployment with delete button is not yet live")
            else:
                print(f"[X] Did not redirect properly. URL: {current_url}")
                page.screenshot(path="/tmp/after_submit.png", full_page=True)

        except Exception as e:
            print(f"[X] Error: {e}")
            page.screenshot(path="/tmp/error.png", full_page=True)
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    test_delete()
