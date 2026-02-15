# 코드베이스 분석: 기록 시각화 모달 구현을 위한 가이드

## 📋 프로젝트 개요

### 1. 기술 스택
- **프레임워크**: React 19.2.0 + TypeScript
- **빌드 도구**: Vite 7.2.4
- **게임 엔진**: react-game-engine v1.2.0 (2D 게임 렌더링)
- **HTTP 클라이언트**: Native Fetch API (axios 미사용)
- **상태 관리**: React Context API (Redux/Zustand 미사용)
- **배포**: GitHub Pages (`/MaechuriClient/` base path)

### 2. 프로젝트 구조
```
src/
├── components/
│   ├── ChatModal/          # 채팅 모달 (참고용)
│   ├── SolveModal/         # 해결 모달 (참고용)
│   ├── GameScreen/         # 메인 게임 화면
│   └── common/
│       └── Modal/          # 재사용 가능한 모달 컴포넌트
├── contexts/
│   └── RecordsContext.tsx  # 기록 상태 관리
├── types/
│   └── record.ts           # 기록 타입 정의
├── services/
│   └── api.ts              # API 호출 함수
├── config/
│   └── api.ts              # API 엔드포인트 설정
└── data/
    └── recordsData.ts      # 목 데이터
```

---

## 🎯 핵심 구현 요소 분석

### 3. 모달 시스템

#### 3.1 기본 모달 컴포넌트
**파일**: `/src/components/common/Modal/Modal.tsx`

**Props 인터페이스**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;  // 기본값: '600px'
}
```

**주요 특징**:
- 오버레이 클릭 시 모달 닫기
- ESC 키 지원 없음 (추가 필요할 수 있음)
- z-index: 10000 (최상위 레이어)
- max-height: 85vh (스크롤 가능)
- 중앙 정렬 (flexbox)

**스타일**: `/src/components/common/Modal/Modal.css`
```css
.modal-overlay {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
}

.modal {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-height: 85vh;
}
```

#### 3.2 모달 사용 예시 (ChatModal)
**파일**: `/src/components/ChatModal/ChatModal.tsx`

```typescript
// GameScreen.tsx에서 사용
const [chatModalOpen, setChatModalOpen] = useState(false);

<ChatModal
  isOpen={chatModalOpen}
  onClose={() => setChatModalOpen(false)}
  // ... other props
/>
```

---

### 4. 키보드 이벤트 핸들링

#### 4.1 현재 구현
**파일**: `/src/components/GameScreen/hooks/usePlayerControls.ts`

```typescript
export const usePlayerControls = (gameEngineRef: React.RefObject<GameEngine | null>) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameEngineRef.current) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        eventType = 'move-up';
        break;
      case ' ':
      case 'e':
      case 'E':
        eventType = 'interact';
        break;
      // ...
    }
  }, [gameEngineRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
```

#### 4.2 'r' 키 모달 열기 구현 방법

**옵션 1: GameScreen에 직접 추가**
```typescript
// GameScreen.tsx
const [recordsModalOpen, setRecordsModalOpen] = useState(false);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 모달이 열려있거나 입력 필드 포커스 시 무시
    if (chatModalOpen || solveModalOpen) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    if (e.key === 'r' || e.key === 'R') {
      setRecordsModalOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [chatModalOpen, solveModalOpen]);
```

**옵션 2: 별도 커스텀 훅 생성**
```typescript
// hooks/useRecordsModalControl.ts
export const useRecordsModalControl = (
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  disabled: boolean = false
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'r' || e.key === 'R') {
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen, disabled]);
};
```

---

### 5. 기록(Record) 데이터 구조

#### 5.1 타입 정의
**파일**: `/src/types/record.ts`

```typescript
export type RecordType = 'CLUE' | 'NPC';

export interface Record {
  id: number | string;  // 유연성을 위해 둘 다 지원
  type: RecordType;
  name: string;
}

export interface RecordsData {
  records: Record[];
}
```

#### 5.2 RecordsContext
**파일**: `/src/contexts/RecordsContext.tsx`

```typescript
interface RecordsContextType {
  records: Record[];
  addRecords: (newRecords: Array<{ id: string; type: string; name: string }>) => void;
}

export const useRecords = (): RecordsContextType => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
```

**현재 기능**:
- ✅ 기록 저장 (중복 방지)
- ✅ 기록 추가
- ❌ 개별 기록 업데이트 (위치, 메모 등)
- ❌ 로컬스토리지 영속화

#### 5.3 목 데이터
**파일**: `/src/data/recordsData.ts`

```typescript
export const mockRecordsData: RecordsData = {
  records: [
    { id: "10", type: "CLUE", name: "눈물 젖은 빵" },
    { id: "11", type: "NPC", name: "홍길동" },
    { id: "12", type: "CLUE", name: "피 묻은 칼" },
    { id: "13", type: "NPC", name: "김철수" }
  ]
};
```

---

### 6. API 구조

#### 6.1 API 설정
**파일**: `/src/config/api.ts`

```typescript
const isDev = import.meta.env.DEV;
export const API_BASE_URL = isDev 
  ? 'http://localhost:8080' 
  : 'https://yh.yunseong.dev';

export const API_ENDPOINTS = {
  getTodayMap: () => `${API_BASE_URL}/api/scenarios/today/data/map`,
  getScenarioMap: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/data/map`,
  interact: (scenarioId: number, objectId: string) => `${API_BASE_URL}/api/scenarios/${scenarioId}/interact/${objectId}`,
  solve: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/solve`,
};
```

#### 6.2 API 호출 래퍼
**파일**: `/src/utils/apiFetch.ts`

```typescript
// 자동으로 fingerprint ID 헤더 추가
// credentials: 'include' 포함
```

#### 6.3 서비스 함수
**파일**: `/src/services/api.ts`

```typescript
export async function getTodayMap(): Promise<ScenarioData>
export async function getScenarioMap(scenarioId: number): Promise<ScenarioData>
export async function sendInteraction(scenarioId: number, objectId: string, request: InteractionRequest): Promise<InteractionResponse>
export async function submitSolve(scenarioId: number, request: SolveRequest): Promise<SolveResponse>
```

#### 6.4 기록 API 엔드포인트 (추가 필요)

**추정되는 엔드포인트**:
```typescript
// 추가 필요한 엔드포인트
export const API_ENDPOINTS = {
  // 기존...
  getRecords: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/records`,
  getClues: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/clues`,
  getSuspects: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/suspects`,
  getFacts: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/facts`,
};
```

**API 응답 예시** (추정):
```typescript
// GET /api/scenarios/{scenarioId}/records
{
  "clues": [
    { "id": 1, "name": "피 묻은 칼", "description": "...", "imageUrl": "..." }
  ],
  "suspects": [
    { "id": 2, "name": "홍길동", "description": "...", "imageUrl": "..." }
  ],
  "facts": [
    { "id": 3, "name": "살인 시간", "description": "...", "imageUrl": "..." }
  ]
}
```

---

### 7. 이미지 로딩

#### 7.1 현재 구현
**파일**: `/src/utils/assetLoader.ts`

```typescript
// JSON 에셋 페치
export async function fetchObjectAsset(objectUrl: string): Promise<DirectionalAsset>

// 방향별 이미지 URL 가져오기
export function getAssetImage(asset: DirectionalAsset, direction?: Direction): string

// 이미지 프리로드
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}
```

**DirectionalAsset 타입**:
```typescript
{
  "left": "url",
  "right": "url", 
  "front": "url",
  "back": "url"
}
```

#### 7.2 렌더링
**파일**: `/src/components/GameScreen/components/renderers.tsx`

```typescript
// 타일에 배경 이미지 설정
style={{
  backgroundImage: `url(${imageUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}}
```

---

### 8. 드래그 앤 드롭

#### 8.1 현재 상태
**⚠️ 현재 구현되지 않음**

- 프로젝트에 드래그 앤 드롭 라이브러리 없음
- `react-beautiful-dnd`, `dnd-kit` 등 미설치
- 기존 드래그 핸들러 없음

#### 8.2 구현 옵션

**옵션 A: Native HTML5 Drag & Drop**
```typescript
// 장점: 추가 의존성 없음
// 단점: 복잡한 API, 모바일 지원 미흡

<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('recordId', record.id);
  }}
  onDragEnd={handleDragEnd}
>
  {record.name}
</div>

<div
  onDrop={handleDrop}
  onDragOver={(e) => e.preventDefault()}
>
  {/* Drop zone */}
</div>
```

**옵션 B: @dnd-kit/core (권장)**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

```typescript
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';

// 장점: 
// - 모던한 API
// - 터치 스크린 지원
// - 접근성 지원
// - TypeScript 친화적
// - 활발한 유지보수

function RecordsModal() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    // 위치 업데이트
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* 드래그 가능한 기록들 */}
    </DndContext>
  );
}
```

**옵션 C: react-beautiful-dnd**
```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
```

```typescript
// 장점: 검증된 라이브러리, 아름다운 애니메이션
// 단점: 유지보수 중단 상태, React 19 호환성 이슈 가능
```

**추천**: **@dnd-kit/core** 사용 (최신, 유지보수 활발, TypeScript 지원 우수)

---

### 9. 위치 영속화 (Persistence)

#### 9.1 현재 상태
- ❌ localStorage/sessionStorage 사용 코드 없음
- ❌ 위치 정보 저장 기능 없음

#### 9.2 구현 방법

**로컬스토리지 저장**:
```typescript
// types/record.ts에 추가
export interface RecordPosition {
  recordId: string;
  x: number;
  y: number;
}

export interface PersistedRecordsState {
  positions: Record<string, RecordPosition>;
  lastUpdated: string;
}

// utils/recordsPersistence.ts
const STORAGE_KEY = 'maechuri_records_positions';

export const saveRecordPositions = (positions: Record<string, RecordPosition>) => {
  const state: PersistedRecordsState = {
    positions,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadRecordPositions = (): Record<string, RecordPosition> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state: PersistedRecordsState = JSON.parse(stored);
    return state.positions;
  } catch (error) {
    console.error('Failed to load record positions:', error);
    return null;
  }
};

export const clearRecordPositions = () => {
  localStorage.removeItem(STORAGE_KEY);
};
```

**Context 확장**:
```typescript
// RecordsContext.tsx 확장
interface RecordsContextType {
  records: Record[];
  positions: Record<string, RecordPosition>;
  addRecords: (newRecords: Array<{ id: string; type: string; name: string }>) => void;
  updateRecordPosition: (recordId: string, x: number, y: number) => void;
}

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>(mockRecordsData.records);
  const [positions, setPositions] = useState<Record<string, RecordPosition>>(() => 
    loadRecordPositions() || {}
  );

  const updateRecordPosition = useCallback((recordId: string, x: number, y: number) => {
    setPositions(prev => {
      const updated = {
        ...prev,
        [recordId]: { recordId, x, y }
      };
      saveRecordPositions(updated);
      return updated;
    });
  }, []);

  // ...
};
```

---

## 🎨 구현 계획

### 10. RecordsModal 컴포넌트 구조

```
src/components/RecordsModal/
├── RecordsModal.tsx          # 메인 모달 컴포넌트
├── RecordsModal.css          # 스타일
├── components/
│   ├── RecordCard.tsx        # 개별 기록 카드 (드래그 가능)
│   ├── RecordGrid.tsx        # 기록 배치 영역
│   ├── RecordFilters.tsx     # 필터 (CLUE/NPC/FACT)
│   └── RecordDetails.tsx     # 기록 상세 정보 패널
├── hooks/
│   ├── useRecordsData.ts     # API 데이터 페칭
│   ├── useRecordDrag.ts      # 드래그 로직
│   └── useRecordPositions.ts # 위치 상태 관리
└── types/
    └── recordsModal.ts       # 모달 전용 타입
```

### 11. 주요 Props 및 State

```typescript
// RecordsModal.tsx
interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: number;
}

interface RecordsModalState {
  // 데이터
  clues: Clue[];
  suspects: Suspect[];
  facts: Fact[];
  
  // UI 상태
  selectedRecordId: string | null;
  filterType: 'ALL' | 'CLUE' | 'SUSPECT' | 'FACT';
  isLoading: boolean;
  error: string | null;
  
  // 드래그 상태
  positions: Record<string, { x: number; y: number }>;
  draggingRecordId: string | null;
}
```

### 12. API 통합

```typescript
// services/api.ts에 추가
export interface RecordsResponse {
  clues: Array<{
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
  }>;
  suspects: Array<{
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
  }>;
  facts: Array<{
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
  }>;
}

export async function getRecords(scenarioId: number): Promise<RecordsResponse> {
  const response = await apiFetch(API_ENDPOINTS.getRecords(scenarioId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }

  return response.json();
}
```

---

## 📝 구현 체크리스트

### Phase 1: 기본 모달 구조
- [ ] RecordsModal 컴포넌트 생성
- [ ] 'r' 키로 모달 열기/닫기
- [ ] GameScreen에 통합
- [ ] 기본 레이아웃 및 스타일

### Phase 2: 데이터 페칭
- [ ] API 엔드포인트 정의
- [ ] 서비스 함수 구현
- [ ] 커스텀 훅 (useRecordsData) 구현
- [ ] 로딩/에러 상태 처리

### Phase 3: 기록 카드 표시
- [ ] RecordCard 컴포넌트
- [ ] 이미지 로딩 및 표시
- [ ] 필터 기능 (CLUE/SUSPECT/FACT)
- [ ] 기록 상세 정보 패널

### Phase 4: 드래그 앤 드롭
- [ ] @dnd-kit 설치 및 설정
- [ ] 드래그 가능한 RecordCard
- [ ] 드롭 영역 구현
- [ ] 드래그 시각 피드백

### Phase 5: 위치 영속화
- [ ] 위치 저장 유틸 함수
- [ ] localStorage 통합
- [ ] RecordsContext 확장
- [ ] 초기 위치 로드

### Phase 6: 추가 기능
- [ ] ESC 키로 모달 닫기
- [ ] 기록 검색 기능
- [ ] 연결선 그리기 (선택적)
- [ ] 메모 추가 기능 (선택적)

---

## 🔍 참고할 기존 코드

### 모달 구현 참고
- `/src/components/common/Modal/Modal.tsx` - 기본 모달
- `/src/components/ChatModal/ChatModal.tsx` - 복잡한 모달 예시
- `/src/components/SolveModal/SolveModal.tsx` - 폼이 있는 모달

### 키보드 핸들링 참고
- `/src/components/GameScreen/hooks/usePlayerControls.ts`
- `/src/components/ChatModal/hooks/useChatInput.ts` (화살표 키)

### API 호출 참고
- `/src/services/api.ts`
- `/src/hooks/useMapData.ts`
- `/src/hooks/useInteraction.ts`

### Context 패턴 참고
- `/src/contexts/RecordsContext.tsx`
- `/src/contexts/ScenarioContext.tsx`

---

## 🚀 다음 단계

1. **API 엔드포인트 확인**: 백엔드 팀과 기록 API 스펙 확인
2. **@dnd-kit 설치**: `npm install @dnd-kit/core @dnd-kit/utilities`
3. **RecordsModal 기본 구조 생성**: 모달 열기/닫기부터 시작
4. **데이터 페칭 구현**: API 통합 및 데이터 표시
5. **드래그 앤 드롭 추가**: 위치 이동 기능
6. **영속화 구현**: 위치 저장 및 로드

---

## 💡 추가 고려사항

### 성능 최적화
- 기록이 많을 경우 가상화 고려 (react-window)
- 이미지 레이지 로딩
- 메모이제이션 (useMemo, useCallback)

### 접근성
- 키보드 네비게이션
- ARIA 레이블
- 스크린 리더 지원

### 모바일 지원
- 터치 드래그
- 반응형 레이아웃
- 작은 화면 최적화

### 에러 처리
- API 실패 시 fallback UI
- 네트워크 재시도 로직
- 사용자 친화적 에러 메시지

---

**문서 작성일**: 2025-01-XX
**작성자**: AI Assistant
**버전**: 1.0
