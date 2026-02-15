# RecordsModal Architecture Diagram

## Component Hierarchy

```
GameScreen (main game container)
    │
    ├─── GameEngine (react-game-engine)
    │
    ├─── ChatModal (existing)
    │
    ├─── SolveModal (existing)
    │
    └─── RecordsModal (NEW) ← Opens with 'r' key
            │
            ├─── Modal (common/Modal)
            │       └─── Overlay + Header + Content + Footer
            │
            ├─── RecordFilters (filter buttons)
            │       └─── [ALL] [CLUE] [SUSPECT] [FACT]
            │
            ├─── RecordGrid (DnD Context)
            │       │
            │       ├─── RecordCard (draggable) ← Clue 1
            │       ├─── RecordCard (draggable) ← Clue 2
            │       ├─── RecordCard (draggable) ← Suspect 1
            │       └─── RecordCard (draggable) ← Fact 1
            │
            └─── RecordDetails (side panel)
                    └─── Selected record info + image
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        GameScreen                            │
│                                                              │
│  1. User presses 'r' key                                    │
│     ↓                                                        │
│  2. setRecordsModalOpen(true)                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                      RecordsModal                            │
│                                                              │
│  3. useEffect: Modal opened                                 │
│     ↓                                                        │
│  4. useRecordsData() hook                                   │
│     └── Calls API: getRecords(scenarioId)                   │
│         ↓                                                    │
│  5. API Response                                             │
│     {                                                        │
│       clues: [...],                                          │
│       suspects: [...],                                       │
│       facts: [...]                                           │
│     }                                                        │
│     ↓                                                        │
│  6. Load positions from localStorage                         │
│     loadRecordPositions()                                    │
│     ↓                                                        │
│  7. Merge data + positions → State                          │
│     [{id, type, name, x, y, imageUrl}, ...]                 │
│     ↓                                                        │
│  8. Render RecordCard components                            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   User Interaction                           │
│                                                              │
│  A. User drags RecordCard                                   │
│     ↓                                                        │
│  B. DnD Context → handleDragEnd                             │
│     ↓                                                        │
│  C. updateRecordPosition(recordId, newX, newY)              │
│     ↓                                                        │
│  D. Save to localStorage                                     │
│     saveRecordPositions(positions)                           │
│     ↓                                                        │
│  E. Update UI (card moves)                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    RecordsContext                           │
│                    (Global State)                           │
│                                                             │
│  State:                                                     │
│    - records: Record[]                                      │
│    - positions: Record<recordId, {x, y}>                    │
│                                                             │
│  Methods:                                                   │
│    - addRecords()                                           │
│    - updateRecordPosition()                                 │
│    - getRecordPosition()                                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ useRecords() hook
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│   GameScreen     │          │  RecordsModal    │
│                  │          │                  │
│  - Adds records  │          │  - Displays      │
│    from chat     │          │  - Updates pos   │
│                  │          │  - Persists      │
└──────────────────┘          └──────────────────┘
```

---

## Drag & Drop Flow (@dnd-kit)

```
┌──────────────────────────────────────────────────────────────┐
│                     DndContext                               │
│                                                              │
│  Sensors: [PointerSensor, TouchSensor]                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              RecordGrid (Droppable)                    │ │
│  │                                                        │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │ │
│  │  │ RecordCard │  │ RecordCard │  │ RecordCard │     │ │
│  │  │ (Draggable)│  │ (Draggable)│  │ (Draggable)│     │ │
│  │  │            │  │            │  │            │     │ │
│  │  │  Clue 1    │  │  Suspect 1 │  │  Fact 1    │     │ │
│  │  │  (x, y)    │  │  (x, y)    │  │  (x, y)    │     │ │
│  │  └────────────┘  └────────────┘  └────────────┘     │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  onDragEnd={(event) => {                                    │
│    const { active, delta } = event;                         │
│    const recordId = active.id;                              │
│    const newX = currentX + delta.x;                         │
│    const newY = currentY + delta.y;                         │
│    updateRecordPosition(recordId, newX, newY);              │
│  }}                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## API Integration

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                                                             │
│  RecordsModal                                               │
│      │                                                      │
│      │ useRecordsData()                                     │
│      ↓                                                      │
│  getRecords(scenarioId)                                     │
│      │                                                      │
│      │ HTTP GET                                             │
│      ↓                                                      │
└──────┼──────────────────────────────────────────────────────┘
       │
       │ /api/scenarios/{scenarioId}/records
       │
┌──────▼──────────────────────────────────────────────────────┐
│                        Backend                              │
│                                                             │
│  RecordsController                                          │
│      │                                                      │
│      ↓                                                      │
│  Fetch from database:                                       │
│      - clues (collected by user)                            │
│      - suspects (encountered NPCs)                          │
│      - facts (discovered info)                              │
│      │                                                      │
│      ↓                                                      │
│  Return JSON:                                               │
│  {                                                          │
│    "clues": [                                               │
│      {                                                      │
│        "id": 1,                                             │
│        "name": "피 묻은 칼",                                 │
│        "description": "...",                                │
│        "imageUrl": "https://..."                            │
│      }                                                      │
│    ],                                                       │
│    "suspects": [...],                                       │
│    "facts": [...]                                           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## LocalStorage Persistence

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser LocalStorage                     │
│                                                             │
│  Key: "maechuri_records_positions"                          │
│                                                             │
│  Value: {                                                   │
│    "positions": {                                           │
│      "clue-1": { "recordId": "clue-1", "x": 100, "y": 50 }, │
│      "clue-2": { "recordId": "clue-2", "x": 250, "y": 150 },│
│      "suspect-1": { "recordId": "suspect-1", "x": 400, ... }│
│    },                                                       │
│    "lastUpdated": "2025-01-15T10:30:00.000Z"                │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
        ↑                                          │
        │                                          │
        │ Load on mount                            │ Save on drag
        │                                          │
        │                                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      RecordsModal                           │
│                                                             │
│  useEffect(() => {                                          │
│    // On mount                                              │
│    const positions = loadRecordPositions();                 │
│    setPositions(positions || {});                           │
│  }, []);                                                    │
│                                                             │
│  const handleDragEnd = (event) => {                         │
│    // ... calculate new position                            │
│    updateRecordPosition(recordId, x, y);                    │
│    saveRecordPositions(allPositions); ← Auto-save          │
│  };                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure (Proposed)

```
src/
├── components/
│   └── RecordsModal/
│       ├── RecordsModal.tsx          # Main container
│       ├── RecordsModal.css          # Styles
│       │
│       ├── components/
│       │   ├── RecordCard.tsx        # Draggable card
│       │   │   └── RecordCard.css
│       │   │
│       │   ├── RecordGrid.tsx        # Canvas/grid container
│       │   │   └── RecordGrid.css
│       │   │
│       │   ├── RecordFilters.tsx     # Type filter buttons
│       │   │   └── RecordFilters.css
│       │   │
│       │   └── RecordDetails.tsx     # Details side panel
│       │       └── RecordDetails.css
│       │
│       ├── hooks/
│       │   ├── useRecordsData.ts     # Fetch records from API
│       │   ├── useRecordDrag.ts      # Drag & drop logic
│       │   └── useRecordPositions.ts # Position state mgmt
│       │
│       └── types/
│           └── recordsModal.ts       # Modal-specific types
│
├── contexts/
│   └── RecordsContext.tsx            # ← Extend this
│
├── services/
│   └── api.ts                        # ← Add getRecords()
│
├── types/
│   └── record.ts                     # ← Add new types
│
└── utils/
    └── recordsPersistence.ts         # ← NEW: localStorage utils
```

---

## Type Definitions (Extended)

```typescript
// types/record.ts
export type RecordType = 'CLUE' | 'NPC' | 'FACT'; // Add 'FACT'

export interface Record {
  id: number | string;
  type: RecordType;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface RecordPosition {
  recordId: string;
  x: number;
  y: number;
}

export interface RecordsData {
  records: Record[];
}

// types/recordsModal.ts (NEW)
export interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: number;
}

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

export type RecordFilterType = 'ALL' | 'CLUE' | 'SUSPECT' | 'FACT';

export interface RecordCardData extends Record {
  x?: number;
  y?: number;
}
```

---

## Event Flow Timeline

```
Time    Event
─────────────────────────────────────────────────────────────
T0      User playing game (GameScreen)
│
│       User presses 'r' key
│       ↓
T1      handleKeyDown → setRecordsModalOpen(true)
│       ↓
T2      RecordsModal renders
│       ↓
T3      useRecordsData() hook triggered
│       ├─→ API call: getRecords(scenarioId)
│       │   ↓ (200-500ms)
│       └─→ loadRecordPositions() from localStorage
│           ↓ (instant)
T4      Data received + positions loaded
│       ↓
T5      Merge data: records + positions
│       ↓
T6      Render RecordCards in RecordGrid
│       ├─→ RecordCard #1 at (x: 100, y: 50)
│       ├─→ RecordCard #2 at (x: 250, y: 150)
│       └─→ ...
│
│       User starts dragging RecordCard #1
│       ↓
T7      onDragStart → DnD context active
│       ↓ (dragging...)
T8      onDragEnd → event { active, delta }
│       ↓
T9      Calculate new position
│       newX = oldX + delta.x
│       newY = oldY + delta.y
│       ↓
T10     updateRecordPosition(recordId, newX, newY)
│       ├─→ Update Context state
│       └─→ saveRecordPositions() to localStorage
│           ↓
T11     RecordCard re-renders at new position
│
│       User presses 'ESC' or clicks overlay
│       ↓
T12     onClose() → setRecordsModalOpen(false)
│       ↓
T13     RecordsModal unmounts
│       ↓
T14     Back to GameScreen
```

---

## Key Implementation Notes

### 1. Keyboard Handler Priority
```typescript
// GameScreen.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // IMPORTANT: Check if other modals are open first!
    if (chatModalOpen || solveModalOpen) return;
    
    // Check if input/textarea is focused
    const target = e.target;
    if (target instanceof HTMLInputElement || 
        target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault(); // Prevent any default browser behavior
      setRecordsModalOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [chatModalOpen, solveModalOpen]);
```

### 2. DnD Setup
```typescript
// RecordsModal.tsx
import { DndContext, DragEndEvent, PointerSensor, useSensor } from '@dnd-kit/core';

const sensors = [
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement before drag starts
    },
  }),
];

const handleDragEnd = (event: DragEndEvent) => {
  const { active, delta } = event;
  const recordId = String(active.id);
  
  const currentPos = positions[recordId] || { x: 0, y: 0 };
  const newX = currentPos.x + delta.x;
  const newY = currentPos.y + delta.y;
  
  updateRecordPosition(recordId, newX, newY);
};
```

### 3. Performance Optimization
```typescript
// Use React.memo for RecordCard
export const RecordCard = React.memo(({ record, position, onSelect }) => {
  // Component implementation
});

// Use useCallback for handlers
const handleCardClick = useCallback((recordId: string) => {
  setSelectedRecordId(recordId);
}, []);

// Use useMemo for filtered records
const filteredRecords = useMemo(() => {
  if (filterType === 'ALL') return records;
  return records.filter(r => r.type === filterType);
}, [records, filterType]);
```

---

**Architecture documentation complete** ✅
