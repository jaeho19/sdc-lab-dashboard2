"""Test script for research project creation functionality."""
from playwright.sync_api import sync_playwright
import time

def test_create_research_project():
    """Test creating a new research project after login."""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture console errors
        errors = []
        page.on('console', lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == 'error' else None)
        page.on('pageerror', lambda err: errors.append(f"[PageError] {err}"))

        try:
            # Step 1: Go to login page
            print("Step 1: Navigating to login page...")
            page.goto('http://localhost:3000/login')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/01_login_page.png')
            print("  - Login page loaded")

            # Step 2: Login with credentials
            print("Step 2: Logging in...")
            email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
            password_input = page.locator('input[type="password"], input[name="password"]')

            if email_input.count() > 0 and password_input.count() > 0:
                email_input.first.fill('jaeho19@gmail.com')
                password_input.first.fill('Cory0012')

                # Find and click submit button
                submit_btn = page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login"), button:has-text("Sign in")')
                if submit_btn.count() > 0:
                    submit_btn.first.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)  # Wait for redirect
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/02_after_login.png')
                    print(f"  - Current URL after login: {page.url}")
                else:
                    print("  - ERROR: Submit button not found")
            else:
                print(f"  - ERROR: Login form not found (email: {email_input.count()}, password: {password_input.count()})")

            # Step 3: Navigate to Research Articles page
            print("Step 3: Navigating to Research Articles page...")
            # Try clicking sidebar link
            research_link = page.locator('a[href*="research"], a:has-text("Research"), a:has-text("연구")')
            if research_link.count() > 0:
                research_link.first.click()
                page.wait_for_load_state('networkidle')
                time.sleep(1)
            else:
                # Direct navigation
                page.goto('http://localhost:3000/research')
                page.wait_for_load_state('networkidle')

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/03_research_page.png')
            print(f"  - Current URL: {page.url}")

            # Step 4: Find and click "New Project" button
            print("Step 4: Looking for 'New Project' button...")
            new_project_btn = page.locator('button:has-text("새 프로젝트"), button:has-text("New Project"), button:has-text("프로젝트 추가"), a:has-text("새 프로젝트"), a:has-text("New Project")')

            if new_project_btn.count() > 0:
                print(f"  - Found {new_project_btn.count()} 'New Project' button(s)")
                new_project_btn.first.click()
                page.wait_for_load_state('networkidle')
                time.sleep(1)
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/04_new_project_form.png')
                print(f"  - Current URL: {page.url}")
            else:
                # Check for Plus icon button
                plus_btn = page.locator('button:has(svg), [data-testid="new-project"]')
                print(f"  - Searching for plus icon buttons: {plus_btn.count()}")
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/04_looking_for_button.png')

                # Print available buttons on page
                all_buttons = page.locator('button').all()
                print(f"  - All buttons on page ({len(all_buttons)}):")
                for i, btn in enumerate(all_buttons[:10]):  # First 10 buttons
                    try:
                        text = btn.inner_text()[:50] if btn.inner_text() else "[no text]"
                        print(f"    {i}: {text}")
                    except:
                        pass

            # Step 5: Check if we're on a form page or modal
            print("Step 5: Checking for project creation form...")
            form_elements = page.locator('form, [role="dialog"], .modal')
            title_input = page.locator('input[name="title"], input[placeholder*="제목" i], input[placeholder*="title" i]')

            if title_input.count() > 0:
                print("  - Found title input, filling form...")
                title_input.first.fill('Test Research Project - Playwright')

                # Try to find and fill description
                desc_input = page.locator('textarea[name="description"], textarea[placeholder*="설명" i], textarea[placeholder*="description" i]')
                if desc_input.count() > 0:
                    desc_input.first.fill('This is a test project created by Playwright automation.')

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/05_form_filled.png')

                # Step 6: Submit the form
                print("Step 6: Submitting the form...")
                submit_btn = page.locator('button[type="submit"], button:has-text("생성"), button:has-text("Create"), button:has-text("저장"), button:has-text("Save")')
                if submit_btn.count() > 0:
                    submit_btn.first.click()
                    time.sleep(2)
                    page.wait_for_load_state('networkidle')
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/06_after_submit.png')
                    print(f"  - Form submitted, current URL: {page.url}")
                else:
                    print("  - ERROR: Submit button not found in form")
            else:
                print("  - Title input not found on current page")
                # Take screenshot of current state
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/05_current_state.png')

                # Print page content for debugging
                print(f"  - Page title: {page.title()}")
                print(f"  - URL: {page.url}")

            # Step 7: Check for errors
            print("\n=== Test Results ===")
            if errors:
                print(f"Console Errors Found ({len(errors)}):")
                for err in errors:
                    print(f"  - {err}")
            else:
                print("No console errors detected")

            print(f"\nFinal URL: {page.url}")

        except Exception as e:
            print(f"\n!!! Test Error: {str(e)}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/error_state.png')
            raise
        finally:
            browser.close()

if __name__ == "__main__":
    # Create screenshots directory
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)

    test_create_research_project()
