"""Final test script for research project creation."""
from playwright.sync_api import sync_playwright
import time

def test_create_research_project(port=3002):
    """Test creating a new research project after login."""
    base_url = f'http://localhost:{port}'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture errors
        errors = []
        page.on('console', lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(f"[PageError] {err}"))

        try:
            # Step 1: Login
            print("=" * 60)
            print("STEP 1: Login")
            print("=" * 60)
            page.goto(f'{base_url}/login')
            page.wait_for_load_state('networkidle')

            # Fill login form
            page.fill('#email', 'jaeho19@gmail.com')
            page.fill('#password', 'Cory0012')
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f01_login_filled.png')

            # Submit
            page.click('button[type="submit"]')
            time.sleep(3)  # Wait for login response and redirect
            page.wait_for_load_state('networkidle')

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f02_after_login.png')
            print(f"  URL after login: {page.url}")

            # Check for login error
            error_elem = page.locator('.text-red-600, .bg-red-50')
            if error_elem.count() > 0:
                print(f"  LOGIN ERROR: {error_elem.first.inner_text()}")
                return

            # Check if redirected to dashboard
            if '/dashboard' in page.url:
                print("  Login successful - redirected to dashboard")
            else:
                print(f"  WARNING: Not redirected to dashboard. URL: {page.url}")

            # Step 2: Navigate to Research page
            print("\n" + "=" * 60)
            print("STEP 2: Navigate to Research page")
            print("=" * 60)

            page.goto(f'{base_url}/research')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f03_research_page.png')
            print(f"  URL: {page.url}")

            # Check if page loaded correctly
            if 'Internal Server Error' in page.content():
                print("  ERROR: Internal Server Error on research page!")
                return

            # Step 3: Click "New Project" button
            print("\n" + "=" * 60)
            print("STEP 3: Click 'New Project' button")
            print("=" * 60)

            new_project_btn = page.locator('a[href="/research/new"], button:has-text("새 프로젝트")')
            print(f"  Found {new_project_btn.count()} 'New Project' button(s)")

            if new_project_btn.count() > 0:
                new_project_btn.first.click()
                page.wait_for_load_state('networkidle')
                time.sleep(1)
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f04_new_project_form.png')
                print(f"  URL: {page.url}")
            else:
                # List all buttons
                all_btns = page.locator('button').all()
                print(f"  Available buttons ({len(all_btns)}):")
                for btn in all_btns[:5]:
                    print(f"    - {btn.inner_text()[:50]}")
                return

            # Step 4: Fill project form
            print("\n" + "=" * 60)
            print("STEP 4: Fill project form")
            print("=" * 60)

            # Check available form fields
            title_input = page.locator('input[name="title"], input#title')
            category_select = page.locator('select[name="category"], [data-testid="category-select"], button[aria-haspopup="listbox"]')
            status_select = page.locator('select[name="status"], [data-testid="status-select"]')
            description_input = page.locator('textarea[name="description"], textarea#description')

            print(f"  Title input: {title_input.count()}")
            print(f"  Category select: {category_select.count()}")
            print(f"  Description: {description_input.count()}")

            # Fill title
            if title_input.count() > 0:
                title_input.first.fill('Test Project - Playwright Automation')
                print("  Filled title")

            # Fill description if exists
            if description_input.count() > 0:
                description_input.first.fill('This is a test project created by Playwright.')
                print("  Filled description")

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f05_form_filled.png')

            # Step 5: Submit form
            print("\n" + "=" * 60)
            print("STEP 5: Submit form")
            print("=" * 60)

            submit_btn = page.locator('button[type="submit"], button:has-text("생성"), button:has-text("Create"), button:has-text("저장")')
            print(f"  Found {submit_btn.count()} submit button(s)")

            if submit_btn.count() > 0:
                # Clear errors before submit
                errors.clear()

                submit_btn.first.click()
                time.sleep(3)
                page.wait_for_load_state('networkidle')

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f06_after_submit.png')
                print(f"  URL after submit: {page.url}")

                # Check for error message
                form_error = page.locator('.text-red-500, .text-red-600, .text-destructive, [role="alert"]')
                if form_error.count() > 0:
                    print(f"  FORM ERROR: {form_error.first.inner_text()}")

                # Check if redirected (success)
                if '/research/' in page.url and '/new' not in page.url:
                    print("  SUCCESS: Project created and redirected to project page")
                elif '/research' in page.url and '/new' not in page.url:
                    print("  SUCCESS: Redirected to research list")
                else:
                    print("  Still on form page - check for errors")

            # Final summary
            print("\n" + "=" * 60)
            print("TEST RESULTS")
            print("=" * 60)
            if errors:
                print(f"Console/Page Errors ({len(errors)}):")
                for err in errors:
                    print(f"  - {err[:200]}")
            else:
                print("No errors detected")

        except Exception as e:
            print(f"\nEXCEPTION: {str(e)}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/f_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    import sys

    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)

    # Get port from argument or default to 3002
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3002
    test_create_research_project(port)
