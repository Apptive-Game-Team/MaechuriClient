# RecordsModal 구현 빠른 시작 가이드

## 🎯 목표
'r' 키로 열리는 기록 시각화 모달 구현:
- ✅ Clue, Suspect, Fact 기록 표시
- ✅ 드래그 앤 드롭으로 위치 이동
- ✅ 위치 로컬스토리지 저장
- ✅ API에서 데이터 가져오기

---

## 📦 1단계: 의존성 설치

```bash
# @dnd-kit 설치 (드래그 앤 드롭)
npm install @dnd-kit/core @dnd-kit/utilities

# 타입 확인 (이미 설치되어 있어야 함)
npm list react react-dom typescript
```

---

## 📁 2단계: 파일 생성

### 2.1 타입 정의 확장

**`src/types/record.ts`** - 기존 파일 수정:
```typescript
// 기존 내용...
export type RecordType = 'CLUE' | 'NPC' | 'FACT'; // 'FACT' 추가

// 새로 추가
export interface RecordPosition {
  recordId: string;
  x: number;
  y: number;
}

export interface PersistedRecordsState {
  positions: Record<string, RecordPosition>;
  lastUpdated: string;
}
```

### 2.2 로컬스토리지 유틸리티

**`src/utils/recordsPersistence.ts`** - 새 파일:
```typescript
import type { RecordPosition, PersistedRecordsState } from '../types/record';

const STORAGE_KEY = 'maechuri_records_positions';

export const saveRecordPositions = (positions: Record<string, RecordPosition>): void => {
  try {
    const state: PersistedRecordsState = {
      positions,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save record positions:', error);
  }
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

export const clearRecordPositions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
```

### 2.3 API 엔드포인트 추가

**`src/config/api.ts`** - 기존 파일 수정:
```typescript
export const API_ENDPOINTS = {
  // 기존...
  getTodayMap: () => `${API_BASE_URL}/api/scenarios/today/data/map`,
  getScenarioMap: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/data/map`,
  interact: (scenarioId: number, objectId: string) => `${API_BASE_URL}/api/scenarios/${scenarioId}/interact/${objectId}`,
  solve: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/solve`,
  
  // 새로 추가
  getRecords: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/records`,
} as const;
```

### 2.4 API 서비스 함수

**`src/services/api.ts`** - 기존 파일에 추가:
```typescript
// 파일 상단에 타입 추가
export interface RecordsApiResponse {
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

// 파일 하단에 함수 추가
export async function getRecords(scenarioId: number): Promise<RecordsApiResponse> {
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

### 2.5 RecordsContext 확장

**`src/contexts/RecordsContext.tsx`** - 기존 파일 수정:
```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Record, RecordPosition } from '../types/record';
import { mockRecordsData } from '../data/recordsData';
import { loadRecordPositions, saveRecordPositions } from '../utils/recordsPersistence';

interface RecordsContextType {
  records: Record[];
  positions: Record<string, RecordPosition>;
  addRecords: (newRecords: Array<{ id: string; type: string; name: string }>) => void;
  updateRecordPosition: (recordId: string, x: number, y: number) => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export const RecordsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record[]>(mockRecordsData.records);
  const [positions, setPositions] = useState<Record<string, RecordPosition>>(() => 
    loadRecordPositions() || {}
  );

  const addRecords = useCallback((newRecords: Array<{ id: string; type: string; name: string }>) => {
    setRecords((prevRecords) => {
      const updatedRecords = [...prevRecords];
      
      newRecords.forEach((newRecord) => {
        const recordType = newRecord.type.toUpperCase();
        const exists = updatedRecords.some(
          (existing) => {
            const existingIdStr = String(existing.id);
            const newRecordIdStr = String(newRecord.id);
            return existingIdStr === newRecordIdStr && existing.type === recordType;
          }
        );
        
        if (!exists) {
          updatedRecords.push({
            id: newRecord.id,
            type: recordType as 'CLUE' | 'NPC' | 'FACT',
            name: newRecord.name,
          });
        }
      });
      
      return updatedRecords;
    });
  }, []);

  const updateRecordPosition = useCallback((recordId: string, x: number, y: number) => {
    setPositions((prev) => {
      const updated = {
        ...prev,
        [recordId]: { recordId, x, y },
      };
      saveRecordPositions(updated);
      return updated;
    });
  }, []);

  return (
    <RecordsContext.Provider value={{ records, positions, addRecords, updateRecordPosition }}>
      {children}
    </RecordsContext.Provider>
  );
};

export const useRecords = (): RecordsContextType => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
```

---

## 🎨 3단계: RecordsModal 컴포넌트 생성

### 3.1 디렉토리 구조 생성

```bash
mkdir -p src/components/RecordsModal/components
mkdir -p src/components/RecordsModal/hooks
mkdir -p src/components/RecordsModal/types
```

### 3.2 RecordCard 컴포넌트

**`src/components/RecordsModal/components/RecordCard.tsx`**:
```typescript
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Record } from '../../../types/record';
import './RecordCard.css';

interface RecordCardProps {
  record: Record;
  position: { x: number; y: number };
  onSelect: (recordId: string) => void;
  isSelected: boolean;
}

export const RecordCard: React.FC<RecordCardProps> = ({ 
  record, 
  position, 
  onSelect, 
  isSelected 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(record.id),
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`record-card ${isSelected ? 'selected' : ''} ${record.type.toLowerCase()}`}
      onClick={() => onSelect(String(record.id))}
      {...listeners}
      {...attributes}
    >
      <div className="record-card-type">{record.type}</div>
      <div className="record-card-name">{record.name}</div>
    </div>
  );
};
```

**`src/components/RecordsModal/components/RecordCard.css`**:
```css
.record-card {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  padding: 12px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
  touch-action: none; /* Important for mobile drag */
}

.record-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.record-card.selected {
  border: 2px solid #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.4);
}

.record-card.clue {
  border-left: 4px solid #2196F3;
}

.record-card.npc {
  border-left: 4px solid #FF9800;
}

.record-card.fact {
  border-left: 4px solid #9C27B0;
}

.record-card-type {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.record-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  word-break: break-word;
}
```

### 3.3 RecordsModal 메인 컴포넌트

**`src/components/RecordsModal/RecordsModal.tsx`**:
```typescript
import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Modal } from '../common/Modal/Modal';
import { RecordCard } from './components/RecordCard';
import { useRecords } from '../../contexts/RecordsContext';
import type { Record } from '../../types/record';
import './RecordsModal.css';

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({ isOpen, onClose }) => {
  const { records, positions, updateRecordPosition } = useRecords();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px before drag starts
      },
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const recordId = String(active.id);
    
    const currentPos = positions[recordId] || { recordId, x: 50, y: 50 };
    const newX = Math.max(0, currentPos.x + delta.x);
    const newY = Math.max(0, currentPos.y + delta.y);
    
    updateRecordPosition(recordId, newX, newY);
  };

  // Get position for record (with default)
  const getRecordPosition = (recordId: string, index: number) => {
    if (positions[recordId]) {
      return positions[recordId];
    }
    // Default position: grid layout
    const col = index % 4;
    const row = Math.floor(index / 4);
    return { x: 50 + col * 150, y: 50 + row * 150 };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="기록 보드"
      maxWidth="1200px"
    >
      <div className="records-modal-content">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="records-grid">
            {records.map((record, index) => {
              const recordId = String(record.id);
              const position = getRecordPosition(recordId, index);
              
              return (
                <RecordCard
                  key={recordId}
                  record={record}
                  position={position}
                  onSelect={setSelectedRecordId}
                  isSelected={selectedRecordId === recordId}
                />
              );
            })}
          </div>
        </DndContext>

        {selectedRecordId && (
          <div className="records-detail-panel">
            <h4>상세 정보</h4>
            <p>선택된 기록: {selectedRecordId}</p>
            {/* 나중에 상세 정보 추가 */}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RecordsModal;
```

**`src/components/RecordsModal/RecordsModal.css`**:
```css
.records-modal-content {
  display: flex;
  gap: 16px;
  min-height: 600px;
  padding: 16px;
}

.records-grid {
  flex: 1;
  position: relative;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 600px;
  overflow: hidden;
}

.records-detail-panel {
  width: 300px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.records-detail-panel h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}
```

---

## 🔌 4단계: GameScreen에 통합

**`src/components/GameScreen/GameScreen.tsx`** - 기존 파일 수정:

```typescript
// 1. Import 추가
import RecordsModal from '../RecordsModal/RecordsModal';

// 2. State 추가 (다른 modal state 옆에)
const [recordsModalOpen, setRecordsModalOpen] = useState(false);

// 3. 키보드 핸들러 추가 (usePlayerControls 아래에)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 다른 모달이 열려있으면 무시
    if (chatModalOpen || solveModalOpen) return;
    
    // 입력 필드에 포커스가 있으면 무시
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      setRecordsModalOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [chatModalOpen, solveModalOpen]);

// 4. JSX에 모달 추가 (다른 modals 옆에)
return (
  <div className="game-screen">
    {/* ... 기존 코드 ... */}

    <ChatModal
      isOpen={chatModalOpen}
      // ... props
    />

    <SolveModal
      isOpen={solveModalOpen}
      // ... props
    />

    {/* 새로 추가 */}
    <RecordsModal
      isOpen={recordsModalOpen}
      onClose={() => setRecordsModalOpen(false)}
    />
  </div>
);
```

---

## 🧪 5단계: 테스트

### 5.1 개발 서버 실행
```bash
npm run dev
```

### 5.2 테스트 체크리스트

- [ ] 게임 화면에서 'r' 키를 누르면 모달이 열리는지
- [ ] 모달에 기록들이 표시되는지
- [ ] 기록 카드를 드래그할 수 있는지
- [ ] 드래그 후 위치가 유지되는지
- [ ] 모달을 닫고 다시 열었을 때 위치가 저장되어 있는지
- [ ] 다른 모달이 열려있을 때 'r' 키가 무시되는지
- [ ] 오버레이를 클릭하면 모달이 닫히는지

---

## 🐛 문제 해결

### 문제 1: "Cannot find module '@dnd-kit/core'"
```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

### 문제 2: 드래그가 작동하지 않음
- `touch-action: none` CSS 속성 확인
- PointerSensor 설정 확인
- activationConstraint distance 조정

### 문제 3: 위치가 저장되지 않음
- 브라우저 콘솔에서 localStorage 확인:
```javascript
localStorage.getItem('maechuri_records_positions')
```
- localStorage가 비활성화되어 있지 않은지 확인

### 문제 4: 타입 에러
```bash
npm run lint
# 타입 에러 확인
```

---

## 📚 다음 단계 (선택적 기능)

### Phase 2: API 통합
```typescript
// hooks/useRecordsData.ts
export const useRecordsData = (scenarioId: number) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await getRecords(scenarioId);
        setData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [scenarioId]);

  return { data, loading, error };
};
```

### Phase 3: 필터 기능
```typescript
// components/RecordFilters.tsx
export const RecordFilters: React.FC<FilterProps> = ({ onFilterChange }) => {
  return (
    <div className="record-filters">
      <button onClick={() => onFilterChange('ALL')}>전체</button>
      <button onClick={() => onFilterChange('CLUE')}>단서</button>
      <button onClick={() => onFilterChange('SUSPECT')}>용의자</button>
      <button onClick={() => onFilterChange('FACT')}>사실</button>
    </div>
  );
};
```

### Phase 4: 상세 패널
```typescript
// components/RecordDetails.tsx
export const RecordDetails: React.FC<{ record: Record }> = ({ record }) => {
  return (
    <div className="record-details">
      <h4>{record.name}</h4>
      {record.imageUrl && <img src={record.imageUrl} alt={record.name} />}
      <p>{record.description}</p>
    </div>
  );
};
```

---

## ✅ 완성 체크리스트

### 필수 기능
- [x] 'r' 키로 모달 열기
- [x] RecordsModal 컴포넌트
- [x] RecordCard 드래그 가능
- [x] 위치 localStorage 저장
- [x] RecordsContext 확장

### 추가 기능 (선택)
- [ ] API 통합
- [ ] 필터 기능
- [ ] 상세 정보 패널
- [ ] 이미지 표시
- [ ] 검색 기능
- [ ] ESC 키로 닫기

---

## 📖 참고 문서

- `docs/codebase-analysis-for-records-modal.md` - 상세 코드베이스 분석
- `docs/EXPLORATION_SUMMARY.md` - 영문 요약
- `docs/ARCHITECTURE_DIAGRAM.md` - 아키텍처 다이어그램

---

**가이드 작성**: 2025
**버전**: 1.0
