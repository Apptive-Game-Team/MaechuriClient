# 2026-06-13 — 클라이언트 인터페이스 통합 리팩터

- Date: 2026-06-13
- GitHub Issue: #56
- Status: Complete

## Goal

선택한 플랫 사건 인덱스 디자인을 기준으로 주요 화면과 공통 모달을 하나의 시각 체계로 통합한다. 기존 API, ECS, 게임 입력, 기록 드래그 동작은 유지한다.

## Non-goals

- 게임 시스템 또는 API 계약 변경
- 라우터 도입
- 신규 게임 기능 추가
- 기록 보드의 저장 형식 변경

## Context / Constraints

- React 19, TypeScript, Vite 구조를 유지한다.
- 게임 프레임 상태를 React 상태로 이동하지 않는다.
- 외부 런타임 폰트 의존 없이 한국어 시스템 폰트 조합을 사용한다.
- 접근성, 반응형, 모션 감소 설정을 함께 개선한다.

## Approach (Checklist)
- [x] **Step 0: Recon** (현재 화면, 스타일, UI 지침, 선택 시안 확인)
- [x] **Step 1: Implementation** (전역 토큰, 앱 셸, 핵심 화면, HUD, 모달)
- [x] **Step 2: Tests** (변경 범위 ESLint, TypeScript, 별도 출력 빌드, Playwright 시각 QA)
- [x] **Step 3: Rollout / Rollback** (단일 UI 리팩터 단위로 되돌릴 수 있게 유지)

## Validation
- **Commands to run:** `npm run lint`, `npm run build`
- **Expected output:** ESLint 오류 없음, TypeScript/Vite 프로덕션 빌드 성공

## Risks & Rollback
- **Risks:** 800×600 게임 뷰포트의 작은 화면 오버플로, 모달 포커스 회귀, 공통 선택자 충돌
- **Rollback steps:** `refactor/56` 변경 커밋을 revert

## Open Questions
- 없음
