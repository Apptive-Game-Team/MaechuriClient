# 맵 오브젝트 (Map Objects)

맵 오브젝트는 게임 맵에 배치할 수 있는 타일이 아닌 개체입니다. 일반적인 타일 기반 레이어에 속하지 않는 캐릭터, 아이템 및 기타 상호작용적이거나 장식적인 요소에 사용됩니다.

## 맵 오브젝트 정의하기

맵 오브젝트는 `GameMap` 데이터 구조 내의 `objects` 배열에 정의됩니다 (예: `src/data/mockData.ts`).

각 `MapObject`는 `src/types/map.ts`에 정의된 다음 구조를 가집니다.

```typescript
interface MapObject {
  id: number;
  orderInLayer: number;
  name: string;
  type: LayerType[];
  position: Position;
}
```

-   `id`: `assets` 배열의 `id`에 해당하는 숫자입니다. 이는 오브젝트를 시각적 표현과 연결합니다.
-   `orderInLayer`: z-index와 유사한 렌더링 순서입니다. 숫자가 높을수록 위에 렌더링됩니다. 오브젝트는 일반적으로 바닥 및 벽 타일보다 높은 `orderInLayer`를 가져야 합니다.
-   `name`: 오브젝트의 문자열 식별자입니다.
-   `type`: 오브젝트의 동작을 정의하는 `LayerType` 문자열 배열입니다.
-   `position`: 맵 그리드에서 오브젝트의 위치를 나타내는 `x` 및 `y` 좌표를 가진 객체입니다.

### 오브젝트 동작 (`type`)

`type` 배열은 플레이어가 오브젝트와 상호 작용하는 방식을 결정합니다.

-   `"Non-Passable"`: 플레이어는 이 오브젝트가 차지한 타일로 이동할 수 없습니다. `gameUtils.ts`의 `checkCollision` 유틸리티가 이 유형을 확인합니다.
-   `"Interactable"`: 플레이어는 이 오브젝트와 상호 작용할 수 있습니다 (예: 액션 키 누르기). `checkInteraction` 유틸리티가 이 유형을 찾습니다. 상호 작용이 발생하면 `interactionSystem`이 트리거됩니다.
-   `"Non-Interactable"`: 오브젝트와 상호 작용할 수 없습니다.
-   `"Blocks-Vision"`: (현재 타일 레이어에 사용됨) 이 유형은 안개 시스템에서 오브젝트가 플레이어의 시야를 가리도록 하는 데 사용될 수 있습니다.

**예시:**

```typescript
// 시나리오 데이터에서
{
  // ...
  map: {
    // ...
    objects: [
      {
        id: 100,
        orderInLayer: 3,
        name: "요리사 1",
        type: ["Non-Passable", "Interactable"],
        position: { x: 5, y: 5 }
      }
    ],
    assets: [
      {
        id: 100,
        imageUrl: "https://example.com/assets/cook.json"
      }
    ]
  }
}
```

## 게임 시스템 통합

### 엔티티 생성

`useGameEntities` 훅은 `map.objects` 배열에서 게임 엔티티를 생성하는 역할을 합니다. 오브젝트를 반복하고 각각에 대한 엔티티를 생성한 다음 렌더링을 위해 게임 엔진에 전달합니다.

### 충돌 및 상호작용

`playerControlSystem` 및 `interactionSystem`은 `gameUtils.ts`의 유틸리티 함수에 의존합니다.

-   `checkCollision(x, y)`: 이 함수는 이제 타일 레이어와 `objects` 배열을 모두 확인합니다. 대상 좌표의 오브젝트가 "Non-Passable"이면 `true`를 반환하여 이동을 차단합니다.
-   `checkInteraction(x, y)`: 이 함수는 `objects` 배열도 확인합니다. 대상 좌표의 오브젝트가 "Interactable"이면 오브젝트의 `id`를 반환하여 `interactionSystem`이 이벤트를 처리하도록 합니다.

### 렌더링

오브젝트는 `renderers.tsx`의 `Tile` 컴포넌트에 의해 렌더링됩니다. 렌더러는 오브젝트의 `id`로 연결된 에셋을 사용하여 이미지를 표시합니다. 에셋 로드에 실패하면 디버깅 목적으로 대체 색상이 표시됩니다.