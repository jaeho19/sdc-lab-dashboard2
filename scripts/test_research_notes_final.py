from playwright.sync_api import sync_playwright
import os

def test_research_notes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 900})

        print("1. Navigating to login page...")
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')

        # Login
        print("2. Logging in...")
        email_input = page.locator('input[type="email"], input[name="email"]')
        if email_input.count() > 0:
            email_input.fill('jaeho.lee@uos.ac.kr')
            password_input = page.locator('input[type="password"]')
            password_input.fill('test1234')
            submit_btn = page.locator('button[type="submit"]')
            submit_btn.click()
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

        # Navigate to research-notes
        print("3. Navigating to research-notes...")
        page.goto('http://localhost:3000/research-notes')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        os.makedirs('screenshots', exist_ok=True)
        page.screenshot(path='screenshots/research_notes_final.png', full_page=True)
        print("   Screenshot saved: screenshots/research_notes_final.png")

        # Check page content
        current_url = page.url
        print(f"4. Current URL: {current_url}")

        if "research-notes" in current_url:
            print("   [OK] Successfully loaded research-notes page!")

            # Check for key elements
            page_text = page.locator('body').inner_text()

            if "Internal Server Error" in page_text:
                print("   [ERROR] Page shows Internal Server Error")
                print(f"   Page text: {page_text[:300]}")
            else:
                # Check for stage filter
                stage_filter = page.locator('text=literature_review, text=methodology, text=data_collection').first
                print(f"   Stage filter elements: checking...")

                # Check for note cards or empty state
                if "research-notes" in page_text.lower() or "notes" in page_text.lower():
                    print("   [OK] Page loaded successfully!")

                # Print first 800 chars of page
                print(f"\n5. Page content preview:")
                print(page_text[:800] if len(page_text) > 800 else page_text)
        else:
            print(f"   [WARNING] Redirected to: {current_url}")

        browser.close()
        print("\nTest completed!")

if __name__ == "__main__":
    test_research_notes()
