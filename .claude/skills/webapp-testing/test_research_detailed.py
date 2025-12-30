"""Detailed test script for research project creation with enhanced error logging."""
from playwright.sync_api import sync_playwright
import time
import json

def test_create_research_project():
    """Test creating a new research project after login with detailed logging."""

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture all console messages and network errors
        console_messages = []
        network_errors = []
        page_errors = []

        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'location': str(msg.location) if msg.location else None
        }))
        page.on('pageerror', lambda err: page_errors.append(str(err)))
        page.on('requestfailed', lambda req: network_errors.append({
            'url': req.url,
            'failure': req.failure,
            'method': req.method
        }))

        try:
            # Step 1: Go to login page
            print("=" * 60)
            print("STEP 1: Navigating to login page...")
            print("=" * 60)
            response = page.goto('http://localhost:3000/login', wait_until='networkidle')
            print(f"  Response status: {response.status if response else 'N/A'}")
            print(f"  URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d01_login_page.png')

            # Step 2: Fill login form
            print("\n" + "=" * 60)
            print("STEP 2: Filling login form...")
            print("=" * 60)

            # Find form elements
            email_input = page.locator('#email')
            password_input = page.locator('#password')
            submit_btn = page.locator('button[type="submit"]')

            print(f"  Email input found: {email_input.count() > 0}")
            print(f"  Password input found: {password_input.count() > 0}")
            print(f"  Submit button found: {submit_btn.count() > 0}")

            if email_input.count() > 0 and password_input.count() > 0:
                email_input.fill('jaeho19@gmail.com')
                password_input.fill('Cory0012')
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d02_form_filled.png')
                print("  Form filled successfully")

            # Step 3: Submit login form
            print("\n" + "=" * 60)
            print("STEP 3: Submitting login form...")
            print("=" * 60)

            if submit_btn.count() > 0:
                # Clear previous messages
                console_messages.clear()
                network_errors.clear()
                page_errors.clear()

                submit_btn.click()

                # Wait for navigation or error
                time.sleep(5)  # Wait longer for login response

                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d03_after_submit.png')
                print(f"  Current URL after submit: {page.url}")

                # Check for error message on page
                error_msg = page.locator('.text-red-600, .bg-red-50, [role="alert"]')
                if error_msg.count() > 0:
                    print(f"  ERROR MESSAGE ON PAGE: {error_msg.first.inner_text()}")

                # Print console messages
                if console_messages:
                    print("\n  Console Messages:")
                    for msg in console_messages:
                        print(f"    [{msg['type']}] {msg['text'][:200]}")

                # Print network errors
                if network_errors:
                    print("\n  Network Errors:")
                    for err in network_errors:
                        print(f"    {err['method']} {err['url']}: {err['failure']}")

                # Print page errors
                if page_errors:
                    print("\n  Page Errors:")
                    for err in page_errors:
                        print(f"    {err[:200]}")

            # Step 4: Check if login was successful by looking at URL
            print("\n" + "=" * 60)
            print("STEP 4: Checking login result...")
            print("=" * 60)

            # Wait and check if redirected
            page.wait_for_load_state('networkidle')
            final_url = page.url

            if '/dashboard' in final_url:
                print("  LOGIN SUCCESS - redirected to dashboard")
            elif '/login' in final_url:
                print("  LOGIN FAILED - still on login page")
                # Check for visible error
                error_elements = page.locator('.text-red-600, .bg-red-50').all()
                for elem in error_elements:
                    print(f"    Error: {elem.inner_text()}")
            else:
                print(f"  LOGIN STATUS UNCLEAR - URL: {final_url}")

            # Step 5: Navigate directly to research page
            print("\n" + "=" * 60)
            print("STEP 5: Navigating to /research page...")
            print("=" * 60)

            console_messages.clear()
            network_errors.clear()
            page_errors.clear()

            response = page.goto('http://localhost:3000/research', wait_until='load', timeout=30000)
            time.sleep(3)  # Wait for any client-side rendering

            print(f"  Response status: {response.status if response else 'N/A'}")
            print(f"  Final URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d04_research_page.png')

            # Get page content
            page_content = page.content()
            if 'Internal Server Error' in page_content:
                print("  ERROR: Internal Server Error detected on page!")

            # Print console messages
            if console_messages:
                print("\n  Console Messages:")
                for msg in console_messages:
                    if msg['type'] == 'error':
                        print(f"    [{msg['type']}] {msg['text'][:300]}")

            # Print network errors
            if network_errors:
                print("\n  Network Errors:")
                for err in network_errors:
                    print(f"    {err['method']} {err['url']}: {err['failure']}")

            # Print page errors
            if page_errors:
                print("\n  Page Errors:")
                for err in page_errors:
                    print(f"    {err[:300]}")

            # Step 6: If on research page, look for new project button
            if '/research' in page.url and 'Internal Server Error' not in page_content:
                print("\n" + "=" * 60)
                print("STEP 6: Looking for 'New Project' button...")
                print("=" * 60)

                new_project_btn = page.locator('a[href="/research/new"], button:has-text("새 프로젝트"), button:has-text("New")')
                print(f"  Found 'New Project' buttons: {new_project_btn.count()}")

                if new_project_btn.count() > 0:
                    new_project_btn.first.click()
                    page.wait_for_load_state('networkidle')
                    time.sleep(2)
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d05_new_project_form.png')
                    print(f"  Current URL: {page.url}")

                    # Check for form
                    title_input = page.locator('input[name="title"], input#title')
                    print(f"  Title input found: {title_input.count() > 0}")

            # Final summary
            print("\n" + "=" * 60)
            print("TEST SUMMARY")
            print("=" * 60)
            print(f"Final URL: {page.url}")
            print(f"Total console errors: {len([m for m in console_messages if m['type'] == 'error'])}")
            print(f"Total network errors: {len(network_errors)}")
            print(f"Total page errors: {len(page_errors)}")

        except Exception as e:
            print(f"\n!!! EXCEPTION: {str(e)}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/d_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)

    test_create_research_project()
