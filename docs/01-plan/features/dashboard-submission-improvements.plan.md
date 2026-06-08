# Plan: Dashboard 레이아웃 개편 + 투고 연구 주저자/빠른추가

> Feature: `dashboard-submission-improvements`
> Created: 2026-06-08
> Phase: Plan

## Executive Summary

| 관점 | 내용 |
|------|------|
| Problem | 대시보드 "다가오는 마감일"은 비어 있어 공간 낭비, "투고 중인 연구"는 데이터가 많은데 작은 칸에 갇혀 있음. 주저자가 대시보드에 안 보이고 투고를 추가하려면 매번 상세 화면으로 이동해야 함. |
| Solution | 다가오는 마감일 제거 → 공지/투고/완료 3섹션 재배치(투고는 우측 세로 2칸으로 길게). 투고 카드에 주저자 표시·인라인 편집·새 투고 빠른추가, 새 프로젝트 폼에 주저자 입력칸 추가. |
| Function UX Effect | 한 화면에서 투고 현황(주저자 포함)을 길게 보고, 상세 진입 없이 주저자 수정과 새 투고 등록까지 완료. |
| Core Value | "코드 수정 없이 웹에서 바로 투고 데이터를 관리·측정"하려는 사용자 요구 충족. |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 투고 연구 관리가 대시보드의 핵심인데 레이아웃·접근성이 이를 못 살림 |
| WHO | SDC Lab 연구원·교수 (대시보드 일상 사용자) |
| RISK | `research_projects.first_author`(headline) vs `project_authors`(상세 로스터) 이중 표현 혼동 |
| SUCCESS | 빌드 통과 + 4개 요구(레이아웃/주저자 표시·편집/새폼 입력/빠른추가) 동작 |
| SCOPE | 대시보드 페이지, SubmittedProjectsCard, 새 프로젝트 폼, research 서버 액션 |

## 1. Requirements (확정)

- **R1 (Layout)**: "다가오는 마감일" 섹션 제거. 좌측 컬럼 = 공지사항(상) + 완료된 목표(하), 우측 컬럼 = 투고 중인 연구(2행 span, 더 길게). 캘린더는 그대로.
- **R2 (주저자 표시/편집)**: 투고 카드 각 항목에 주저자 표시 + 카드에서 인라인 편집.
- **R3 (새 폼 입력)**: `/research/new` 생성 폼에 주저자 입력칸 추가.
- **R4 (빠른 추가)**: 투고 카드에서 새 투고(연구 프로젝트)를 바로 추가.

## 2. 기존 코드 활용 (재구축 금지)

- 투고 데이터는 이미 Supabase `research_projects` 기반, `/research/new`·`/research/[id]`에서 웹 관리됨.
- `research_projects.first_author` (text, nullable) 컬럼이 이미 존재 → 마이그레이션 불필요.
- `createProject` / `updateProject` 서버 액션 재사용·확장.

## 3. Success Criteria

- SC1: 대시보드에 "다가오는 마감일"이 사라지고 투고 카드가 우측 세로 전체 높이로 표시된다.
- SC2: 투고 카드 각 항목에 주저자가 보이고, 카드에서 수정하면 DB에 반영된다.
- SC3: 새 프로젝트 폼에서 주저자를 입력해 생성하면 값이 저장된다.
- SC4: 투고 카드의 "새 투고 추가"로 만든 항목이 카드에 즉시 나타난다.
- SC5: `npm run build` (또는 type-check) 통과, 기존 기능 회귀 없음.

## 4. Out of Scope

- `project_authors` 상세 저자 로스터 UI 변경(상세페이지 기능 유지).
- co_author/corresponding_author 컬럼 활용.
