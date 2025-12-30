"""Final test for deployed site with better stability."""
from playwright.sync_api import sync_playwright
import time

def test_deployed():
    base_url = 'https://sdclab-dashboard.netlify.app'

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Capture console errors
        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)

        try:
            print("=" * 60)
            print("STEP 1: Go to login page")
            print("=" * 60)
            page.goto(f'{base_url}/login', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)  # Extra wait for hydration
            print(f"  URL: {page.url}")

            print("\n" + "=" * 60)
            print("STEP 2: Fill login form")
            print("=" * 60)

            # Wait for form to be ready
            email_input = page.wait_for_selector('#email', state='visible', timeout=10000)
            time.sleep(1)

            # Clear and fill
            email_input.fill('')
            email_input.fill('jaeho19@gmail.com')
            print("  Email filled")

            password_input = page.locator('#password')
            password_input.fill('')
            password_input.fill('Cory0012')
            print("  Password filled")

            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_01_filled.png')

            print("\n" + "=" * 60)
            print("STEP 3: Submit login")
            print("=" * 60)

            # Click submit and wait
            page.click('button[type="submit"]')
            print("  Clicked submit, waiting for response...")

            # Wait for URL change or timeout
            start_time = time.time()
            while time.time() - start_time < 15:
                time.sleep(1)
                current_url = page.url
                if '/dashboard' in current_url:
                    print(f"  SUCCESS: Redirected to {current_url}")
                    break
                if '/login' not in current_url:
                    print(f"  Redirected to: {current_url}")
                    break
            else:
                # Check for error on page
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_02_login_result.png')
                error_elem = page.locator('.text-red-600, .bg-red-50')
                if error_elem.count() > 0:
                    print(f"  LOGIN ERROR: {error_elem.first.inner_text()}")
                else:
                    print(f"  Still on login page after 15s. URL: {page.url}")
                return

            page.wait_for_load_state('networkidle')
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_02_dashboard.png')

            print("\n" + "=" * 60)
            print("STEP 4: Navigate to new project form")
            print("=" * 60)

            page.goto(f'{base_url}/research/new', timeout=60000)
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            print(f"  URL: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_03_new_form.png')

            print("\n" + "=" * 60)
            print("STEP 5: Fill project form")
            print("=" * 60)

            title_input = page.wait_for_selector('input[name="title"], input#title', timeout=10000)
            title_input.fill(f'Deployed Test - {time.strftime("%H:%M:%S")}')
            print("  Title filled")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_04_filled.png')

            print("\n" + "=" * 60)
            print("STEP 6: Submit project")
            print("=" * 60)

            errors.clear()
            page.click('button[type="submit"]')
            print("  Clicked submit, waiting...")

            # Wait for redirect or error
            start_time = time.time()
            while time.time() - start_time < 15:
                time.sleep(1)
                current_url = page.url
                if '/research/' in current_url and '/new' not in current_url:
                    print(f"  SUCCESS: Project created! URL: {current_url}")
                    page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_05_success.png')
                    break
            else:
                page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_05_result.png')
                error_elem = page.locator('.text-red-500, .text-red-600, .text-destructive')
                if error_elem.count() > 0:
                    print(f"  ERROR: {error_elem.first.inner_text()}")
                else:
                    print(f"  Still on form page. URL: {page.url}")

            # Print any console errors
            if errors:
                print("\nConsole Errors:")
                for e in errors[:5]:
                    print(f"  - {e[:100]}")

        except Exception as e:
            print(f"\nEXCEPTION: {e}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots/final_error.png')
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs('C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/screenshots', exist_ok=True)
    test_deployed()
