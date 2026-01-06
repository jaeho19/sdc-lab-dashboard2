"""
AI Peer Review 기능 테스트
"""

from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

TEST_EMAIL = "rdt9690@uos.ac.kr"
TEST_PASSWORD = "SDCLAB03"

def test_peer_review():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # 콘솔 로그 캡처
        console_logs = []
        api_responses = []

        page.on("console", lambda msg: console_logs.append({
            "type": msg.type,
            "text": msg.text[:500] if msg.text else ""
        }))
        page.on("pageerror", lambda err: console_logs.append({
            "type": "pageerror",
            "text": str(err)[:500]
        }))

        def handle_response(response):
            if "/api/" in response.url:
                try:
                    body = ""
                    if response.status >= 400:
                        try:
                            body = response.text()[:1000]
                        except:
                            pass
                    api_responses.append({
                        "url": response.url,
                        "status": response.status,
                        "body": body
                    })
                except:
                    pass

        page.on("response", handle_response)

        print("1. Login...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(2000)

        email_input = page.locator('input[type="email"]')
        if email_input.count() > 0:
            email_input.fill(TEST_EMAIL)
            page.locator('input[type="password"]').fill(TEST_PASSWORD)
            page.locator('button[type="submit"]').click()
            page.wait_for_timeout(4000)
            page.wait_for_load_state("networkidle")

        print(f"   Current URL: {page.url}")
        page.screenshot(path=f"{SCREENSHOT_DIR}/pr_01_after_login.png")

        if "/login" in page.url:
            print("   Login failed!")
            # Check error message
            error = page.locator('[class*="error"], [class*="destructive"]')
            if error.count() > 0:
                print(f"   Error: {error.first.text_content()}")
            browser.close()
            return

        print("\n2. Navigate to Peer Review page...")
        page.goto("http://localhost:3000/peer-review", wait_until="networkidle")
        page.wait_for_timeout(3000)

        print(f"   Current URL: {page.url}")
        page.screenshot(path=f"{SCREENSHOT_DIR}/pr_02_page.png", full_page=True)

        # Check for errors on page
        print("\n3. Check page errors...")
        error_elements = page.locator('[class*="error"], [class*="destructive"], .text-red-500')
        if error_elements.count() > 0:
            for i in range(min(error_elements.count(), 3)):
                text = error_elements.nth(i).text_content()
                if text and len(text.strip()) > 0:
                    print(f"   Page error: {text[:200]}")

        # Check API errors
        print("\n4. API responses:")
        for resp in api_responses:
            status_icon = "OK" if resp["status"] < 400 else "ERROR"
            print(f"   [{status_icon}] {resp['status']} - {resp['url']}")
            if resp["body"]:
                print(f"        Body: {resp['body'][:300]}")

        # Check console errors
        print("\n5. Console errors:")
        errors = [log for log in console_logs if log["type"] in ["error", "pageerror"]]
        if errors:
            for err in errors[:5]:
                print(f"   {err['type']}: {err['text'][:300]}")
        else:
            print("   No console errors")

        # Check if page loaded correctly
        print("\n6. Page elements check...")
        title = page.locator('h1:has-text("AI Peer Review")')
        if title.count() > 0:
            print("   AI Peer Review page loaded OK")

            # Check history tab
            history_tab = page.locator('button:has-text("History"), button:has-text("기록")')
            if history_tab.count() > 0:
                history_tab.first.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=f"{SCREENSHOT_DIR}/pr_03_history.png", full_page=True)
        else:
            print("   AI Peer Review page NOT loaded")
            # Check for 404
            if page.locator('text=404').count() > 0:
                print("   404 error!")

        print("\nTest complete!")
        browser.close()

if __name__ == "__main__":
    test_peer_review()
