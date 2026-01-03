import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../docs/manual.html');
const pdfPath = path.resolve(__dirname, '../public/SDC_Lab_Dashboard_사용설명서.pdf');

async function convertToPdf() {
  console.log('HTML 파일 경로:', htmlPath);
  console.log('PDF 출력 경로:', pdfPath);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // HTML 파일 로드
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  // PDF 생성
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm',
    },
    printBackground: true,
  });

  await browser.close();
  console.log('PDF 변환 완료!');
}

convertToPdf().catch(console.error);
