# Repository Exploration Summary

## Quick Overview

This is a **React 19.2 + TypeScript + Vite** project for a 2D mystery-solving game using **react-game-engine**. The project uses **React Context** for state management and **native Fetch** for API calls.

---

## 1. Project Structure

### Framework & Tools
- **React 19.2.0** with TypeScript
- **Vite 7.2.4** (build tool)
- **react-game-engine 1.2.0** (2D rendering)
- **No drag-drop library** (needs to be added)
- **No Redux/Zustand** (uses React Context)

### Directory Structure
```
src/
├── components/
│   ├── GameScreen/        # Main game view
│   ├── ChatModal/         # Interaction modal
│   ├── SolveModal/        # Solution submission
│   └── common/Modal/      # Reusable modal base
├── contexts/
│   └── RecordsContext.tsx # Records state management
├── services/
│   └── api.ts             # API functions
├── types/
│   └── record.ts          # Record type definitions
└── utils/
    └── assetLoader.ts     # Image loading utilities
```

---

## 2. Modal Implementation

### Base Modal Component
**File**: `/src/components/common/Modal/Modal.tsx`

- Props: `isOpen`, `onClose`, `title`, `children`, `footer`, `maxWidth`
- Features: overlay click to close, z-index 10000, max-height 85vh
- No ESC key support (needs to be added)

### Usage Pattern (from GameScreen.tsx)
```typescript
const [modalOpen, setModalOpen] = useState(false);

<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  title="Title"
>
  {/* content */}
</Modal>
```

---

## 3. Keyboard Event Handling

### Current Implementation
**File**: `/src/components/GameScreen/hooks/usePlayerControls.ts`

- Listens to `window.addEventListener('keydown', handleKeyDown)`
- Keys: WASD/Arrows (movement), Space/E (interact)
- Dispatches events to game engine

### How to Add 'r' Key Modal Trigger

**Option A: Add to GameScreen.tsx**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (chatModalOpen || solveModalOpen) return;
    if (e.target instanceof HTMLInputElement) return;
    
    if (e.key === 'r' || e.key === 'R') {
      setRecordsModalOpen(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [chatModalOpen, solveModalOpen]);
```

---

## 4. Records Data Structure

### Types (`/src/types/record.ts`)
```typescript
export type RecordType = 'CLUE' | 'NPC';

export interface Record {
  id: number | string;
  type: RecordType;
  name: string;
}
```

### RecordsContext (`/src/contexts/RecordsContext.tsx`)
```typescript
interface RecordsContextType {
  records: Record[];
  addRecords: (newRecords: Array<{ id: string; type: string; name: string }>) => void;
}

export const useRecords = (): RecordsContextType
```

**Current Features**:
- ✅ Store records (with duplicate prevention)
- ✅ Add records
- ❌ Update individual record (position, notes)
- ❌ LocalStorage persistence

---

## 5. API Structure

### Configuration (`/src/config/api.ts`)
```typescript
API_BASE_URL: 'http://localhost:8080' (dev) | 'https://yh.yunseong.dev' (prod)

Endpoints:
- /api/scenarios/today/data/map
- /api/scenarios/{scenarioId}/data/map
- /api/scenarios/{scenarioId}/interact/{objectId}
- /api/scenarios/{scenarioId}/solve
```

### Service Functions (`/src/services/api.ts`)
```typescript
export async function getTodayMap(): Promise<ScenarioData>
export async function getScenarioMap(scenarioId: number): Promise<ScenarioData>
export async function sendInteraction(scenarioId: number, objectId: string, request: InteractionRequest): Promise<InteractionResponse>
export async function submitSolve(scenarioId: number, request: SolveRequest): Promise<SolveResponse>
```

### Fetch Wrapper (`/src/utils/apiFetch.ts`)
- Adds fingerprint ID header automatically
- Includes credentials: 'include'
- Uses native `fetch()` API

### **NEW Endpoints Needed for Records Modal**
```typescript
// Suggested new endpoints
getRecords: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/records`
getClues: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/clues`
getSuspects: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/suspects`
getFacts: (scenarioId: number) => `${API_BASE_URL}/api/scenarios/${scenarioId}/facts`
```

---

## 6. Image Loading

### Asset Loader (`/src/utils/assetLoader.ts`)
```typescript
// Fetch asset JSON with directional images
fetchObjectAsset(objectUrl: string): Promise<DirectionalAsset>

// Get image URL for direction
getAssetImage(asset: DirectionalAsset, direction?: Direction): string

// Preload image
preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}
```

### Rendering (`/src/components/GameScreen/components/renderers.tsx`)
```typescript
style={{
  backgroundImage: `url(${imageUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}}
```

---

## 7. Drag and Drop

### Current Status
**⚠️ NOT IMPLEMENTED**

- No drag-drop library installed
- No `react-beautiful-dnd` or `@dnd-kit`
- No existing drag handlers

### Implementation Options

#### Option A: Native HTML5 Drag & Drop
```typescript
// Pros: No dependencies
// Cons: Complex API, poor mobile support

<div
  draggable
  onDragStart={(e) => e.dataTransfer.setData('recordId', record.id)}
  onDragEnd={handleDragEnd}
/>
```

#### Option B: @dnd-kit/core (Recommended ✅)
```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

**Pros**:
- Modern API
- Touch screen support
- Accessibility support
- TypeScript friendly
- Actively maintained

```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core';

function RecordsModal() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    // Update position
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* draggable records */}
    </DndContext>
  );
}
```

#### Option C: react-beautiful-dnd
```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
```

**Cons**: Maintenance stopped, possible React 19 compatibility issues

---

## 8. Position Persistence

### Current Status
- ❌ No localStorage/sessionStorage usage
- ❌ No position saving functionality

### Implementation Approach

```typescript
// types/record.ts - Add new types
export interface RecordPosition {
  recordId: string;
  x: number;
  y: number;
}

// utils/recordsPersistence.ts - New file
const STORAGE_KEY = 'maechuri_records_positions';

export const saveRecordPositions = (positions: Record<string, RecordPosition>) => {
  const state = {
    positions,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadRecordPositions = (): Record<string, RecordPosition> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored).positions : null;
  } catch (error) {
    console.error('Failed to load positions:', error);
    return null;
  }
};
```

### Context Extension
```typescript
// Extend RecordsContext.tsx
interface RecordsContextType {
  records: Record[];
  positions: Record<string, RecordPosition>;
  addRecords: (newRecords: Array<...>) => void;
  updateRecordPosition: (recordId: string, x: number, y: number) => void;
}
```

---

## 9. Implementation Checklist

### Phase 1: Basic Modal Structure
- [ ] Create RecordsModal component
- [ ] Add 'r' key open/close handler
- [ ] Integrate into GameScreen
- [ ] Basic layout and styling

### Phase 2: Data Fetching
- [ ] Define API endpoints
- [ ] Implement service functions
- [ ] Create useRecordsData hook
- [ ] Handle loading/error states

### Phase 3: Display Records
- [ ] RecordCard component
- [ ] Image loading and display
- [ ] Filter functionality (CLUE/SUSPECT/FACT)
- [ ] Record details panel

### Phase 4: Drag & Drop
- [ ] Install @dnd-kit
- [ ] Make RecordCard draggable
- [ ] Implement drop zone
- [ ] Visual feedback

### Phase 5: Position Persistence
- [ ] Create persistence utilities
- [ ] Integrate localStorage
- [ ] Extend RecordsContext
- [ ] Load initial positions

### Phase 6: Polish
- [ ] ESC key to close
- [ ] Search functionality
- [ ] Connection lines (optional)
- [ ] Notes feature (optional)

---

## 10. Key Files to Reference

### Modal Implementation
- `/src/components/common/Modal/Modal.tsx` - Base modal
- `/src/components/ChatModal/ChatModal.tsx` - Complex modal example
- `/src/components/SolveModal/SolveModal.tsx` - Form modal example

### Keyboard Handling
- `/src/components/GameScreen/hooks/usePlayerControls.ts`
- `/src/components/ChatModal/hooks/useChatInput.ts`

### API Calls
- `/src/services/api.ts`
- `/src/hooks/useMapData.ts`
- `/src/hooks/useInteraction.ts`

### Context Pattern
- `/src/contexts/RecordsContext.tsx`
- `/src/contexts/ScenarioContext.tsx`

---

## 11. Recommended Component Structure

```
src/components/RecordsModal/
├── RecordsModal.tsx          # Main modal component
├── RecordsModal.css          # Styles
├── components/
│   ├── RecordCard.tsx        # Individual draggable card
│   ├── RecordGrid.tsx        # Grid/canvas for records
│   ├── RecordFilters.tsx     # Filter by type
│   └── RecordDetails.tsx     # Detail panel
├── hooks/
│   ├── useRecordsData.ts     # API data fetching
│   ├── useRecordDrag.ts      # Drag logic
│   └── useRecordPositions.ts # Position state
└── types/
    └── recordsModal.ts       # Modal-specific types
```

---

## Next Steps

1. **Confirm API endpoints** with backend team
2. **Install @dnd-kit**: `npm install @dnd-kit/core @dnd-kit/utilities`
3. **Create RecordsModal** basic structure
4. **Implement data fetching** and display
5. **Add drag & drop** functionality
6. **Implement persistence** with localStorage

---

**Exploration completed**: Ready for implementation 🚀
