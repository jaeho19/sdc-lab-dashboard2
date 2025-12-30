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

            # Go to Members list page
            print("\n" + "=" * 60)
            print("Going to Members page...")
            print("=" * 60)
            page.goto(f'{base_url}/members', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            # Look for Kim Eunsol in the main content area (not sidebar)
            # Find member cards with 김은솔 text
            print("\n" + "=" * 60)
            print("Looking for Kim Eunsol member card...")
            print("=" * 60)

            # Find all member cards
            member_cards = page.locator('main a[href*="/members/"]').all()
            print(f"  Found {len(member_cards)} member card links")

            eunsol_url = None
            for card in member_cards:
                href = card.get_attribute('href')
                text = card.inner_text()
                if '김은솔' in text:
                    eunsol_url = href
                    print(f"  Found Kim Eunsol card: {href}")
                    break

            if eunsol_url:
                # Navigate directly to Kim Eunsol's page
                page.goto(f'{base_url}{eunsol_url}', timeout=60000)
                page.wait_for_load_state('networkidle')
                time.sleep(2)
                print(f"  Navigated to: {page.url}")

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/member_page_detail.png')

                # Check for new project button
                print("\n" + "=" * 60)
                print("Checking for '새 프로젝트' button...")
                print("=" * 60)
                new_project_btn = page.locator('button:has-text("새 프로젝트"), a:has-text("새 프로젝트")')
                btn_count = new_project_btn.count()
                if btn_count > 0:
                    print(f"  FOUND: '새 프로젝트' button exists! ({btn_count} found)")
                else:
                    print("  NOT FOUND: '새 프로젝트' button missing")
                    # Check what buttons exist
                    all_buttons = page.locator('button').all()
                    print(f"  Total buttons on page: {len(all_buttons)}")
                    for i, btn in enumerate(all_buttons[:10]):
                        txt = btn.inner_text().strip()[:50]
                        if txt:
                            print(f"    Button {i}: {txt}")

                # Check for delete buttons (trash icons)
                print("\n" + "=" * 60)
                print("Checking for delete buttons...")
                print("=" * 60)
                delete_btns = page.locator('button:has(svg.lucide-trash-2)').all()
                print(f"  Found {len(delete_btns)} delete button(s) with trash icon")

                # Also check for any trash2 icons
                trash_icons = page.locator('svg.lucide-trash-2').all()
                print(f"  Found {len(trash_icons)} Trash2 icons on page")

                # Check for Research Articles section
                print("\n" + "=" * 60)
                print("Checking Research Articles section...")
                print("=" * 60)
                research_section = page.locator('text=Research Articles')
                if research_section.count() > 0:
                    print("  FOUND: Research Articles section")
                else:
                    print("  NOT FOUND: Research Articles section missing")

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/member_page_full.png', full_page=True)
            else:
                print("  ERROR: Could not find Kim Eunsol member card")
                # Try to find by scrolling or looking elsewhere
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/members_list.png', full_page=True)

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
