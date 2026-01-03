from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("1. Navigating to site...")
    page.goto('https://sdclab-dashboard.netlify.app')
    page.wait_for_load_state('networkidle')

    # Take initial screenshot
    page.screenshot(path='/tmp/01_initial.png', full_page=True)
    print("   Screenshot saved: /tmp/01_initial.png")

    # Check if we need to login
    current_url = page.url
    print(f"   Current URL: {current_url}")

    if 'login' in current_url:
        print("2. Need to login first...")
        # Fill login form
        page.fill('input[type="email"]', 'jaeho19@uos.ac.kr')
        page.fill('input[type="password"]', 'test1234')
        page.click('button[type="submit"]')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        page.screenshot(path='/tmp/02_after_login.png', full_page=True)
        print("   Screenshot saved: /tmp/02_after_login.png")

    # Navigate to Research Articles
    print("3. Navigating to Research Articles...")
    page.click('text=Research')
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    page.screenshot(path='/tmp/03_research_list.png', full_page=True)
    print("   Screenshot saved: /tmp/03_research_list.png")

    # Click on first project
    print("4. Clicking on first project...")
    # Find project cards or links
    project_links = page.locator('a[href^="/research/"]').all()
    print(f"   Found {len(project_links)} project links")

    if len(project_links) > 0:
        project_links[0].click()
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        page.screenshot(path='/tmp/04_project_detail.png', full_page=True)
        print("   Screenshot saved: /tmp/04_project_detail.png")

        # Scroll down to find research notes section
        print("5. Looking for research notes section...")
        page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
        time.sleep(1)
        page.screenshot(path='/tmp/05_scrolled.png', full_page=True)
        print("   Screenshot saved: /tmp/05_scrolled.png")

        # Look for "새 노트 작성" button
        print("6. Looking for '새 노트 작성' button...")
        new_note_button = page.locator('text=새 노트 작성')

        if new_note_button.count() > 0:
            print("   Found '새 노트 작성' button, clicking...")
            new_note_button.click()
            time.sleep(1)
            page.screenshot(path='/tmp/06_note_form.png', full_page=True)
            print("   Screenshot saved: /tmp/06_note_form.png")

            # Check the milestone dropdown
            print("7. Checking milestone dropdown...")
            # Find Select component for milestone
            milestone_trigger = page.locator('button:has-text("마일스톤")').first
            if milestone_trigger.count() == 0:
                milestone_trigger = page.locator('[role="combobox"]').first

            if milestone_trigger.count() > 0:
                print("   Found milestone dropdown, clicking...")
                milestone_trigger.click()
                time.sleep(0.5)
                page.screenshot(path='/tmp/07_milestone_dropdown.png', full_page=True)
                print("   Screenshot saved: /tmp/07_milestone_dropdown.png")

                # Get dropdown content HTML to check text color
                dropdown_content = page.locator('[role="listbox"], [role="option"]').all()
                print(f"   Found {len(dropdown_content)} dropdown items")

                # Capture computed styles
                select_items = page.locator('[role="option"]').all()
                for i, item in enumerate(select_items):
                    text = item.text_content()
                    # Get computed color style
                    color = item.evaluate('el => window.getComputedStyle(el).color')
                    bg = item.evaluate('el => window.getComputedStyle(el).backgroundColor')
                    print(f"   Item {i}: '{text}' - color: {color}, bg: {bg}")
            else:
                print("   Could not find milestone dropdown trigger")
                # Take screenshot of the form area
                form_html = page.locator('form, [role="dialog"]').first.inner_html()
                print(f"   Form HTML snippet: {form_html[:500]}...")
        else:
            print("   '새 노트 작성' button not found")
            # Check page content
            page_text = page.content()
            if '연구노트' in page_text:
                print("   '연구노트' text found in page")
            else:
                print("   '연구노트' text NOT found - section may not be rendered")
    else:
        print("   No project links found")

    browser.close()
    print("\nTest completed!")
