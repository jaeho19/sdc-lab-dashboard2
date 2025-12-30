"""Test deleting Fix Test - 194640 project."""
from playwright.sync_api import sync_playwright
import time

def test():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # Login as Kim Eunsol
            print("=" * 60)
            print("Logging in as Kim Eunsol...")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.locator('#email').fill('rdt9690@uos.ac.kr')
            page.locator('#password').fill('SDCLAB03')
            page.locator('button[type="submit"]').click()
            page.wait_for_url('**/dashboard**', timeout=30000)
            print("  SUCCESS: Logged in!")

            # Navigate to Kim Eunsol's detail page
            print("\n" + "=" * 60)
            print("Navigating to Kim Eunsol's member page...")
            print("=" * 60)
            page.goto(f'{base_url}/members/991cdf4b-862d-4885-88b0-2278142aac39', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            # Take screenshot before deletion
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/delete_before.png')

            # Find "Fix Test - 194640" project and its delete button
            print("\n" + "=" * 60)
            print("Looking for 'Fix Test - 194640' project...")
            print("=" * 60)

            # Find the project item containing "Fix Test - 194640"
            fix_test_project = page.locator('text=Fix Test - 194640').first
            if fix_test_project.count() > 0:
                print("  FOUND: 'Fix Test - 194640' project")

                # Find the parent container and then the delete button within it
                # The structure is: div.p-3 > div (header with title and buttons) > div (buttons) > button (delete)
                project_row = page.locator('div.p-3:has-text("Fix Test - 194640")').first
                delete_btn = project_row.locator('button').last  # Delete button is typically last

                print("\n" + "=" * 60)
                print("Clicking delete button...")
                print("=" * 60)
                delete_btn.click()
                time.sleep(1)

                # Take screenshot of confirmation dialog
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/delete_dialog.png')

                # Check if AlertDialog appeared
                dialog = page.locator('role=alertdialog')
                if dialog.count() > 0:
                    print("  AlertDialog appeared!")

                    # Look for the confirm delete button
                    confirm_btn = page.locator('button:has-text("삭제")').last
                    print("  Clicking confirm delete button...")
                    confirm_btn.click()

                    # Wait for deletion and page reload
                    time.sleep(3)
                    page.wait_for_load_state('networkidle')

                    # Take screenshot after deletion
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/delete_after.png')

                    # Check if project is gone
                    print("\n" + "=" * 60)
                    print("Verifying deletion...")
                    print("=" * 60)
                    fix_test_after = page.locator('text=Fix Test - 194640')
                    if fix_test_after.count() == 0:
                        print("  SUCCESS: 'Fix Test - 194640' has been deleted!")
                    else:
                        print("  STILL EXISTS: Project was not deleted")
                else:
                    print("  ERROR: AlertDialog did not appear")
            else:
                print("  NOT FOUND: 'Fix Test - 194640' project not found")
                print("  (It may have already been deleted)")

            # Final verification - list remaining projects
            print("\n" + "=" * 60)
            print("Remaining projects:")
            print("=" * 60)
            project_items = page.locator('div.p-3.rounded-lg.border').all()
            for i, item in enumerate(project_items):
                title = item.locator('h4').first.inner_text()
                print(f"  {i+1}. {title}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/delete_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
