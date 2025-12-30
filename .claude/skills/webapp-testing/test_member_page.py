"""Test member page with new project and delete buttons."""
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
            print("  Logged in!")

            # Go to Kim Eunsol's member page
            print("\n" + "=" * 60)
            print("Going to Kim Eunsol member page...")
            print("=" * 60)

            # Find Kim Eunsol's member ID from the sidebar or navigate to members
            page.goto(f'{base_url}/members', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            # Click on Kim Eunsol
            eunsol_link = page.locator('text=김은솔').first
            if eunsol_link.count() > 0:
                eunsol_link.click()
                page.wait_for_load_state('networkidle')
                time.sleep(2)
                print(f"  URL: {page.url}")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/member_page_01.png')

                # Check for new project button
                print("\n" + "=" * 60)
                print("Checking for 'New Project' button...")
                print("=" * 60)
                new_project_btn = page.locator('text=새 프로젝트')
                if new_project_btn.count() > 0:
                    print("  FOUND: 'New Project' button exists!")
                else:
                    print("  NOT FOUND: 'New Project' button missing")

                # Check for delete buttons (trash icons)
                print("\n" + "=" * 60)
                print("Checking for delete buttons...")
                print("=" * 60)
                delete_btns = page.locator('button svg.lucide-trash-2, button:has(svg.lucide-trash-2)')
                delete_count = delete_btns.count()
                print(f"  Found {delete_count} delete button(s)")

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/member_page_02.png')
            else:
                print("  ERROR: Could not find Kim Eunsol")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/member_page_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
