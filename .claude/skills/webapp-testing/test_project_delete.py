"""Test delete button on project detail page."""
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

            # Navigate to the asdfasdf project detail page
            # First get the project ID
            print("\n" + "=" * 60)
            print("Navigating to 'asdfasdf' project page...")
            print("=" * 60)

            # Go to research page first
            page.goto(f'{base_url}/research', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            # Find and click on asdfasdf project
            asdf_link = page.locator('a:has-text("asdfasdf")').first
            if asdf_link.count() > 0:
                asdf_link.click()
                page.wait_for_load_state('networkidle')
                time.sleep(2)

                print(f"  URL: {page.url}")

                # Take screenshot
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_detail_delete.png')

                # Check for delete button (trash icon button)
                print("\n" + "=" * 60)
                print("Checking for delete button...")
                print("=" * 60)

                # The delete button should be in the header area
                delete_btn = page.locator('button.h-8.w-8:has(svg.lucide-trash-2)').first
                if delete_btn.count() > 0:
                    print("  FOUND: Delete button exists on project detail page!")

                    # Try clicking it to see if dialog appears
                    print("\n  Testing delete dialog...")
                    delete_btn.click()
                    time.sleep(1)

                    dialog = page.locator('[role="alertdialog"]')
                    if dialog.count() > 0:
                        print("  SUCCESS: Delete confirmation dialog appeared!")
                        page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_delete_dialog.png')

                        # Click cancel to not actually delete
                        cancel_btn = dialog.locator('button:has-text("취소")')
                        cancel_btn.click()
                        print("  Clicked cancel - project not deleted")
                    else:
                        print("  WARNING: Dialog did not appear")
                else:
                    print("  NOT FOUND: Delete button missing")
                    # Check all buttons in the header
                    header_buttons = page.locator('.flex.gap-2 button').all()
                    print(f"  Found {len(header_buttons)} buttons in header")
                    for i, btn in enumerate(header_buttons):
                        txt = btn.inner_text().strip()[:30]
                        print(f"    Button {i}: {txt if txt else '[icon button]'}")
            else:
                print("  ERROR: Could not find 'asdfasdf' project")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/project_delete_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
