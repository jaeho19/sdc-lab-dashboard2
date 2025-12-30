"""Manual delete test with screenshots at each step"""
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
            # Step 1: Login
            print("=" * 50)
            print("STEP 1: Login")
            print("=" * 50)
            page.goto(f"{BASE_URL}/login")
            page.wait_for_load_state("networkidle")
            page.fill('input[name="email"]', EMAIL)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard**", timeout=30000)
            print("[OK] Logged in as jaeho19@gmail.com")

            # Step 2: Go to dashboard and count projects
            print("\n" + "=" * 50)
            print("STEP 2: Check Dashboard - Before Delete")
            print("=" * 50)
            page.goto(f"{BASE_URL}/dashboard")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            initial_projects = page.locator("a[href^='/research/']").count()
            print(f"Projects on dashboard: {initial_projects}")
            page.screenshot(path="/tmp/step2_dashboard_before.png", full_page=True)
            print("Screenshot: /tmp/step2_dashboard_before.png")

            # Step 3: Go to research list
            print("\n" + "=" * 50)
            print("STEP 3: Research List - Before Delete")
            print("=" * 50)
            page.goto(f"{BASE_URL}/research")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            research_projects = page.locator("a[href^='/research/']").all()
            print(f"Total projects in research list: {len(research_projects)}")

            # List first 5 projects
            for i, proj in enumerate(research_projects[:5]):
                href = proj.get_attribute("href")
                if href and href != "/research/new":
                    try:
                        text = proj.inner_text()[:40]
                        print(f"  [{i+1}] {text}...")
                    except:
                        pass

            page.screenshot(path="/tmp/step3_research_before.png", full_page=True)
            print("Screenshot: /tmp/step3_research_before.png")

            # Step 4: Go to first project detail
            print("\n" + "=" * 50)
            print("STEP 4: Project Detail Page - Find Delete Button")
            print("=" * 50)

            # Get first real project
            first_project = None
            for proj in research_projects:
                href = proj.get_attribute("href")
                if href and "/research/" in href and href != "/research/new":
                    first_project = href
                    break

            if first_project:
                page.goto(f"{BASE_URL}{first_project}")
                page.wait_for_load_state("networkidle")
                time.sleep(3)

                # Get project title
                title = page.locator('h1').first.inner_text() if page.locator('h1').count() > 0 else "Unknown"
                print(f"Project: {title[:50]}...")

                page.screenshot(path="/tmp/step4_project_detail.png", full_page=True)
                print("Screenshot: /tmp/step4_project_detail.png")

                # Find delete button
                edit_btn = page.locator('button:has-text("수정")').first
                if edit_btn.count() > 0:
                    parent = edit_btn.locator('xpath=..')
                    buttons = parent.locator('button').all()
                    print(f"Buttons in header: {len(buttons)}")

                    if len(buttons) >= 2:
                        print("[OK] Delete button (trash icon) found!")

                        # Step 5: Click delete button
                        print("\n" + "=" * 50)
                        print("STEP 5: Click Delete Button - Show Dialog")
                        print("=" * 50)

                        delete_btn = buttons[1]
                        delete_btn.click()
                        time.sleep(1)

                        # Check dialog appeared
                        dialog = page.locator('[role="alertdialog"]')
                        if dialog.count() > 0:
                            dialog_title = dialog.locator('h2').inner_text() if dialog.locator('h2').count() > 0 else ""
                            print(f"Dialog opened: {dialog_title}")

                            page.screenshot(path="/tmp/step5_delete_dialog.png", full_page=True)
                            print("Screenshot: /tmp/step5_delete_dialog.png")

                            # Step 6: Confirm delete
                            print("\n" + "=" * 50)
                            print("STEP 6: Confirm Delete")
                            print("=" * 50)

                            confirm_btn = page.locator('button:has-text("삭제")').last
                            if confirm_btn.count() > 0:
                                print(f"Deleting project: {title[:30]}...")
                                confirm_btn.click()
                                time.sleep(5)

                                print(f"Redirected to: {page.url}")
                                page.screenshot(path="/tmp/step6_after_delete.png", full_page=True)
                                print("Screenshot: /tmp/step6_after_delete.png")

                                # Step 7: Verify on research list
                                print("\n" + "=" * 50)
                                print("STEP 7: Verify - Research List After Delete")
                                print("=" * 50)

                                page.goto(f"{BASE_URL}/research")
                                page.wait_for_load_state("networkidle")
                                time.sleep(2)

                                after_projects = page.locator("a[href^='/research/']").count()
                                print(f"Projects after delete: {after_projects}")

                                # Check if deleted project is gone
                                found = page.locator(f'a[href="{first_project}"]').count()
                                if found == 0:
                                    print(f"[OK] Project removed from research list!")
                                else:
                                    print(f"[X] Project still in list")

                                page.screenshot(path="/tmp/step7_research_after.png", full_page=True)
                                print("Screenshot: /tmp/step7_research_after.png")

                                # Step 8: Verify dashboard
                                print("\n" + "=" * 50)
                                print("STEP 8: Verify - Dashboard After Delete")
                                print("=" * 50)

                                page.goto(f"{BASE_URL}/dashboard")
                                page.wait_for_load_state("networkidle")
                                time.sleep(2)

                                final_projects = page.locator("a[href^='/research/']").count()
                                print(f"Dashboard projects after: {final_projects}")
                                print(f"Change: {initial_projects} -> {final_projects}")

                                page.screenshot(path="/tmp/step8_dashboard_after.png", full_page=True)
                                print("Screenshot: /tmp/step8_dashboard_after.png")

                                # Final result
                                print("\n" + "=" * 50)
                                print("RESULT")
                                print("=" * 50)
                                if found == 0:
                                    print("[SUCCESS] Delete functionality working correctly!")
                                else:
                                    print("[PARTIAL] Delete may have issues")
                            else:
                                print("[X] Confirm button not found")
                        else:
                            print("[X] Dialog did not appear")
                    else:
                        print("[X] Delete button not found in header")
                else:
                    print("[X] Edit button not found")
            else:
                print("[X] No project found")

        except Exception as e:
            print(f"[ERROR] {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path="/tmp/error.png", full_page=True)
        finally:
            browser.close()

if __name__ == "__main__":
    test()
