# Plan: Research Map Node Highlight

> Feature: `research-map-highlight`
> Created: 2026-03-30
> Status: Draft

---

## 1. Overview

Research Map 페이지의 D3.js 네트워크 그래프에서 노드/레이블 클릭 시 연결된 노드와 엣지가 시각적으로 두드러지게 하이라이트되는 기능을 개선한다.

### 1.1 Problem Statement

| 현상 | 원인 |
|------|------|
| 노드 클릭 시 우측 패널만 업데이트, 그래프 자체에는 시각 변화 없음 | `applyVisualState`에서 selected 노드의 하이라이트가 미약함 (opacity만 조절, stroke 변화 없음) |
| 모든 엣지가 동일한 낮은 opacity로 렌더링되어 연결 관계 파악 어려움 | 선택 시 엣지 강조가 `origOp * 3` (최대 0.35) 수준으로 불충분 |
| 클릭 노드 자체의 시각적 구분이 없음 | `rm-sel` 클래스가 추가되지만 CSS에서 활용 안됨, stroke 변경 로직 없음 |

### 1.2 Goal

- 클릭한 노드: 밝은 골드(#FFD700) stroke, 두꺼운 테두리로 명확히 구분
- 이웃 노드: opacity 1.0 유지, 약간 밝게
- 비연결 노드: opacity 0.15로 강하게 dimming
- 연결 엣지: 흰색/골드 색상, stroke-width 2.5~3으로 두껍게
- 비연결 엣지: opacity 0.05~0.1로 거의 안 보이게
- 모든 전환에 D3 transition 200~300ms 애니메이션

---

## 2. Scope

### 2.1 In Scope

| # | 항목 | 설명 |
|---|------|------|
| 1 | 노드 클릭 하이라이트 | 선택/이웃/비연결 노드의 시각적 구분 강화 |
| 2 | 엣지 하이라이트 | 연결/비연결 엣지의 색상 및 두께 차별화 |
| 3 | 선택 해제 | 배경 클릭, 동일 노드 재클릭으로 해제 (기존 동작 유지) |
| 4 | 전환 애니메이션 | D3 transition 200~300ms |
| 5 | View Mode 변경 시 초기화 | 기존 `handleViewModeChange`에서 이미 `setSelectedNode(null)` 호출 |

### 2.2 Out of Scope

- 새로운 UI 컴포넌트 추가
- 데이터 구조 변경
- 성능 최적화 (노드 수가 적어 불필요)

---

## 3. Technical Analysis

### 3.1 Current Architecture

```
research-map-graph.tsx (단일 파일, ~800 lines)
├── applyVisualState()      ← 핵심 수정 대상
│   ├── Layer 1: View Mode filter
│   ├── Layer 2: Node Type filter
│   └── Layer 3: Selection highlight  ← 여기를 강화
├── D3 initialization useEffect
│   ├── nodeEls (g.rm-node) - drag end에서 클릭 처리
│   ├── linkEls (line.rm-link)
│   └── background rect - 클릭 시 선택 해제
└── Visual state useEffect
    └── applyVisualState() 호출
```

### 3.2 Key Findings

1. **클릭 핸들러 존재**: drag end에서 `dragMoved` 플래그로 클릭 감지 → `setSelectedNode` 토글 (line 443-453)
2. **`applyVisualState` 이미 selectedNodeId 파라미터 지원**: Layer 3에서 1-hop 이웃 계산 (line 197-208)
3. **현재 하이라이트가 미약한 이유**:
   - 노드: circle opacity만 변경 (1 vs 0.08), **stroke 변경 없음**
   - 엣지: `origOp * 3` (max 0.35), width +0.5 → **여전히 흐릿함**
   - `rm-sel` 클래스 부여만 하고 시각적 변화 없음

### 3.3 Modification Strategy

**`applyVisualState()` 함수만 수정** — 기존 구조(3-layer 필터링)를 그대로 유지하면서 Layer 3의 시각 강도를 대폭 강화한다.

---

## 4. Implementation Plan

### Phase 1: 선택 노드 stroke 하이라이트 (applyVisualState 노드 부분)

**파일**: `src/components/features/research-map/research-map-graph.tsx`
**위치**: `applyVisualState()` → 노드 적용 부분 (line 214-226)

변경 내용:
```
- 선택 노드(d.id === effectiveSelectedId):
  - circle stroke → #FFD700, stroke-width → 3, stroke-opacity → 1
  - opacity → 1.0
- 이웃 노드(finalNodeVisible에 포함 & 비선택):
  - opacity → 1.0, stroke-opacity → 0.9
- 비연결 노드:
  - opacity → 0.15, stroke-opacity → 0.1
```

### Phase 2: 연결 엣지 하이라이트 (applyVisualState 엣지 부분)

**위치**: `applyVisualState()` → 엣지 적용 부분 (line 229-262)

변경 내용:
```
- 선택 노드에 연결된 엣지(connectsSelected && bothVisible):
  - stroke → #FFD700
  - stroke-width → 2.5
  - stroke-opacity → 0.8
- 비연결 엣지(hasDimming 상태):
  - stroke-opacity → 0.05
  - stroke-width → 원래 값 유지
```

### Phase 3: 애니메이션 duration 조정

- 기본 duration 파라미터: 300ms (현재값 유지)
- 엣지 stroke 색상 변경도 transition에 포함

### Phase 4: 선택 해제 시 원상 복구

- 이미 `effectiveSelectedId === null`일 때 원래 값으로 복원하는 로직 존재
- stroke, stroke-width, stroke-color도 원래 값으로 복원하는 코드 추가 필요

---

## 5. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| 기존 View Mode 필터와 충돌 | Medium | 3-layer 구조를 유지하므로 자연스럽게 공존 |
| Drag 동작과 클릭 이벤트 충돌 | Low | 기존 `dragMoved` 플래그로 이미 분리됨 |
| Tooltip과 충돌 | Low | mouseover/mouseout는 별도 핸들러, 영향 없음 |
| 성능 이슈 (transition 중복) | Low | 노드 수 ~50개 이하, 문제 없음 |

---

## 6. Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/features/research-map/research-map-graph.tsx` | Modify | `applyVisualState()` 함수의 노드/엣지 시각 로직 강화 |

**변경 파일 수: 1개** — HARD-GATE 규칙(3+ 파일 시 Plan 필수) 미해당이지만, PDCA 워크플로우에 따라 Plan 작성.

---

## 7. Success Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | 노드 클릭 시 골드 stroke 표시 | 시각 확인 |
| 2 | 비연결 노드 opacity 0.15 | 시각 확인 |
| 3 | 연결 엣지 #FFD700, width 2.5 | 시각 확인 |
| 4 | 비연결 엣지 opacity 0.05 | 시각 확인 |
| 5 | 배경 클릭으로 해제 | 기능 확인 |
| 6 | 동일 노드 재클릭으로 해제 | 기능 확인 |
| 7 | 전환 애니메이션 ~300ms | 시각 확인 |
| 8 | View Mode 변경 시 초기화 | 기능 확인 |
| 9 | Drag/Tooltip 동작 정상 | 기능 확인 |
| 10 | 빌드 성공 | `npm run build` 0 errors |
