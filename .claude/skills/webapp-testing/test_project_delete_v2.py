"""Test delete button on project detail page - version 2."""
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

            # Navigate directly to project detail page
            print("\n" + "=" * 60)
            print("Navigating to 'asdfasdf' project page directly...")
            print("=" * 60)

            page.goto(f'{base_url}/research/{project_id}', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(3)  # Extra wait for client-side rendering

            print(f"  URL: {page.url}")

            # Wait for the page title to appear
            page.wait_for_selector('h1', timeout=10000)

            # Take screenshot
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_detail_v2.png')

            # Check page title
            title = page.locator('h1').first.inner_text()
            print(f"  Project title: {title}")

            # Check for delete button
            print("\n" + "=" * 60)
            print("Checking for delete button...")
            print("=" * 60)

            # Look for the button container in header
            header_buttons = page.locator('.flex.gap-2 button').all()
            print(f"  Found {len(header_buttons)} buttons in header area")

            # Check for trash icon
            trash_btns = page.locator('button:has(svg.lucide-trash-2)').all()
            print(f"  Found {len(trash_btns)} buttons with trash icon")

            if len(trash_btns) > 0:
                print("  SUCCESS: Delete button found!")

                # Click to test dialog
                trash_btns[0].click()
                time.sleep(1)

                dialog = page.locator('[role="alertdialog"]')
                if dialog.count() > 0:
                    print("  SUCCESS: Delete confirmation dialog appeared!")
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_delete_dialog_v2.png')

                    # Cancel
                    cancel_btn = dialog.locator('button:has-text("취소")')
                    cancel_btn.click()
                    print("  Clicked cancel - project not deleted")
                else:
                    print("  WARNING: Dialog did not appear")
            else:
                print("  NOT FOUND: Delete button not visible")
                # Take full page screenshot for debugging
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_detail_full.png', full_page=True)

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_delete_error_v2.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
