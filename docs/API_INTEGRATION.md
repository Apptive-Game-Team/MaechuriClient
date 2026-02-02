# API 연동 가이드

## 개요

이 문서는 매추리 클라이언트에서 맵 로딩 및 상호작용 기능을 위한 API 연동이 어떻게 작동하는지 설명합니다.

## 설정

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성합니다 (`.env.example` 기반):

```env
VITE_API_BASE_URL=http://localhost:8080
```

설정하지 않으면 기본값은 `http://localhost:8080`입니다.

## API 엔드포인트

### 맵 로딩

#### 오늘의 맵 가져오기
- **엔드포인트**: `GET /api/scenarios/today/data/map`
- **설명**: 오늘 날짜의 활성 시나리오를 가져옵니다
- **응답**: 아래 ScenarioData 타입 참조

#### 특정 시나리오 맵 가져오기
- **엔드포인트**: `GET /api/scenarios/{scenarioId}/data/map`
- **설명**: ID로 특정 시나리오를 가져옵니다
- **응답**: 아래 ScenarioData 타입 참조

**응답 형식 (ScenarioData)**:
```typescript
{
  "createdDate": "2025-12-22",
  "scenarioId": 1,
  "scenarioName": "요리사 3인방의 사건 현장",
  "map": {
    "layers": [...],
    "objects": [...],
    "assets": [...]
  }
}
```

### 상호작용

#### 오브젝트와 상호작용
- **엔드포인트**: `POST /api/scenarios/{scenarioId}/interact/{objectId}`
- **설명**: 오브젝트와의 상호작용을 시작하거나 계속합니다

**요청 본문 (선택사항)**:
```typescript
{
  "message": "너 말해봐",      // 선택사항: 플레이어의 메시지 (양방향 상호작용용)
  "history": "jwt_token_here"  // 선택사항: JWT로 인코딩된 대화 기록
}
```

**최초 요청**: 첫 번째 상호작용의 경우, 빈 본문 `{}`을 보내거나 본문 없이 요청하여 상호작용 타입을 확인합니다.

**응답 - 양방향 상호작용**:
```typescript
{
  "type": "two-way",
  "message": "안녕 너가 말해봐",
  "history": "updated_jwt_token_here"
}
```

**응답 - 단방향 상호작용**:
```typescript
{
  "type": "simple",
  "message": "안녕 난 요리사 이선민이야",
  "name": "이선민"  // 선택사항
}
```

## 사용법

### 맵 데이터 사용하기

`useMapData` 훅이 API에서 맵 데이터를 가져오는 것을 처리합니다:

```typescript
import { useMapData } from '../../hooks/useMapData';

function MyComponent() {
  // 오늘의 맵 가져오기
  const { data, isLoading, error } = useMapData();
  
  // 또는 특정 시나리오 가져오기
  const { data, isLoading, error } = useMapData({ scenarioId: 1 });
}
```

**기능**:
- 로딩 및 에러 상태 제공
- 오늘의 맵 및 특정 시나리오 가져오기 모두 지원


### 상호작용 관리

`useInteraction` 훅이 모든 상호작용 로직을 처리합니다:

```typescript
import { useInteraction } from '../../hooks/useInteraction';

function MyComponent() {
  const {
    startInteraction,
    sendMessage,
    getInteractionState,
    isLoading,
    error
  } = useInteraction();
  
  // 오브젝트와 상호작용 시작
  await startInteraction(scenarioId, objectId);
  
  // 메시지 전송 (양방향 상호작용용)
  await sendMessage(scenarioId, objectId, "Hello!");
  
  // 오브젝트의 상호작용 상태 가져오기
  const state = getInteractionState(objectId);
  // state 내용: { type, messages, jwtHistory }
}
```

**기능**:
- 오브젝트별 상호작용 기록
- 자동 JWT 기록 관리
- UI 표시를 위한 평문 메시지 기록
- 단방향 및 양방향 상호작용 구분

### 상호작용 UI

`ChatModal` 컴포넌트가 상호작용 인터페이스를 제공합니다:

```typescript
import ChatModal from '../ChatModal/ChatModal';

<ChatModal
  isOpen={chatModalOpen}
  objectName="요리사 1"
  messages={messages}  // ChatMessage 배열
  interactionType="two-way"  // 또는 "simple"
  onClose={() => setChatModalOpen(false)}
  onSendMessage={(message) => handleSendMessage(message)}
/>
```

**기능**:
- 메신저 스타일 UI를 가진 모달 다이얼로그
- 플레이어 메시지는 오른쪽 정렬 (파란색 말풍선)
- NPC 메시지는 왼쪽 정렬 (회색 말풍선)
- 메시지 위에 선택적으로 NPC 이름 표시
- 단방향(읽기 전용) 상호작용의 경우 입력 비활성화
- 최신 메시지로 자동 스크롤

## 데이터 흐름

### 맵 로딩 흐름

1. `GameScreen` 컴포넌트 마운트
2. `useMapData` 훅이 API에서 맵을 가져옴
3. 성공 시: 맵 데이터로 게임 렌더링
4. 실패 시: 에러 화면을 표시
5. `setCurrentMapData()`를 통해 게임 유틸리티에 맵 데이터 설정

### 상호작용 흐름

1. 플레이어가 오브젝트를 향한 상태에서 상호작용 키(E 또는 Space)를 누름
2. `interactionSystem`이 상호작용을 감지하고 `gameInteraction` 이벤트 발생
3. `GameScreen`이 이벤트를 처리하고 `ChatModal`을 엶
4. 첫 상호작용인 경우: `startInteraction()`을 호출하여 초기 메시지와 타입을 가져옴
5. 양방향 상호작용의 경우: 플레이어가 입력을 통해 메시지를 보낼 수 있음
6. 각 메시지는 JWT 기록(API용)과 평문 메시지(UI용) 모두를 업데이트
7. 기록은 오브젝트별로 저장되므로, 오브젝트를 전환해도 각각의 대화가 유지됨

## 기록 관리

### JWT 기록 (API)
- `ObjectInteractionState.jwtHistory`에 오브젝트별로 저장
- 각 API 요청 시 `InteractionRequest.history`로 전송
- `TwoWayInteractionResponse.history`로 각 API 응답마다 업데이트
- 백엔드에서 대화 컨텍스트를 유지하는 데 사용

### 평문 기록 (UI)
- `ObjectInteractionState.messages`에 오브젝트별로 저장
- content, sender, name, timestamp가 있는 `ChatMessage` 객체의 배열
- `ChatModal` 컴포넌트에 표시
- 플레이어 메시지와 NPC 응답 모두 저장
- NPC 메시지의 경우 이름이 있으면 표시

## 타입

### 주요 타입 정의

```typescript
// 상호작용 타입
type InteractionType = 'simple' | 'two-way';

interface ChatMessage {
  content: string;
  sender: 'player' | 'npc';
  name?: string;
  timestamp: number;
}

interface ObjectInteractionState {
  objectId: number;
  type?: InteractionType;
  jwtHistory?: string;
  messages: ChatMessage[];
}

// 맵 타입 (전체 정의는 src/types/map.ts 참조)
interface ScenarioData {
  createdDate: string;
  scenarioId: number;
  scenarioName: string;
  map: GameMap;
}
```


