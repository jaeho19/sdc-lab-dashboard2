"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/web-vitals";

/**
 * Web Vitals Reporter Component
 *
 * 클라이언트 측에서 Web Vitals 모니터링을 초기화합니다.
 * 루트 레이아웃에 추가하여 전체 앱에서 성능 지표를 수집합니다.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}
