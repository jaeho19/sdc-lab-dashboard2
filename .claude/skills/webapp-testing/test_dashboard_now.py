"""Check current dashboard state"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "https://sdclab-dashboard.netlify.app"
EMAIL = "jaeho19@gmail.com"
PASSWORD = "Cory0012"

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Login
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Login\n")

            # Dashboard
            print("=== Dashboard Status ===")
            page.goto(f"{BASE_URL}/dashboard")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Get stats
            stats = page.locator('div.text-3xl, div.text-4xl').all()
            for stat in stats[:4]:
                print(f"  {stat.inner_text()}")

            # Get ongoing projects
            print("\n=== Ongoing Projects ===")
            ongoing = page.locator('text=진행 중인 연구').first
            if ongoing.count() > 0:
                section = ongoing.locator('xpath=ancestor::div[contains(@class,"Card") or contains(@class,"card")]').first
                projects = section.locator('a[href^="/research/"]').all()
                print(f"Count: {len(projects)}")
                for i, p in enumerate(projects[:5]):
                    title = p.inner_text()[:40]
                    print(f"  [{i+1}] {title}...")

            page.screenshot(path="/tmp/dashboard_current.png", full_page=True)
            print("\nScreenshot: /tmp/dashboard_current.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test()
