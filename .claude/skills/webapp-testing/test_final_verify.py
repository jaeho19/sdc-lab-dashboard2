"""Final verification test."""
from playwright.sync_api import sync_playwright
import time

def test():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        try:
            # Login
            print("Logging in as Kim Eunsol...")
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.locator('#email').fill('rdt9690@uos.ac.kr')
            page.locator('#password').fill('SDCLAB03')
            page.locator('button[type="submit"]').click()
            page.wait_for_url('**/dashboard**', timeout=30000)
            print("  SUCCESS!")

            # Go to new project form
            print("\nGoing to new project form...")
            page.goto(f'{base_url}/research/new', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(3)

            # Fill form
            title = f'Verify Fix - {time.strftime("%H%M%S")}'
            page.locator('input[name="title"], input#title').first.fill(title)
            print(f"  Title: {title}")

            # Click submit and wait
            print("\nSubmitting form...")
            page.locator('button[type="submit"]').click()

            # Wait for navigation or error
            for i in range(15):
                time.sleep(1)
                url = page.url
                if '/research/' in url and '/new' not in url:
                    project_id = url.split('/research/')[-1]
                    print(f"  SUCCESS! Project created: {project_id}")

                    # Now check Research page
                    print("\nChecking Research list...")
                    page.goto(f'{base_url}/research', timeout=60000)
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)

                    # Check if title appears in page
                    page_html = page.content()
                    if title in page_html or "Verify Fix" in page_html:
                        print(f"  VERIFIED: Project appears in Research list!")
                    else:
                        print(f"  NOT FOUND: Project not in list yet")

                    # Get Kim Eunsol project count
                    eunsol_text = page.locator('text=/김은솔.*개 연구/').first
                    if eunsol_text.count() > 0:
                        print(f"  Kim Eunsol status: {eunsol_text.inner_text()}")

                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_verify.png')
                    break
                else:
                    # Check for error
                    error = page.locator('.text-red-500, .text-red-600')
                    if error.count() > 0:
                        err_text = error.first.inner_text()
                        if err_text.strip():
                            print(f"  ERROR: {err_text}")
                            break
                    print(f"  [{i+1}s] Waiting... URL: {url}")
            else:
                print("  TIMEOUT: Project not created in 15 seconds")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_timeout.png')

            if console_errors:
                print("\nConsole Errors:")
                for e in console_errors[:5]:
                    print(f"  - {e[:100]}")

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
