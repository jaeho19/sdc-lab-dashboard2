from playwright.sync_api import sync_playwright
import os

def test_research_notes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set viewport for consistent screenshots
        page.set_viewport_size({"width": 1280, "height": 900})

        print("1. Navigating to research-notes page...")
        page.goto('http://localhost:3000/research-notes')
        page.wait_for_load_state('networkidle')

        # Check if redirected to login
        current_url = page.url
        print(f"   Current URL: {current_url}")

        if '/login' in current_url:
            print("2. Redirected to login page - need to authenticate first")
            # Take screenshot of login page
            page.screenshot(path='screenshots/research_notes_login.png', full_page=True)
            print("   Screenshot saved: screenshots/research_notes_login.png")

            # Try to login with test credentials
            email_input = page.locator('input[type="email"], input[name="email"]')
            if email_input.count() > 0:
                print("3. Attempting to login...")
                email_input.fill('jaeho.lee@uos.ac.kr')

                password_input = page.locator('input[type="password"]')
                if password_input.count() > 0:
                    password_input.fill('test1234')

                    submit_btn = page.locator('button[type="submit"]')
                    if submit_btn.count() > 0:
                        submit_btn.click()
                        page.wait_for_load_state('networkidle')
                        page.wait_for_timeout(2000)

                        # Navigate to research-notes after login
                        page.goto('http://localhost:3000/research-notes')
                        page.wait_for_load_state('networkidle')
                        current_url = page.url
                        print(f"   After login URL: {current_url}")

        # Take screenshot of current page
        os.makedirs('screenshots', exist_ok=True)
        page.screenshot(path='screenshots/research_notes_page.png', full_page=True)
        print(f"4. Screenshot saved: screenshots/research_notes_page.png")

        # Check page content
        print("\n5. Checking page elements...")

        # Check for stage filter/dropdown
        stage_elements = page.locator('[data-testid*="stage"], select:has-text("stage"), button:has-text("단계"), [class*="stage"]')
        print(f"   Stage elements found: {stage_elements.count()}")

        # Check for notes list
        notes_list = page.locator('[class*="note"], [class*="card"], article, .grid > div')
        print(f"   Note cards found: {notes_list.count()}")

        # Check for "새 노트" or create button
        create_btn = page.locator('button:has-text("새"), button:has-text("추가"), button:has-text("작성"), a:has-text("새")')
        print(f"   Create note buttons: {create_btn.count()}")

        # Get page title
        title = page.title()
        print(f"   Page title: {title}")

        # Get visible text content
        body_text = page.locator('body').inner_text()
        print(f"\n6. Page content preview (first 500 chars):")
        print(body_text[:500] if len(body_text) > 500 else body_text)

        browser.close()
        print("\n✅ Test completed!")

if __name__ == "__main__":
    test_research_notes()
