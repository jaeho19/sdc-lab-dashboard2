"""Test creating a research project as Kim Eunsol."""
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
            # Step 1: Login as Kim Eunsol
            print("=" * 60)
            print("STEP 1: Login as Kim Eunsol")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            page.locator('#email').fill('rdt9690@uos.ac.kr')
            page.locator('#password').fill('SDCLAB03')
            page.locator('button[type="submit"]').click()

            # Wait for dashboard redirect
            page.wait_for_url('**/dashboard**', timeout=30000)
            print(f"  SUCCESS: Logged in as Kim Eunsol")
            print(f"  URL: {page.url}")

            # Step 2: Check current user info on dashboard
            print("\n" + "=" * 60)
            print("STEP 2: Check dashboard user info")
            print("=" * 60)
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_01_dashboard.png')

            # Step 3: Navigate to research page to see existing projects
            print("\n" + "=" * 60)
            print("STEP 3: Check Research page")
            print("=" * 60)
            page.goto(f'{base_url}/research', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_02_research_list.png')
            print(f"  URL: {page.url}")

            # Step 4: Navigate to new project form
            print("\n" + "=" * 60)
            print("STEP 4: Go to /research/new")
            print("=" * 60)
            page.goto(f'{base_url}/research/new', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print(f"  URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_03_new_form.png')

            # Step 5: Fill project form
            print("\n" + "=" * 60)
            print("STEP 5: Fill project form")
            print("=" * 60)

            title_input = page.locator('input[name="title"], input#title')
            if title_input.count() > 0:
                project_title = f'김은솔 테스트 프로젝트 - {time.strftime("%H%M%S")}'
                title_input.first.fill(project_title)
                print(f"  Title: {project_title}")
            else:
                print("  ERROR: Title input not found!")
                return

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_04_filled.png')

            # Step 6: Submit form
            print("\n" + "=" * 60)
            print("STEP 6: Submit project")
            print("=" * 60)

            errors.clear()
            submit_btn = page.locator('button[type="submit"]')
            submit_btn.click()
            print("  Clicked submit...")

            # Wait for redirect or error
            time.sleep(3)
            page.wait_for_load_state('networkidle')

            # Monitor for success or error
            created_url = None
            for i in range(20):
                time.sleep(1)
                current_url = page.url

                if '/research/' in current_url and '/new' not in current_url:
                    print(f"  SUCCESS: Project created!")
                    print(f"  Project URL: {current_url}")
                    created_url = current_url
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_05_project_created.png')
                    break

                error_elem = page.locator('.text-red-500, .text-red-600, .text-destructive')
                if error_elem.count() > 0:
                    err_text = error_elem.first.inner_text()
                    if err_text.strip():
                        print(f"  ERROR: {err_text}")
                        break

                print(f"  [{i+1}s] Waiting... URL: {current_url}")
            else:
                print("  Timeout waiting for response")

            # Step 7: Go back to research list to see the project
            if created_url:
                print("\n" + "=" * 60)
                print("STEP 7: Check Research list for new project")
                print("=" * 60)
                page.goto(f'{base_url}/research', timeout=60000)
                page.wait_for_load_state('networkidle')
                time.sleep(2)
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_06_research_after.png')
                print(f"  URL: {page.url}")

                # Check the page content
                page_content = page.content()
                if '김은솔' in page_content:
                    print("  Found '김은솔' in research list")
                else:
                    print("  '김은솔' NOT found in research list")

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
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/eunsol_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_create_project()
