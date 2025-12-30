from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 콘솔 로그 캡처
    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    # 1. 로그인
    print("1. Logging in...")
    page.goto('http://localhost:3002/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    email_input = page.locator('input#email')
    password_input = page.locator('input#password')

    if email_input.count() > 0:
        email_input.fill("jaeho19")
        password_input.fill("Cory0012")

        login_button = page.locator('button[type="submit"]')
        login_button.click()

        print("   Waiting for login...")
        page.wait_for_timeout(3000)
        print(f"   Current URL: {page.url}")

    # 2. 프로젝트 생성 페이지로 이동
    print("2. Navigating to /research/new...")
    page.goto('http://localhost:3002/research/new')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print(f"   Current URL: {page.url}")

    if '/login' in page.url:
        print("   Still on login page - login may have failed")
        page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/login_failed.png', full_page=True)
    else:
        # 3. 프로젝트 생성 폼 작성
        print("3. Filling project form...")
        page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/project_form.png', full_page=True)

        title_input = page.locator('input#title')
        if title_input.count() > 0:
            title_input.fill("테스트 프로젝트 - 자동 생성")
            print("   Filled title")

        page.wait_for_timeout(500)

        # 4. 프로젝트 생성 버튼 클릭
        print("4. Clicking submit button...")
        submit_button = page.locator('button[type="submit"]')
        if submit_button.count() > 0:
            submit_button.click()
            page.wait_for_timeout(5000)

            print(f"   Current URL after submit: {page.url}")
            page.screenshot(path='C:/dev/sdclab-dashboard/.claude/skills/webapp-testing/after_submit.png', full_page=True)

            # 성공 여부 확인
            if '/research/' in page.url and '/new' not in page.url:
                print("\n   ✅ SUCCESS! Project created and redirected!")
                # 프로젝트 ID 추출
                project_id = page.url.split('/research/')[-1]
                print(f"   Project ID: {project_id}")
            else:
                # 에러 메시지 확인
                error_div = page.locator('.text-red-600, .bg-red-50')
                if error_div.count() > 0:
                    print("\n   ❌ ERROR:")
                    for i in range(error_div.count()):
                        print(f"      {error_div.nth(i).text_content()}")
                else:
                    print("   Still on form page...")

    # 콘솔 에러 출력
    print("\n=== Console Errors ===")
    for log in console_logs:
        if 'error' in log.lower():
            print(log)

    browser.close()
