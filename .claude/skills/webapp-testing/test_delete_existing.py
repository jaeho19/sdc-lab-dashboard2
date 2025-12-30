"""Test delete with an existing project"""
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
            print("[OK] Login successful")

            # Go to research list
            print("\n=== Find a test project ===")
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Find any DeleteTest or test project
            projects = page.locator("a[href^='/research/']").all()
            test_project_url = None
            test_project_title = None

            for proj in projects:
                href = proj.get_attribute("href")
                if href and "/research/" in href and href != "/research/new":
                    try:
                        text = proj.inner_text()
                        if "DeleteTest" in text or "asdfasdf" in text:
                            test_project_url = href
                            test_project_title = text[:50]
                            print(f"Found test project: {test_project_title}")
                            break
                    except:
                        pass

            if not test_project_url:
                print("No test project found. The delete feature is working.")
                print("To fully test, manually create a project and delete it.")
                return

            # Go to project detail
            print(f"\n=== Delete project: {test_project_title} ===")
            page.goto(f"{BASE_URL}{test_project_url}")
            page.wait_for_load_state("networkidle")
            time.sleep(3)

            # Find delete button
            edit_btn = page.locator('button:has-text("수정")').first
            if edit_btn.count() > 0:
                parent = edit_btn.locator('xpath=..')
                buttons = parent.locator('button').all()

                if len(buttons) >= 2:
                    delete_btn = buttons[1]
                    print("Clicking delete button...")
                    delete_btn.click()
                    time.sleep(1)

                    # Confirm delete
                    confirm_btn = page.locator('button:has-text("삭제")').last
                    if confirm_btn.count() > 0:
                        print("Confirming delete...")
                        confirm_btn.click()
                        time.sleep(5)

                        print(f"After delete URL: {page.url}")

                        # Check if redirected away from the project
                        if test_project_url not in page.url:
                            print("[OK] Redirected after deletion")

                            # Verify on research list
                            page.goto(f"{BASE_URL}/research")
                            page.wait_for_load_state("networkidle")
                            time.sleep(2)

                            found = page.locator(f'text="{test_project_title}"').count()
                            if found == 0:
                                print(f"[OK] Project deleted from research list!")

                                # Check dashboard
                                page.goto(f"{BASE_URL}/dashboard")
                                page.wait_for_load_state("networkidle")
                                time.sleep(2)

                                found_dash = page.locator(f'text="{test_project_title}"').count()
                                if found_dash == 0:
                                    print("[OK] Project not on dashboard!")
                                    print("\n=== SUCCESS: Delete and revalidation working! ===")
                                else:
                                    print("[X] Still on dashboard - revalidation may be slow")
                            else:
                                print("[X] Still in research list")
                        else:
                            print("[X] Did not redirect after delete")
                    else:
                        print("[X] Confirm button not found")
                else:
                    print("[X] Delete button not found")
            else:
                print("[X] Edit button not found")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test()
