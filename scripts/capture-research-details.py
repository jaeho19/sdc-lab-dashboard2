"""Capture additional Research section screenshots with longer waits"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time
import os

OUTPUT_DIR = "C:/dev/sdclab-dashboard/guide-screenshots"

def capture_research_details():
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

        # Go to Research list
        print("2. Capturing Research list...")
        page.goto("https://sdclab-dashboard.netlify.app/research")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        page.screenshot(path=f"{OUTPUT_DIR}/05-research-list.png", full_page=False)
        print("   Saved: 05-research-list.png")

        # Click on a project with content
        print("3. Opening a project with data...")
        # Try to find 농촌 태양광 project (100% progress)
        page.click('text=농촌 태양광')
        page.wait_for_load_state("networkidle")
        time.sleep(4)

        # Full page screenshot for project detail
        print("4. Capturing full project detail page...")
        page.screenshot(path=f"{OUTPUT_DIR}/06-research-detail-full.png", full_page=True)
        print("   Saved: 06-research-detail-full.png")

        # Screenshot at top - basic info
        print("5. Capturing project header...")
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)
        page.screenshot(path=f"{OUTPUT_DIR}/06-research-detail-header.png", full_page=False)
        print("   Saved: 06-research-detail-header.png")

        # Scroll to milestones section
        print("6. Capturing milestones/checklist...")
        page.evaluate("window.scrollTo(0, 600)")
        time.sleep(2)
        page.screenshot(path=f"{OUTPUT_DIR}/07-research-milestones.png", full_page=False)
        print("   Saved: 07-research-milestones.png")

        # Go back and find another project with flowchart
        print("7. Looking for project with flowchart...")
        page.goto("https://sdclab-dashboard.netlify.app/research")
        page.wait_for_load_state("networkidle")
        time.sleep(3)

        # Click on 도시 재개발 project
        try:
            page.click('text=도시 재개발')
            page.wait_for_load_state("networkidle")
            time.sleep(4)

            # Scroll to flowchart
            page.evaluate("window.scrollTo(0, 800)")
            time.sleep(2)
            page.screenshot(path=f"{OUTPUT_DIR}/08-research-flowchart.png", full_page=False)
            print("   Saved: 08-research-flowchart.png")
        except:
            print("   Could not find 도시 재개발 project")

        # Capture new project form
        print("8. Capturing new project form...")
        page.goto("https://sdclab-dashboard.netlify.app/research/new")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        page.screenshot(path=f"{OUTPUT_DIR}/09-research-new-project.png", full_page=False)
        print("   Saved: 09-research-new-project.png")

        # Calendar
        print("9. Capturing Calendar...")
        page.goto("https://sdclab-dashboard.netlify.app/calendar")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        page.screenshot(path=f"{OUTPUT_DIR}/10-calendar.png", full_page=False)
        print("   Saved: 10-calendar.png")

        # Mentoring
        print("10. Capturing Mentoring...")
        page.goto("https://sdclab-dashboard.netlify.app/mentoring")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        page.screenshot(path=f"{OUTPUT_DIR}/11-mentoring-list.png", full_page=False)
        print("   Saved: 11-mentoring-list.png")

        # AI Peer Review
        print("11. Capturing AI Peer Review...")
        page.goto("https://sdclab-dashboard.netlify.app/peer-review")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        page.screenshot(path=f"{OUTPUT_DIR}/12-ai-peer-review.png", full_page=False)
        print("   Saved: 12-ai-peer-review.png")

        browser.close()
        print(f"\nAll screenshots saved!")

if __name__ == "__main__":
    capture_research_details()
