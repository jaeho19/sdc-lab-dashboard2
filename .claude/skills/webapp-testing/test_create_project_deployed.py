"""Test creating a new research project on deployed site."""
from playwright.sync_api import sync_playwright
import time

def test_create_project():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)

        try:
            # Step 1: Login
            print("=" * 60)
            print("STEP 1: Login")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.locator('#email').fill('jaeho19@gmail.com')
            page.locator('#password').fill('Cory0012')
            page.locator('button[type="submit"]').click()

            # Wait for dashboard redirect
            page.wait_for_url('**/dashboard**', timeout=30000)
            print(f"  SUCCESS: Logged in, URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_01_dashboard.png')

            # Step 2: Navigate to new project form
            print("\n" + "=" * 60)
            print("STEP 2: Go to /research/new")
            print("=" * 60)
            page.goto(f'{base_url}/research/new', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print(f"  URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_02_new_form.png')

            # Step 3: Fill project form
            print("\n" + "=" * 60)
            print("STEP 3: Fill project form")
            print("=" * 60)

            title_input = page.locator('input[name="title"], input#title')
            if title_input.count() > 0:
                project_title = f'Deployed Test - {time.strftime("%Y%m%d_%H%M%S")}'
                title_input.first.fill(project_title)
                print(f"  Title: {project_title}")
            else:
                print("  ERROR: Title input not found!")
                return

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_03_filled.png')

            # Step 4: Submit form
            print("\n" + "=" * 60)
            print("STEP 4: Submit project")
            print("=" * 60)

            errors.clear()
            submit_btn = page.locator('button[type="submit"]')
            submit_btn.click()
            print("  Clicked submit...")

            # Wait for redirect or error
            time.sleep(3)
            page.wait_for_load_state('networkidle')

            # Monitor for success or error
            for i in range(20):
                time.sleep(1)
                current_url = page.url

                # Check for successful redirect to project detail page
                if '/research/' in current_url and '/new' not in current_url:
                    print(f"  SUCCESS: Project created!")
                    print(f"  Project URL: {current_url}")
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_04_success.png')
                    break

                # Check for error message
                error_elem = page.locator('.text-red-500, .text-red-600, .text-destructive')
                if error_elem.count() > 0:
                    err_text = error_elem.first.inner_text()
                    if err_text.strip():
                        print(f"  ERROR: {err_text}")
                        page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_04_error.png')
                        break

                print(f"  [{i+1}s] Waiting... URL: {current_url}")
            else:
                print("  Timeout waiting for response")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_04_timeout.png')

            # Print console errors
            if errors:
                print("\n" + "=" * 60)
                print("Console Errors:")
                print("=" * 60)
                for e in errors[:5]:
                    print(f"  - {e[:150]}")

            print("\n" + "=" * 60)
            print("FINAL RESULT")
            print("=" * 60)
            print(f"  Final URL: {page.url}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/proj_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_create_project()
