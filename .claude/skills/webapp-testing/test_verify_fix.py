"""Verify the fix by checking a newly created project."""
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
            print("Logging in as Kim Eunsol...")
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.locator('#email').fill('rdt9690@uos.ac.kr')
            page.locator('#password').fill('SDCLAB03')
            page.locator('button[type="submit"]').click()
            page.wait_for_url('**/dashboard**', timeout=30000)
            print("  Logged in!")

            # Create a new project
            print("\nCreating new project...")
            page.goto(f'{base_url}/research/new', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            title = f'Fix Test - {time.strftime("%H%M%S")}'
            page.locator('input[name="title"], input#title').first.fill(title)
            print(f"  Title: {title}")

            page.locator('button[type="submit"]').click()
            time.sleep(5)
            page.wait_for_load_state('networkidle')

            # Check current URL
            print(f"\nCurrent URL: {page.url}")

            if '/research/' in page.url and '/new' not in page.url:
                project_id = page.url.split('/research/')[-1]
                print(f"  Project ID: {project_id}")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/verify_01_project.png')

                # Now check Research list
                print("\nChecking Research list...")
                page.goto(f'{base_url}/research', timeout=60000)
                page.wait_for_load_state('networkidle')
                time.sleep(2)

                # Get the count from Kim Eunsol's card
                page_content = page.content()

                # Find Kim Eunsol card and check project count
                eunsol_card = page.locator('text=김은솔').first
                if eunsol_card.count() > 0:
                    # Get parent card
                    card = eunsol_card.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "Card")]').first
                    if card.count() > 0:
                        card_text = card.inner_text()
                        print(f"  Kim Eunsol card text: {card_text[:200]}")

                # Check if the new project title appears
                if title in page_content:
                    print(f"\n  SUCCESS: '{title}' found in Research list!")
                else:
                    print(f"\n  NOT FOUND: '{title}' not in Research list")

                # Count projects for Kim Eunsol
                # Look for the project count text
                count_match = page.locator('text=/김은솔.*\\d+개 연구/').first
                if count_match.count() > 0:
                    print(f"  Project count text: {count_match.inner_text()}")

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/verify_02_list.png')
            else:
                print("  Project creation might have failed")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/verify_error.png')

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test()
