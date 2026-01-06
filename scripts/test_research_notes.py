# -*- coding: utf-8 -*-
"""Test research notes feature"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_research_notes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Go to login page
        print("1. Going to login page...")
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')
        page.screenshot(path='screenshots/01_login_page.png', full_page=True)

        # 2. Login
        print("2. Logging in...")
        page.fill('input[type="email"]', 'jaeho19@uos.ac.kr')
        page.fill('input[type="password"]', 'admin123!')
        page.click('button[type="submit"]')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        page.screenshot(path='screenshots/02_after_login.png', full_page=True)

        # 3. Go to Research Articles page
        print("3. Going to Research Articles...")
        page.goto('http://localhost:3000/research')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        page.screenshot(path='screenshots/03_research_page.png', full_page=True)

        # Check current URL
        print(f"   Current URL: {page.url}")

        # 4. Find and click first project
        print("4. Looking for projects...")

        # Try different selectors for project links
        project_links = page.locator('a[href^="/research/"]').all()
        print(f"   Found {len(project_links)} project links")

        if len(project_links) > 0:
            first_link = project_links[0]
            href = first_link.get_attribute('href')
            print(f"   Clicking project: {href}")
            first_link.click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/04_project_detail.png', full_page=True)
            print(f"   Now at: {page.url}")

            # 5. Look for Notes tab
            print("5. Looking for Notes tab...")
            tabs = page.locator('button[role="tab"], [data-state]').all()
            print(f"   Found {len(tabs)} tabs")
            for tab in tabs:
                text = tab.text_content()
                print(f"   - Tab: {text}")

            # Try clicking notes tab
            notes_tab = page.locator('button:has-text("Notes"), button:has-text("note")')
            if notes_tab.count() > 0:
                notes_tab.first.click()
                time.sleep(1)
                page.screenshot(path='screenshots/05_notes_tab.png', full_page=True)
                print("   Notes tab clicked")

                # 6. Look for Add Note button
                print("6. Looking for Add Note button...")
                buttons = page.locator('button').all()
                for btn in buttons[:15]:
                    print(f"   - Button: {btn.text_content()}")

                add_btn = page.locator('button:has-text("Add"), button:has-text("New")')
                if add_btn.count() > 0:
                    add_btn.first.click()
                    time.sleep(1)
                    page.screenshot(path='screenshots/06_add_note_dialog.png', full_page=True)
                    print("   Add Note dialog opened")
                else:
                    print("   No Add button found")
            else:
                print("   Notes tab not found")
        else:
            print("   No projects found on page")
            # Get page content for debugging
            content = page.content()
            print(f"   Page title: {page.title()}")

        browser.close()
        print("\nTest completed! Check screenshots/ folder.")

if __name__ == "__main__":
    import os
    os.makedirs('screenshots', exist_ok=True)
    test_research_notes()
