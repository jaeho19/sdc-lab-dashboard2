"""Test that deleted projects are removed from dashboard."""
from playwright.sync_api import sync_playwright
import time

def test():
    base_url = 'https://sdclab-dashboard.netlify.app'
    # asdfasdf project ID
    project_id = 'c92fa3e0-a9fa-41c5-9869-e08b49054e59'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # Login as Kim Eunsol
            print("=" * 60)
            print("Step 1: Logging in as Kim Eunsol...")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.locator('#email').fill('rdt9690@uos.ac.kr')
            page.locator('#password').fill('SDCLAB03')
            page.locator('button[type="submit"]').click()
            page.wait_for_url('**/dashboard**', timeout=30000)
            print("  SUCCESS: Logged in!")

            # Check dashboard before deletion
            print("\n" + "=" * 60)
            print("Step 2: Checking dashboard BEFORE deletion...")
            print("=" * 60)
            page.goto(f'{base_url}/dashboard', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/dashboard_before_delete.png')

            # Check if asdfasdf project is visible on dashboard
            asdf_before = page.locator('text=asdfasdf').count()
            print(f"  'asdfasdf' found on dashboard: {asdf_before > 0}")

            # Go to project detail page and delete
            print("\n" + "=" * 60)
            print("Step 3: Deleting 'asdfasdf' project...")
            print("=" * 60)
            page.goto(f'{base_url}/research/{project_id}', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            # Find and click delete button
            delete_btn = page.locator('button.h-8.w-8').last
            delete_btn.click()
            time.sleep(1)

            # Confirm deletion
            dialog = page.locator('[role="alertdialog"]')
            if dialog.count() > 0:
                print("  Delete dialog appeared")
                confirm_btn = dialog.locator('button:has-text("삭제")').last
                confirm_btn.click()
                print("  Clicked delete confirm button")

                # Wait for redirect
                time.sleep(3)
                page.wait_for_load_state('networkidle')
                print(f"  Redirected to: {page.url}")

            # Navigate to dashboard to verify deletion
            print("\n" + "=" * 60)
            print("Step 4: Checking dashboard AFTER deletion...")
            print("=" * 60)
            page.goto(f'{base_url}/dashboard', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/dashboard_after_delete.png')

            # Check if asdfasdf project is still visible
            asdf_after = page.locator('text=asdfasdf').count()
            print(f"  'asdfasdf' found on dashboard: {asdf_after > 0}")

            # Summary
            print("\n" + "=" * 60)
            print("RESULT:")
            print("=" * 60)
            if asdf_before > 0 and asdf_after == 0:
                print("  SUCCESS: Project deleted and dashboard updated!")
            elif asdf_before == 0:
                print("  INFO: Project was not on dashboard before deletion")
            elif asdf_after > 0:
                print("  FAILED: Project still appears on dashboard after deletion")
            else:
                print(f"  Before: {asdf_before}, After: {asdf_after}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/dashboard_delete_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
