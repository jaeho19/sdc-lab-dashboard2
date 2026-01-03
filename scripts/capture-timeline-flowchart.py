"""Capture timeline and flowchart screenshots"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

OUTPUT_DIR = "C:/dev/sdclab-dashboard/guide-screenshots"

def capture_timeline_flowchart():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Login
        print("1. Logging in...")
        page.goto("https://sdclab-dashboard.netlify.app/login")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        page.fill('input[type="email"]', "rdt9690@uos.ac.kr")
        page.fill('input[type="password"]', "SDCLAB03")
        page.click('button[type="submit"]')

        try:
            page.wait_for_url("**/dashboard**", timeout=15000)
        except:
            pass
        time.sleep(4)
        print("   Logged in")

        # Go to Research and find a project with timeline/flowchart
        print("2. Opening research project...")
        page.goto("https://sdclab-dashboard.netlify.app/research")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # Click on 농촌 태양광 project (has good data)
        page.click('text=농촌 태양광')
        page.wait_for_load_state("networkidle")
        time.sleep(4)

        # Get page height
        page_height = page.evaluate("document.body.scrollHeight")
        print(f"   Page height: {page_height}px")

        # Capture Timeline section (scroll to find it)
        print("3. Capturing timeline section...")
        # Timeline is usually after milestones, scroll down
        page.evaluate("window.scrollTo(0, 900)")
        time.sleep(2)
        page.screenshot(path=f"{OUTPUT_DIR}/13-research-timeline.png", full_page=False)
        print("   Saved: 13-research-timeline.png")

        # Capture Flowchart section (scroll further down)
        print("4. Capturing flowchart section...")
        page.evaluate("window.scrollTo(0, 1400)")
        time.sleep(2)
        page.screenshot(path=f"{OUTPUT_DIR}/14-research-flowchart.png", full_page=False)
        print("   Saved: 14-research-flowchart.png")

        # Try another project that might have flowchart content
        print("5. Checking 도시 재개발 project for flowchart...")
        page.goto("https://sdclab-dashboard.netlify.app/research")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        try:
            page.click('text=도시 재개발')
            page.wait_for_load_state("networkidle")
            time.sleep(4)

            # Scroll to flowchart area
            page.evaluate("window.scrollTo(0, 1200)")
            time.sleep(2)
            page.screenshot(path=f"{OUTPUT_DIR}/14-research-flowchart-alt.png", full_page=False)
            print("   Saved: 14-research-flowchart-alt.png")
        except Exception as e:
            print(f"   Could not capture alt flowchart: {e}")

        browser.close()
        print("\nScreenshots captured!")

if __name__ == "__main__":
    capture_timeline_flowchart()
