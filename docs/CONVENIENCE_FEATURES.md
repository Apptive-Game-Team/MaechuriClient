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

useEffect(() => {
  if (entities.player && scenarioData) {
    const playerEntity = entities.player as { position: { x: number; y: number } };
    const playerPos = playerEntity.position;
    
    // Calculate viewport size
    const viewportWidth = 800;
    const viewportHeight = 600;
    
    // Calculate camera offset to center player on screen
    const offsetX = (viewportWidth / 2) - (playerPos.x * TILE_SIZE + TILE_SIZE / 2);
    const offsetY = (viewportHeight / 2) - (playerPos.y * TILE_SIZE + TILE_SIZE / 2);
    
    // Clamp camera to map boundaries
    const mapWidth = scenarioData.map.layers[0].tileMap[0].length * TILE_SIZE;
    const mapHeight = scenarioData.map.layers[0].tileMap.length * TILE_SIZE;
    
    const clampedX = Math.min(0, Math.max(viewportWidth - mapWidth, offsetX));
    const clampedY = Math.min(0, Math.max(viewportHeight - mapHeight, offsetY));
    
    setCameraOffset({ x: clampedX, y: clampedY });
  }
}, [entities.player, scenarioData]);
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
1. **뷰포트 설정**: 800x600 크기의 고정된 뷰포트를 생성
2. **카메라 계산**: 플레이어 위치를 기준으로 카메라 오프셋 계산
   - 플레이어를 화면 중앙에 배치하도록 오프셋 계산
3. **경계 처리**: 카메라가 맵 경계를 벗어나지 않도록 클램핑
   - 맵이 뷰포트보다 작으면 카메라 이동 제한
4. **부드러운 전환**: CSS `transition`을 사용하여 0.2초 동안 부드럽게 이동
5. **실시간 업데이트**: 플레이어 위치가 변경될 때마다 카메라 자동 업데이트

#### 주요 특징
- **중앙 정렬**: 플레이어가 항상 화면 중앙에 위치
- **부드러운 이동**: ease-out 애니메이션으로 자연스러운 카메라 이동
- **경계 제한**: 맵 밖을 보여주지 않도록 카메라 위치 제한
- **고정 뷰포트**: 800x600 크기의 일관된 게임 화면 제공

### 4. API 사용으로 전환

Mock 데이터 대신 실제 API를 사용하여 맵 데이터를 가져옵니다.

#### 구현 위치
- 파일: `src/components/GameScreen/GameScreen.tsx`

#### 변경 사항
```typescript
// Before
const { data: scenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({
  useMockData: true, // Set to false to use API
});

// After
const { data: scenarioData, isLoading: isLoadingMap, error: mapError } = useMapData({
  useMockData: false, // Use API instead of mock data
});
```

#### 동작 방식
- `useMapData` 훅의 `useMockData` 옵션을 `false`로 설정
- 실제 API 엔드포인트에서 맵 데이터 가져오기 시도
- API 호출 실패 시 자동으로 mock 데이터로 fallback
- 에러 발생 시 화면에 경고 메시지 표시

#### 관련 문서
API 연동에 대한 자세한 내용은 [API_INTEGRATION.md](./API_INTEGRATION.md)를 참조하세요.

## 테스트 방법

### 1. 채팅 입력창 자동 포커스 테스트
1. 게임을 시작합니다
2. 상호작용 가능한 객체에 접근하여 E 또는 Space 키를 누릅니다
3. 채팅 모달이 열리면서 자동으로 입력창에 포커스가 설정되는지 확인합니다
4. 추가 클릭 없이 바로 타이핑이 가능한지 확인합니다

### 2. 스크롤 비활성화 테스트
1. 게임을 시작합니다
2. 마우스 휠을 스크롤하거나 화면을 드래그해봅니다
3. 페이지 스크롤이 발생하지 않는지 확인합니다
4. 메인 화면으로 돌아가면 스크롤이 정상 작동하는지 확인합니다

### 3. 카메라 추적 테스트
1. 게임을 시작합니다
2. 방향키 또는 WASD로 플레이어를 이동합니다
3. 플레이어가 항상 화면 중앙에 위치하는지 확인합니다
4. 맵의 가장자리로 이동했을 때 카메라가 맵 경계를 넘지 않는지 확인합니다
5. 카메라 이동이 부드럽게 전환되는지 확인합니다

### 4. API 사용 테스트
1. 백엔드 서버가 실행 중인지 확인합니다
2. `.env` 파일에 올바른 `VITE_API_BASE_URL`이 설정되어 있는지 확인합니다
3. 게임을 시작합니다
4. 맵 데이터가 API에서 정상적으로 로드되는지 확인합니다
5. API 실패 시 mock 데이터로 fallback되고 경고 메시지가 표시되는지 확인합니다

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
