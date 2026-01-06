"""
AI Peer Review 제출 테스트 - 결과 확인
"""

from playwright.sync_api import sync_playwright
import os

SCREENSHOT_DIR = "C:/dev/sdclab-dashboard/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

TEST_EMAIL = "rdt9690@uos.ac.kr"
TEST_PASSWORD = "SDCLAB03"

def test_peer_review_submit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        api_responses = []

        def handle_response(response):
            if "/api/peer-review" in response.url:
                try:
                    body = response.text()[:3000] if response.status != 204 else ""
                    api_responses.append({
                        "method": response.request.method,
                        "status": response.status,
                        "body": body
                    })
                    print(f"   API [{response.request.method}] {response.status}")
                except:
                    pass

        page.on("response", handle_response)

        print("1. Login...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.locator('input[type="email"]').fill(TEST_EMAIL)
        page.locator('input[type="password"]').fill(TEST_PASSWORD)
        page.locator('button[type="submit"]').click()
        page.wait_for_timeout(3000)
        print(f"   URL: {page.url}")

        print("\n2. Go to Peer Review...")
        page.goto("http://localhost:3000/peer-review", wait_until="networkidle")
        page.wait_for_timeout(2000)

        print("\n3. Fill and submit...")
        page.locator('input[placeholder*="제목"]').fill("Test Review")
        page.locator('textarea').first.fill("Test content.")
        page.locator('button:has-text("AI 리뷰 요청")').click()

        # Wait for completion
        print("   Waiting for AI response...")
        try:
            # Wait for button to change back or for history tab to appear
            page.wait_for_function(
                """() => {
                    const btn = document.querySelector('button');
                    return btn && !btn.textContent.includes('생성 중');
                }""",
                timeout=60000
            )
            print("   Completed!")
        except:
            print("   Timeout - still processing")

        page.wait_for_timeout(2000)
        page.screenshot(path=f"{SCREENSHOT_DIR}/pr_result.png", full_page=True)

        print("\n4. Check results...")
        # Check if moved to history tab
        history_items = page.locator('button:has-text("Test Review")')
        if history_items.count() > 0:
            print("   Review found in history!")
            history_items.first.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{SCREENSHOT_DIR}/pr_result_detail.png", full_page=True)

        print("\n5. API Responses:")
        for resp in api_responses:
            print(f"   [{resp['method']}] {resp['status']}")
            if resp['method'] == 'POST':
                if resp['status'] >= 400:
                    print(f"   ERROR: {resp['body'][:500]}")
                else:
                    print(f"   SUCCESS: {resp['body'][:200]}...")

        browser.close()

if __name__ == "__main__":
    test_peer_review_submit()
