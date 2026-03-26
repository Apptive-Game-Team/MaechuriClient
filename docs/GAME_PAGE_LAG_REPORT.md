# 게임 페이지 렉 원인 분석 보고서

## 1. 배경
게임 화면에서 이동/상호작용 시 체감 렉이 발생한다는 제보가 있었고, 코드 레벨에서 원인을 분석했다. 주요 증상은 **플레이어 이동 중 프레임 드랍**과 **GameEngine 콜백/렌더링 비용 증가**로 요약된다.

## 2. 주요 원인 (코드 기준)

### 2.1 `handleGameEvent` 콜백이 렌더마다 재생성됨
- **위치**: `src/components/GameScreen/GameScreen.tsx`
- **문제점**:
  - `GameScreen`은 `playerPosition`, `chatModalOpen` 등 상태 변화가 잦음
  - 그 때마다 `handleGameEvent`가 새로 생성되어 `GameEngine`의 `onEvent` prop이 변경됨
  - 고주파 이벤트(플레이어 이동/보간) 상황에서 **불필요한 내부 업데이트/리렌더**가 연쇄적으로 발생 가능

### 2.2 이동 보간 이벤트에서 맵 크기를 매번 계산
- **위치**: `handleGameEvent` 내부 (`interpolated-position-changed` 케이스)
- **문제점**:
  - `mapWidth`, `mapHeight`를 계산하기 위해 `flatMap` + `map`을 반복 실행
  - 이 연산은 **타일 레이어 전체를 순회**하므로 비용이 큼
  - 해당 이벤트는 이동 중에 매우 자주 발생하므로 **O(N) 연산이 프레임마다 반복**됨

### 2.3 상호작용 훅의 콜백 재생성(부수적 비용)
- **위치**: `src/hooks/useInteraction.ts`
- **문제점**:
  - `records`, `interactions` 상태가 바뀔 때마다 `fetchNewRecords`, `sendMessage`, `startInteraction`이 재생성됨
  - 게임 화면에서 상호작용/채팅 히스토리 갱신이 발생할 경우, **불필요한 re-render chain**이 늘어남
  - 렉의 직접 원인은 아니지만, **보조 비용**으로 작용할 가능성이 있음

## 3. 개선 방향 요약 (적용된 대응)

### 3.1 `handleGameEvent` 안정화
- `useCallback([])`으로 **콜백을 1회 생성**하고
- `mapDimensionsRef`를 통해 최신 맵 크기를 참조하도록 변경

### 3.2 맵 크기 계산을 `useMemo`로 이동
- `mapWidth`, `mapHeight`를 렌더 시 한 번만 계산
- **고주파 이벤트에서 반복 계산 제거**

### 3.3 훅 콜백 재생성 제거
- `recordsRef`, `interactionsRef`를 사용하여
  `fetchNewRecords` / `sendMessage`가 상태 변경마다 새로 생성되지 않도록 개선

## 4. 기대 효과
- **프레임당 반복 연산 감소** → 이동 중 렉 감소
- **GameEngine 이벤트 핸들러 변경 빈도 감소** → 내부 렌더/구독 비용 감소
- **상호작용 상태 업데이트 시 부수 비용 감소**

## 5. 결론
게임 페이지 렉은 단일 원인이 아니라,
1) 고주파 이벤트 내부에서의 비용 큰 계산 반복,
2) 이벤트 핸들러 재생성에 따른 GameEngine 업데이트 비용,
3) 상호작용 상태 업데이트에 따른 부수 re-render
등이 복합적으로 누적된 결과로 판단된다.

이번 리팩토링은 이 중 **핵심 성능 비용(1, 2번)**을 직접 제거하는 방향으로 수정되었으며,
실제 체감 렉은 크게 완화될 것으로 예상된다.
