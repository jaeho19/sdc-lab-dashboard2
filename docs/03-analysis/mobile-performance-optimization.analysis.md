# Gap Analysis: mobile-performance-optimization

## Analysis Date: 2026-03-01 (Re-analysis)

## Overall Match Rate: 93%

## Item-by-Item Results

| # | Priority | Item | Status | Score |
|---|:--------:|------|:------:|:-----:|
| 1 | P0 | loading.tsx 스켈레톤 4개 페이지 추가 | PASS | 1.0 |
| 2 | P0 | 폰트 preload 최적화 (preload: false) | PASS | 1.0 |
| 3 | P0 | Layout 쿼리 병렬화 + select 최적화 | PARTIAL | 0.7 |
| 4 | P1 | FullTimeMembersGantt 동적 import | PASS | 1.0 |
| 5 | P1 | 캘린더 이벤트 날짜 범위 제한 (3개월~12개월) | PASS | 1.0 |
| 6 | P2 | transition-all → transition-[margin] | PASS | 1.0 |
| 7 | P2 | optimizePackageImports 설정 | ACCEPTABLE | 0.9 |
| 8 | P2 | getUnreadNotificationCount userId 파라미터 추가 | PASS | 1.0 |

## Gap Details

### Item 3: Layout 쿼리 select 필드 (PARTIAL)
- **Plan**: `select("name, avatar_url, role, status")` 등 필드 지정
- **Implementation**: `select("*")` (커밋 5354954에서 revert)
- **Reason**: 특정 필드 select 시 Member 타입 불일치로 로그인 후 화이트 스크린 발생하여 revert
- **Impact**: Low - 단일 행 쿼리이므로 성능 영향 미미. Promise.all 병렬화는 정상 동작 중

### Item 7: optimizePackageImports (ACCEPTABLE)
- **Plan**: `['lucide-react', '@radix-ui/react-icons']`
- **Implementation**: `["lucide-react"]` only
- **Reason**: `@radix-ui/react-icons`는 프로젝트에 설치되지 않은 패키지 (plan 문서 오류)
- **Impact**: None

## Members 페이지 DB 컬럼 수정 검증

### 수정 전 (버그)
```
.select("id, name, email, position, employment_type, avatar_url, status, enrollment_year, expected_graduation_year, admission_date, graduation_date")
```
- `enrollment_year`, `expected_graduation_year`: DB에 존재하지 않는 컬럼 → 쿼리 실패 → 빈 페이지

### 수정 후 (정상)
```
.select("id, name, email, position, employment_type, avatar_url, status, admission_date, graduation_date")
```
- 모든 컬럼이 DB에 존재하는 유효한 컬럼
- UI에서 `admission_date`/`graduation_date` 사용하여 입학/졸업 년도 표시

**Verdict**: Fix confirmed. 무효 컬럼 제거 완료.

## Implementation Deviations (Plan != Implementation, Acceptable)

| Item | Plan | 실제 구현 | 사유 |
|------|------|-----------|------|
| Layout select 필드 | 특정 필드 지정 | select("*") | 타입 불일치로 화이트 스크린 발생하여 revert |
| 폰트 preload | 400/700만 preload | 전체 preload: false | Next.js localFont API가 per-weight preload 미지원 |
| transition | transition-[margin-left] | transition-[margin] | 기능적으로 동일 |
| optimizePackageImports | lucide-react + @radix-ui/react-icons | lucide-react only | @radix-ui/react-icons 미설치 |

## Success Criteria

| Criterion | Status |
|-----------|:------:|
| 모바일 페이지 전환 시 빈 화면 대신 스켈레톤 표시 | PASS |
| Layout 렌더 시 Supabase RTT 1회 병렬로 단축 | PASS |
| 폰트 preload 데이터 감소 (637KB → 0KB preload) | PASS |
| Members 페이지 초기 JS 번들 Gantt 분리 | PASS |
| 캘린더 이벤트 쿼리에 날짜 범위 제한 적용 | PASS |

## Conclusion
모든 성공 기준 5/5 충족. Match Rate 93% >= 90% 기준 통과.
주요 gap은 Layout select("*") revert 1건 (화이트 스크린 버그 수정으로 인한 정당한 revert).
Members 페이지 DB 컬럼 버그 수정 확인 완료.
Report 단계 진행 권장.
