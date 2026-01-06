"""
AI Peer Review 리뷰 기록 확인
"""

from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
TEST_EMAIL = "rdt9690@uos.ac.kr"
TEST_PASSWORD = "SDCLAB03"

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        print("1. Login...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.locator('input[type="email"]').fill(TEST_EMAIL)
        page.locator('input[type="password"]').fill(TEST_PASSWORD)
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(3000)

        print("2. Go to Peer Review...")
        page.goto("http://localhost:3000/peer-review", wait_until="networkidle")
        page.wait_for_timeout(2000)

        print("3. Click history tab...")
        history_tab = page.locator('button:has-text("기록")')
        if history_tab.count() > 0:
            history_tab.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=f"{SCREENSHOT_DIR}/pr_history_tab.png", full_page=True)

            # Check review items
            review_items = page.locator('.divide-y button')
            print(f"   Found {review_items.count()} review items")

            if review_items.count() > 0:
                # Click first review
                review_items.first.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=f"{SCREENSHOT_DIR}/pr_history_detail.png", full_page=True)

                # Check for review result
                result_area = page.locator('.flowchart-content, .prose')
                if result_area.count() > 0:
                    print("   Review result displayed!")
                else:
                    print("   No review result found")

                # Check for error badge
                error_badge = page.locator('text=error, text=Error')
                if error_badge.count() > 0:
                    print("   ERROR badge found!")

        browser.close()

if __name__ == "__main__":
    test()
