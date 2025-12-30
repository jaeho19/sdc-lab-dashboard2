"""Test deleting Verify Fix - 194824 project."""
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
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/before_delete_verify.png')

            # Count projects before
            projects_before = page.locator('div.p-3.rounded-lg.border').count()
            print(f"  Projects before deletion: {projects_before}")

            # Find "Verify Fix" project
            print("\n" + "=" * 60)
            print("Looking for 'Verify Fix - 194824' project...")
            print("=" * 60)

            verify_project = page.locator('text=Verify Fix - 194824').first
            if verify_project.count() > 0:
                print("  FOUND: 'Verify Fix - 194824' project")

                # Find the delete button in the same row
                project_row = page.locator('div.p-3:has-text("Verify Fix - 194824")').first
                delete_btn = project_row.locator('button.h-8.w-8').first

                print("\n  Clicking delete button...")
                delete_btn.click()
                time.sleep(1)

                # Take screenshot of dialog
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/delete_verify_dialog.png')

                # Check if AlertDialog appeared
                dialog = page.locator('[role="alertdialog"]')
                if dialog.count() > 0:
                    print("  AlertDialog appeared!")

                    # Click the red delete button
                    delete_confirm = dialog.locator('button:has-text("삭제")').last
                    print("  Clicking confirm delete button...")
                    delete_confirm.click()

                    # Wait for deletion and page reload
                    print("  Waiting for deletion to complete...")
                    time.sleep(4)

                    # Reload page to see changes
                    page.reload()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)

                    # Take screenshot after deletion
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/after_delete_verify.png')

                    # Check if project is gone
                    print("\n" + "=" * 60)
                    print("Verifying deletion...")
                    print("=" * 60)

                    projects_after = page.locator('div.p-3.rounded-lg.border').count()
                    print(f"  Projects after deletion: {projects_after}")

                    verify_after = page.locator('text=Verify Fix - 194824')
                    if verify_after.count() == 0:
                        print("  SUCCESS: 'Verify Fix - 194824' has been deleted!")
                    else:
                        print("  FAILED: Project still exists")

                    # List remaining projects
                    print("\n  Remaining projects:")
                    project_items = page.locator('div.p-3.rounded-lg.border').all()
                    for i, item in enumerate(project_items[:6]):
                        try:
                            title = item.locator('h4').first.inner_text()
                            print(f"    {i+1}. {title}")
                        except:
                            pass
                else:
                    print("  ERROR: AlertDialog did not appear")
            else:
                print("  NOT FOUND: 'Verify Fix - 194824' project not found")
                print("  (It may have already been deleted)")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/delete_verify_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
