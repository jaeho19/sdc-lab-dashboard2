# Gap Analysis: Research Map Node Highlight

> Feature: `research-map-highlight`
> Analyzed: 2026-03-30
> Plan: `docs/01-plan/features/research-map-highlight.plan.md`
> Implementation: `src/components/features/research-map/research-map-graph.tsx`

---

## Match Rate: 100%

---

## Success Criteria Verification

| # | Criterion | Plan Spec | Implementation | Status |
|---|-----------|-----------|----------------|--------|
| 1 | 노드 클릭 시 골드 stroke | `#FFD700`, stroke-width 3 | `attr("stroke", "#FFD700")`, `attr("stroke-width", 3)`, `attr("stroke-opacity", 1)` (line 231-233) | PASS |
| 2 | 비연결 노드 opacity 0.15 | opacity 0.15, stroke-opacity 0.1 | `attr("opacity", 0.15)`, `attr("stroke-opacity", 0.1)` (line 246-249) | PASS |
| 3 | 연결 엣지 #FFD700, width 2.5 | stroke #FFD700, width 2.5, opacity 0.8 | `targetColor = "#FFD700"`, `targetWidth = 2.5`, `targetOpacity = 0.8` (line 291-293) | PASS |
| 4 | 비연결 엣지 opacity 0.05 | opacity 0.05 | `targetOpacity = 0.05` (line 295) | PASS |
| 5 | 배경 클릭으로 해제 | `setSelectedNode(null)` on background click | Background rect `.on("click", () => setSelectedNode(null))` (line 586) | PASS |
| 6 | 동일 노드 재클릭으로 해제 | Toggle via `selectedNodeRef.current === d.id` | `if (selectedNodeRef.current === d.id) setSelectedNode(null)` (line 500-501) | PASS |
| 7 | 전환 애니메이션 ~300ms | D3 transition duration 300ms | `.transition().duration(duration)` with default `duration = 300` (line 180) | PASS |
| 8 | View Mode 변경 시 초기화 | `handleViewModeChange` calls `setSelectedNode(null)` | `setSelectedNode(null); setViewMode(mode)` (line 654) | PASS |
| 9 | Drag/Tooltip 동작 정상 | `dragMoved` flag separates drag from click; mouseover/mouseout unchanged | Drag handler uses `dragMoved` flag (line 481-507); tooltip handlers unchanged (line 556-575) | PASS |
| 10 | 빌드 성공 | `npm run build` 0 errors | Build completed successfully (verified) | PASS |

---

## Detailed Implementation Mapping

### Phase 1: 선택 노드 stroke 하이라이트

| Plan Spec | Code Location | Match |
|-----------|---------------|-------|
| 선택 노드: stroke #FFD700, width 3, opacity 1 | line 226-233: `isSelected` branch | EXACT |
| 이웃 노드: opacity 1.0, stroke-opacity 0.9 | line 234-241: `isVisible` branch, `effectiveSelectedId ? 0.9 : origStrokeOpacity` | EXACT |
| 비연결 노드: opacity 0.15, stroke-opacity 0.1 | line 242-249: else branch | EXACT |
| 원래 stroke 복원 (해제 시) | line 234-241: `origStroke`, `origStrokeWidth`, `origStrokeOpacity` 사용 | EXACT |

### Phase 2: 연결 엣지 하이라이트

| Plan Spec | Code Location | Match |
|-----------|---------------|-------|
| 연결 엣지: #FFD700, width 2.5, opacity 0.8 | line 290-293: `connectsSelected` branch | EXACT |
| 비연결 엣지: opacity 0.05 | line 294-297: `!connectsSelected` branch | EXACT |
| 원래 색상 복원 (해제 시) | line 270-280: `origColor` 계산, line 298-305: 기본 분기 | EXACT |

### Phase 3: 애니메이션

| Plan Spec | Code Location | Match |
|-----------|---------------|-------|
| duration 300ms | line 180: `duration: number = 300` | EXACT |
| 엣지 stroke 색상도 transition 포함 | line 308-313: `.attr("stroke", targetColor)` in transition chain | EXACT |

### Phase 4: 선택 해제 시 원상 복구

| Plan Spec | Code Location | Match |
|-----------|---------------|-------|
| stroke/width/color 원래 값 복원 | 모든 분기에서 `origStroke`, `origStrokeWidth`, `origStrokeOpacity`, `origColor` 사용 | EXACT |

---

## Architecture Compliance

| Check | Result |
|-------|--------|
| 3-layer 필터링 구조 유지 | PASS — Layer 1 (View Mode), 2 (Node Type), 3 (Selection) 그대로 |
| 기존 이벤트 핸들러 미침범 | PASS — drag, tooltip, background click 코드 변경 없음 |
| 파일 수 1개 | PASS — `research-map-graph.tsx`만 수정 |
| Immutability 원칙 | PASS — 새 변수 할당만 사용, 기존 데이터 미변이 |

---

## Gap Summary

**Gaps found: 0**

모든 Plan 항목이 구현에 정확히 반영되었습니다.
