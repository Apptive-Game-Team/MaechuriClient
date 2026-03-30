# 플레이어 이동 시스템 분석 보고서 (Movement Analysis Report)

이 보고서는 플레이어의 두 가지 이동 방식(키보드 및 마우스 클릭) 간의 속도 차이와 로직 불균형을 분석한 결과입니다.

## 1. 이동 방식별 로직 비교

### A. 키보드 이동 (Keyboard Movement)
키보드 이동은 `usePlayerControls` 훅에서 입력을 감지하고, `playerControlSystem`에서 매 프레임 좌표를 직접 업데이트합니다.

```typescript
// playerControlSystem.ts - Keyboard Logic
const step = player.speed * dt;
const nextX = player.position.x + moveVector.x * step;
const nextY = player.position.y + moveVector.y * step;

// 좌표별 충돌 검사 (벽에 비비는 동작 가능)
if (!checkCollision(nextX, player.position.y)) player.position.x = nextX;
if (!checkCollision(player.position.x, nextY)) player.position.y = nextY;
```
*   **특징**: 매 프레임 `checkCollision`을 최소 2회 수행합니다.
*   **속도 제약**: 벽이나 오브젝트 타일 경계에 미세하게 걸리면 한쪽 축의 이동이 차단되어 체감 속도가 급격히 느려집니다. (마찰 저항 발생)

### B. 마우스 클릭 이동 (Mouse/A* Navigation)
마우스 이동은 클릭 시 경로를 생성하고, `while` 루프를 통해 에너지를 소모하며 이동합니다.

```typescript
// playerControlSystem.ts - Mouse Path Following
while (remainingStep > 0 && player.pathQueue && player.pathQueue.length > 0) {
  const next = player.pathQueue[0];
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= remainingStep) {
    player.position = { ...next }; 
    remainingStep -= dist; // 남은 에너지를 다음 타일 이동으로 '이월'
    player.pathQueue.shift();
  } else {
    player.position.x += (dx / dist) * remainingStep;
    remainingStep = 0;
  }
}
```
*   **특징**: 경로 생성 시점에만 충돌을 검사하며, 이동 중에는 `checkCollision`을 호출하지 않습니다.
*   **속도 유지**: 물리적 저항 없이 수학적 직선 경로만 따라가므로 이론상 최대 속도를 100% 유지합니다.

## 2. 델타 타임(Delta Time) 반영 방식의 차이점

두 방식 모두 `dt`를 사용하지만, 이를 소비하는 방식에서 결정적인 성능 차이가 납니다.

### A. 키보드: 에너지 손실 방식 (Lossy)
키보드는 매 프레임 단 한 번의 이동 기회만 가집니다. 만약 `dt`가 커져서 한 걸음이 커졌는데 그 끝에 벽이 있다면, 해당 프레임의 이동 에너지는 모두 **손실(Loss)**됩니다.

### B. 마우스: 에너지 완전 소모 방식 (Perfect Consumption)
마우스는 `while` 루프를 통해 `dt`가 허용하는 모든 거리를 **남김없이 소모**합니다. 타일 하나를 지나고도 `dt` 에너지가 남았다면, 즉시 다음 타일로 이동을 시작합니다. 이로 인해 프레임 드랍이 발생해도 이동 거리에는 손해가 전혀 없습니다.

## 3. 충돌 로직 및 속도 차이 원인 요약

| 항목 | 키보드 조작 | 마우스 조작 (A*) |
| :--- | :--- | :--- |
| **이동 경로** | 조작 오차 발생 (오프로드) | 최단 타일 경로 (고속도로) |
| **충돌 저항** | **실시간 마찰 (속도 감쇄 핵심)** | **사전 검증 (무저항 이동)** |
| **dt 소모** | 단일 검사 (에너지 손실 발생) | **루프 소모 (에너지 100% 활용)** |
| **연속성** | 외부 입력(UI) 의존적 | 엔진 내부 상태(State) 기반 |

결론적으로, 마우스 이동은 **물리적 저항이 거세된 고속도로**를 달리는 것과 같고, 키보드 이동은 **실시간으로 마찰과 싸우는 오프로드**와 같습니다. 벽이 없는 곳에서도 마우스가 빠른 이유는 `dt` 에너지를 이월하여 100% 소모하기 때문입니다.

## 4. 향후 개선 방안 (제안)

1.  **마우스 이동 시 루프 제한**: 한 프레임에 소모할 수 있는 `remainingStep`에 상한선을 두어 순간이동 억제.
2.  **키보드 이동의 상태화**: 키보드도 한 번 누르면 '이동 상태'를 활성화하여 엔진 틱마다 일정하게 에너지를 소모하도록 변경.
3.  **마우스 물리 저항 시뮬레이션**: 경로 추적 중에도 주변 타일과의 거리를 계산하여 의도적인 감속 프레임 삽입.

---
보고서 작성일: 2026-03-30
작성자: Gemini CLI 분석 시스템
