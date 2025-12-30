from playwright.sync_api import sync_playwright
import time

PORT = 3009  # 현재 서버 포트

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_default_timeout(60000)

    # 1. 로그인 페이지로 이동
    print("1. 로그인 페이지로 이동...")
    page.goto(f'http://localhost:{PORT}/login', wait_until='domcontentloaded')
    time.sleep(2)

    current_url = page.url
    print(f"현재 URL: {current_url}")
    page.screenshot(path='step1_login.png', full_page=True)

    # 2. 로그인
    print("2. 로그인 시도...")
    email = 'jaeho19@gmail.com'
    page.fill('input#email', email)
    page.fill('input#password', 'Cory0012')
    page.screenshot(path='step2_filled.png', full_page=True)

    page.click('button[type="submit"]')
    print(f"로그인: {email} / Cory0012")
    time.sleep(5)

    page.screenshot(path='step3_after_login.png', full_page=True)
    current_url = page.url
    print(f"로그인 후 URL: {current_url}")

    # 에러 확인
    error_div = page.locator('.text-red-600')
    if error_div.count() > 0:
        print(f"로그인 에러: {error_div.first.text_content()}")

    # 3. Research 페이지로 이동
    print("3. Research 페이지로 이동...")
    page.goto(f'http://localhost:{PORT}/research', wait_until='domcontentloaded')
    time.sleep(3)

    current_url = page.url
    print(f"Research 페이지 URL: {current_url}")
    page.screenshot(path='step4_research.png', full_page=True)

    # 페이지 내용 확인
    body_text = page.locator('body').text_content()
    print(f"페이지 내용: {body_text[:200] if body_text else 'empty'}")

    # 4. 새 프로젝트 버튼 찾기
    print("4. 버튼 목록 확인...")
    all_buttons = page.locator('button').all()
    print(f"버튼 개수: {len(all_buttons)}")
    for i, btn in enumerate(all_buttons[:10]):
        try:
            txt = btn.text_content()
            print(f"  [{i}] {txt[:50] if txt else '(empty)'}")
        except:
            pass

    # 새 프로젝트 버튼 또는 링크 클릭
    new_btn = page.locator('a:has-text("새 프로젝트"), button:has-text("새 프로젝트")')
    if new_btn.count() > 0:
        print("5. 새 프로젝트 버튼 클릭...")
        new_btn.first.click()
        time.sleep(2)
        page.screenshot(path='step5_new_project.png', full_page=True)
        print(f"새 프로젝트 페이지 URL: {page.url}")

        # 폼 입력
        print("6. 폼 입력...")
        title = page.locator('input[name="title"], input#title')
        if title.count() > 0:
            title.fill('테스트 프로젝트 ' + str(int(time.time())))
            print("  제목 입력 완료")

        desc = page.locator('textarea[name="description"], textarea#description')
        if desc.count() > 0:
            desc.fill('자동화 테스트 프로젝트')
            print("  설명 입력 완료")

        page.screenshot(path='step6_filled_form.png', full_page=True)

        # 제출
        print("7. 제출 버튼 클릭...")
        submit = page.locator('button[type="submit"], button:has-text("생성")')
        if submit.count() > 0:
            submit.first.click()
            time.sleep(4)
            page.screenshot(path='step7_result.png', full_page=True)
            print(f"결과 URL: {page.url}")

            # 에러 확인
            error = page.locator('[role="alert"], .text-red-600, .text-destructive')
            if error.count() > 0:
                print(f"에러: {error.first.text_content()}")
            else:
                print("성공!")
    else:
        print("새 프로젝트 버튼 없음")

    browser.close()
    print("완료!")
