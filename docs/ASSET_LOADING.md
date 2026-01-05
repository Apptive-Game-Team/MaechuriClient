# 에셋 로딩 시스템 (Asset Loading System)

## 개요
이 시스템은 URL로부터 게임 에셋을 로딩하며, 스프라이트의 방향별 이미지를 지원합니다.

## 에셋 포맷

에셋은 방향별 이미지를 정의하는 JSON 파일입니다:

```json
{
  "left": "https://example.com/sprite_left.png",
  "right": "https://example.com/sprite_right.png",
  "front": "https://example.com/sprite_front.png",
  "back": "https://example.com/sprite_back.png"
}
```

### 지원 포맷
- **모든 방향**: 네 방향의 이미지를 모두 제공합니다.
- **정면만**: `front` 이미지만 제공하면 모든 방향에서 사용됩니다.
- **부분 제공**: 일부 방향만 제공하면, 시스템이 지능적으로 대체 이미지를 찾습니다.
- **빈 객체**: 시스템이 색상 타일로 대체합니다.

## 사용법

### 1. 맵 데이터에 오브젝트 정의

```typescript
const scenarioData: ScenarioData = {
  // ...
  map: {
    layers: [...],
    objects: [
      {
        id: 0,
        objectUrl: "https://example.com/assets/tile.json"
      },
      {
        id: 100,
        objectUrl: "https://example.com/assets/object.json"
      }
    ],
    playerObjectUrl: "https://example.com/assets/player.json"
  }
};
```

### 2. 에셋 자동 로드

`useAssetLoader` 훅은 다음을 자동으로 처리합니다:
- 모든 오브젝트 에셋을 가져옵니다.
- 플레이어 에셋을 가져옵니다.
- 로딩 상태를 관리합니다.
- 에러 핸들링을 제공합니다.
- 실패 시 자연스럽게 대체 컨텐츠(Fallback)를 표시합니다.

### 3. 렌더링

렌더러는 다음 로직에 따라 로드된 에셋을 자동으로 사용합니다:

#### 타일의 경우
- `front` 이미지가 있으면 사용합니다.
- 없으면, 사용 가능한 다른 방향 이미지를 사용합니다.
- 이미지가 전혀 없으면 색상 타일로 대체됩니다.

#### 플레이어의 경우
- 게임 내 방향을 에셋 방향에 매핑합니다:
  - `up` → `back` 이미지
  - `down` → `front` 이미지
  - `left` → `left` 이미지
  - `right` → `right` 이미지
- 특정 방향 이미지가 없으면 `front` 이미지로 대체합니다.
- `front` 이미지도 없으면 사용 가능한 다른 이미지로 대체합니다.
- 이미지가 전혀 없으면 색상 원으로 대체됩니다.

## API 참조

### `fetchObjectAsset(objectUrl: string): Promise<DirectionalAsset>`
URL로부터 에셋 정의를 가져옵니다.
- 에셋 구조의 유효성을 검사합니다.
- 유효하지 않거나 fetch에 실패하면 에러를 발생시킵니다.

### `getAssetImage(asset: DirectionalAsset, direction?: string): string | undefined`
특정 방향에 맞는 이미지 URL을 가져옵니다.
- 해당 방향의 이미지가 있으면 반환합니다.
- 없으면 `front` 이미지, 그 다음엔 사용 가능한 다른 이미지 순으로 대체하여 반환합니다.

### `useAssetLoader(objects: MapObject[], playerObjectUrl?: string): AssetsState`
에셋 로딩 및 관리를 위한 React 훅입니다.
- 로딩 상태, 로드된 에셋, 에러 정보를 반환합니다.
- 개별 에셋 로딩 실패를 자연스럽게 처리합니다.

## 에러 핸들링

이 시스템은 안정성을 위해 다음과 같이 설계되었습니다:
1. **네트워크 에러**: 경고를 로그에 남기고, 대체 컨텐츠로 계속 진행합니다.
2. **유효하지 않은 JSON**: 에러를 로그에 남기고, 대체 렌더링을 사용합니다.
3. **이미지 누락**: 우선순위에 따라 다음 사용 가능한 이미지로 대체합니다.
4. **CORS 이슈**: 색상 타일로 대체합니다.

## 예제 에셋 URL

```
https://s3.yunseong.dev/maechuri/objects/tile_floor.json
https://s3.yunseong.dev/maechuri/objects/wood_floor.json
https://s3.yunseong.dev/maechuri/objects/cook_1.json
https://s3.yunseong.dev/maechuri/objects/player.json
```