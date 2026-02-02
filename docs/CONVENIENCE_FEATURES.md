# 편의 기능 업데이트

## 개요

이 문서는 사용자 경험 향상을 위해 추가된 편의 기능들을 설명합니다.

## 구현된 기능

### 1. 채팅 입력창 자동 포커스

상호작용 모달이 열릴 때 자동으로 채팅 입력창에 포커스가 설정됩니다.

#### 구현 위치
- 파일: `src/components/ChatModal/ChatModal.tsx`

#### 구현 방법
```typescript
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (isOpen) {
    setInputMessage('');
    // Auto-focus on input field when modal opens
    if (inputRef.current && interactionType === 'two-way') {
      inputRef.current.focus();
    }
  }
}, [isOpen, interactionType]);
```

#### 동작 방식
- 모달이 열릴 때 (`isOpen === true`)
- 양방향 상호작용인 경우 (`interactionType === 'two-way'`)
- input 요소에 `ref`를 통해 접근하여 `focus()` 메서드 호출
- 사용자가 즉시 메시지를 입력할 수 있도록 개선

### 2. 게임 페이지 스크롤 비활성화

게임 화면에서 웹페이지 스크롤이 비활성화되어 게임 조작 중 의도하지 않은 스크롤을 방지합니다.

#### 구현 위치
- 파일: `src/components/GameScreen/GameScreen.tsx`

#### 구현 방법
```typescript
useEffect(() => {
  // Save original overflow style
  const originalOverflow = document.body.style.overflow;
  
  // Disable scrolling
  document.body.style.overflow = 'hidden';
  
  // Restore original overflow when component unmounts
  return () => {
    document.body.style.overflow = originalOverflow;
  };
}, []);
```

#### 동작 방식
- GameScreen 컴포넌트가 마운트될 때 `body`의 `overflow`를 `hidden`으로 설정
- 컴포넌트가 언마운트될 때 원래 overflow 스타일로 복원
- 다른 페이지로 이동 시 정상적으로 스크롤 기능 복구

### 3. 카메라가 플레이어를 따라가는 기능

플레이어가 움직일 때 카메라가 플레이어를 중심으로 따라가며, 게임 월드를 더 넓게 탐험할 수 있습니다.

#### 구현 위치
- 파일: `src/components/GameScreen/GameScreen.tsx`
- 파일: `src/components/GameScreen/GameScreen.css`

#### 구현 방법

**GameScreen.tsx**:
```typescript
const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
const [playerPosition, setPlayerPosition] = useState<Position>(initialPlayerPosition);

useEffect(() => {
  if (!playerPosition) {
    return;
  }

  const playerPos = playerPosition;

  // Calculate camera offset to center player on screen
  const offsetX = (VIEWPORT_WIDTH / 2) - (playerPos.x * TILE_SIZE + TILE_SIZE / 2);
  const offsetY = (VIEWPORT_HEIGHT / 2) - (playerPos.y * TILE_SIZE + TILE_SIZE / 2);

  // Clamp camera to map boundaries when valid layer data is available
  const layers = scenarioData?.map.layers;
  if (
    layers &&
    layers.length > 0 &&
    layers[0].tileMap.length > 0 &&
    layers[0].tileMap[0].length > 0
  ) {
    const mapWidth = layers[0].tileMap[0].length * TILE_SIZE;
    const mapHeight = layers[0].tileMap.length * TILE_SIZE;

    const clampedX = Math.min(0, Math.max(VIEWPORT_WIDTH - mapWidth, offsetX));
    const clampedY = Math.min(0, Math.max(VIEWPORT_HEIGHT - mapHeight, offsetY));

    setCameraOffset({ x: clampedX, y: clampedY });
  } else {
    // Fallback: no valid map data yet; still center camera on the player
    setCameraOffset({ x: offsetX, y: offsetY });
  }
}, [playerPosition, scenarioData]);
```

**렌더링 구조**:
```tsx
<div className="game-viewport" style={{ width: 800, height: 600, overflow: 'hidden' }}>
  <div 
    className="game-container" 
    style={{ 
      width: mapWidth, 
      height: mapHeight,
      transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
      transition: 'transform 0.2s ease-out'
    }}
  >
    <GameEngine ... />
  </div>
</div>
```

#### 동작 방식
1. **플레이어 위치 추적**: 게임 엔진에서 `player-moved` 이벤트를 통해 플레이어 위치 업데이트
2. **뷰포트 설정**: 800x600 크기의 고정된 뷰포트를 생성
3. **카메라 계산**: 플레이어 위치를 기준으로 카메라 오프셋 계산
   - 플레이어를 화면 중앙에 배치하도록 오프셋 계산
4. **경계 처리**: 카메라가 맵 경계를 벗어나지 않도록 클램핑
   - 맵 데이터가 유효한 경우 경계 내로 제한
   - 맵 데이터가 없거나 유효하지 않은 경우 플레이어 중심으로 표시 (fallback)
5. **부드러운 전환**: CSS `transition`을 사용하여 0.2초 동안 부드럽게 이동
6. **실시간 업데이트**: 플레이어 위치가 변경될 때마다 카메라 자동 업데이트

#### 주요 특징
- **중앙 정렬**: 플레이어가 항상 화면 중앙에 위치
- **부드러운 이동**: ease-out 애니메이션으로 자연스러운 카메라 이동
- **경계 제한**: 맵 밖을 보여주지 않도록 카메라 위치 제한 (맵 데이터 유효시)
- **고정 뷰포트**: 800x600 크기의 일관된 게임 화면 제공
- **안전한 처리**: 맵 데이터가 유효하지 않은 경우에도 정상 작동 (fallback 지원)
- **이벤트 기반**: 플레이어 이동 이벤트를 통한 반응형 카메라 업데이트



## 향후 개선 사항

### 카메라 시스템
- [ ] 반응형 뷰포트 크기 (화면 크기에 따라 자동 조절)
- [ ] 카메라 줌 기능
- [ ] 카메라 이동 속도 커스터마이징
- [ ] 미니맵 추가

### 상호작용
- [ ] 채팅 히스토리 스크롤 위치 기억
- [ ] 키보드 단축키로 모달 닫기 (ESC)

### 성능
- [ ] 카메라 업데이트 최적화 (throttle/debounce)
- [ ] 뷰포트 밖 엔티티 렌더링 스킵
