/**
 * Web Vitals 모니터링
 *
 * Core Web Vitals 지표를 추적하고 콘솔/분석 서비스로 전송
 *
 * 지표:
 * - LCP (Largest Contentful Paint): 로딩 성능
 * - INP (Interaction to Next Paint): 상호작용 반응성 (FID 대체)
 * - CLS (Cumulative Layout Shift): 시각적 안정성
 * - FCP (First Contentful Paint): 초기 렌더링
 * - TTFB (Time to First Byte): 서버 응답 속도
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

// 지표 임계값 (Google 권장)
const thresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

type MetricName = keyof typeof thresholds;

function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  const threshold = thresholds[name];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

function formatValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

/**
 * Web Vitals 지표를 콘솔에 출력 (개발 환경용)
 */
function logMetric(metric: Metric) {
  const { name, value, rating } = metric;

  const colors = {
    good: "color: #0cce6b",
    "needs-improvement": "color: #ffa400",
    poor: "color: #ff4e42",
  };

  const actualRating = rating || getRating(name as MetricName, value);
  const color = colors[actualRating];
  const formattedValue = formatValue(name, value);

  console.log(
    `%c[Web Vitals] ${name}: ${formattedValue} (${actualRating})`,
    color
  );
}

/**
 * Web Vitals 지표를 분석 서비스로 전송
 * 필요시 Google Analytics, Vercel Analytics 등으로 전송 가능
 */
function sendToAnalytics(metric: Metric) {
  // 예: Google Analytics로 전송
  // gtag('event', metric.name, {
  //   event_category: 'Web Vitals',
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   event_label: metric.id,
  //   non_interaction: true,
  // });

  // 예: 커스텀 분석 엔드포인트로 전송
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  //   headers: { 'Content-Type': 'application/json' },
  // });
}

/**
 * Web Vitals 모니터링 초기화
 *
 * 개발 환경에서는 콘솔 출력
 * 프로덕션 환경에서는 분석 서비스로 전송
 */
export function initWebVitals() {
  const isDev = process.env.NODE_ENV === "development";

  const reportHandler = (metric: Metric) => {
    if (isDev) {
      logMetric(metric);
    } else {
      sendToAnalytics(metric);
    }
  };

  // Core Web Vitals
  onLCP(reportHandler);
  onINP(reportHandler);
  onCLS(reportHandler);

  // Additional metrics
  onFCP(reportHandler);
  onTTFB(reportHandler);
}

/**
 * Web Vitals 요약 리포트 생성
 */
export function getVitalsReport(): Promise<Record<string, Metric>> {
  return new Promise((resolve) => {
    const report: Record<string, Metric> = {};
    let collected = 0;
    const total = 5;

    const handleMetric = (metric: Metric) => {
      report[metric.name] = metric;
      collected++;
      if (collected >= total) {
        resolve(report);
      }
    };

    onLCP(handleMetric);
    onINP(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);

    // 10초 후 타임아웃
    setTimeout(() => resolve(report), 10000);
  });
}
