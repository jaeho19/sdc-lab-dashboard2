import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  // 1. 로그인 페이지
  console.log('1. 로그인 페이지 캡쳐...');
  await page.goto('https://sdclab-dashboard.netlify.app/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(screenshotsDir, '01-login.png'),
    fullPage: false
  });

  // 로그인 수행
  console.log('로그인 중...');
  await page.fill('input[type="email"]', 'rdt9690@uos.ac.kr');
  await page.fill('input[type="password"]', 'SDCLAB03');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // 환영 팝업/토스트 닫기
  console.log('환영 팝업 닫는 중...');
  await page.waitForTimeout(2000); // 팝업이 나타날 때까지 대기

  // 토스트 닫기 버튼 클릭 시도
  try {
    const closeButton = page.locator('[data-sonner-toast] button, [role="status"] button, .toast button, [data-dismiss]').first();
    if (await closeButton.isVisible({ timeout: 1000 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    // 팝업이 없으면 무시
  }

  // 토스트가 사라질 때까지 대기
  await page.waitForTimeout(3000);

  // 2. 대시보드
  console.log('2. 대시보드 캡쳐...');
  await page.screenshot({
    path: path.join(screenshotsDir, '02-dashboard.png'),
    fullPage: false
  });

  // 3. 연구원 목록
  console.log('3. 연구원 목록 캡쳐...');
  await page.goto('https://sdclab-dashboard.netlify.app/members');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, '03-members.png'),
    fullPage: false
  });

  // 4. 연구 프로젝트 목록
  console.log('4. 연구 프로젝트 목록 캡쳐...');
  await page.goto('https://sdclab-dashboard.netlify.app/research');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, '04-research.png'),
    fullPage: false
  });

  // 5. 연구노트 페이지
  console.log('5. 연구노트 페이지 캡쳐...');
  await page.goto('https://sdclab-dashboard.netlify.app/research-notes');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(screenshotsDir, '05-research-notes.png'),
    fullPage: false
  });

  // 6. 캘린더
  console.log('6. 캘린더 캡쳐...');
  await page.goto('https://sdclab-dashboard.netlify.app/calendar');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, '06-calendar.png'),
    fullPage: false
  });

  // 7. 멘토링
  console.log('7. 멘토링 캡쳐...');
  await page.goto('https://sdclab-dashboard.netlify.app/mentoring');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, '07-mentoring.png'),
    fullPage: false
  });

  await browser.close();
  console.log('스크린샷 캡쳐 완료!');
}

captureScreenshots().catch(console.error);
