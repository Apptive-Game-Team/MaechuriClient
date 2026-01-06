# API Integration Guide

## Overview

This document explains how the API integration works for map loading and interaction features in the Maechuri Client.

## Configuration

### Environment Variables

Create a `.env` file in the project root (based on `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8080
```

If not set, the default value is `http://localhost:8080`.

## API Endpoints

### Map Loading

#### Get Today's Map
- **Endpoint**: `GET /api/scenarios/today/data/map`
- **Description**: Fetches the active scenario for today's date
- **Response**: See ScenarioData type below

#### Get Specific Scenario Map
- **Endpoint**: `GET /api/scenarios/{scenarioId}/data/map`
- **Description**: Fetches a specific scenario by ID
- **Response**: See ScenarioData type below

**Response Format (ScenarioData)**:
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

### Interactions

#### Interact with Object
- **Endpoint**: `POST /api/scenarios/{scenarioId}/interact/{objectId}`
- **Description**: Start or continue interaction with an object

**Request Body (Optional)**:
```typescript
{
  "message": "너 말해봐",      // Optional: player's message (for two-way interactions)
  "history": "jwt_token_here"  // Optional: JWT-encoded conversation history
}
```

**Initial Request**: For the first interaction, send an empty body `{}` or no body to determine the interaction type.

**Response - Two-way Interaction**:
```typescript
{
  "type": "two-way",
  "message": "안녕 너가 말해봐",
  "history": "updated_jwt_token_here"
}
```

**Response - Simple Interaction**:
```typescript
{
  "type": "simple",
  "message": "안녕 난 요리사 이선민이야",
  "name": "이선민"  // Optional
}
```

## Usage

### Using Map Data

The `useMapData` hook handles fetching map data from the API:

```typescript
import { useMapData } from '../../hooks/useMapData';

function MyComponent() {
  // Fetch today's map
  const { data, isLoading, error } = useMapData();
  
  // Or fetch a specific scenario
  const { data, isLoading, error } = useMapData({ scenarioId: 1 });
  
  // Or use mock data (default for development)
  const { data, isLoading, error } = useMapData({ useMockData: true });
}
```

**Features**:
- Automatic fallback to mock data on API errors
- Loading and error states
- Supports both today's map and specific scenario fetching

### Managing Interactions

The `useInteraction` hook handles all interaction logic:

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
  
  // Start interaction with an object
  await startInteraction(scenarioId, objectId);
  
  // Send a message (for two-way interactions)
  await sendMessage(scenarioId, objectId, "Hello!");
  
  // Get interaction state for an object
  const state = getInteractionState(objectId);
  // state contains: { type, messages, jwtHistory }
}
```

**Features**:
- Per-object interaction history
- Automatic JWT history management
- Plaintext message history for UI display
- Distinguishes between simple and two-way interactions

### Interaction UI

The `ChatModal` component provides the interaction interface:

```typescript
import ChatModal from '../ChatModal/ChatModal';

<ChatModal
  isOpen={chatModalOpen}
  objectName="요리사 1"
  messages={messages}  // Array of ChatMessage
  interactionType="two-way"  // or "simple"
  onClose={() => setChatModalOpen(false)}
  onSendMessage={(message) => handleSendMessage(message)}
/>
```

**Features**:
- Modal dialog with messenger-like UI
- Player messages aligned right (blue bubbles)
- NPC messages aligned left (gray bubbles)
- Optional NPC names displayed above messages
- Input disabled for simple (read-only) interactions
- Auto-scroll to latest message

## Data Flow

### Map Loading Flow

1. `GameScreen` component mounts
2. `useMapData` hook fetches map from API
3. On success: Map data is used to render game
4. On failure: Falls back to mock data automatically
5. Map data is set in game utilities via `setCurrentMapData()`

### Interaction Flow

1. Player presses interaction key (E or Space) while facing an object
2. `interactionSystem` detects interaction and dispatches `gameInteraction` event
3. `GameScreen` handles event and opens `ChatModal`
4. If first interaction: Call `startInteraction()` to get initial message and type
5. For two-way interactions: Player can send messages via input
6. Each message updates both JWT history (for API) and plaintext messages (for UI)
7. History is stored per-object, so switching between objects maintains separate conversations

## History Management

### JWT History (API)
- Stored per object in `ObjectInteractionState.jwtHistory`
- Sent with each API request in `InteractionRequest.history`
- Updated with each API response in `TwoWayInteractionResponse.history`
- Used by backend to maintain conversation context

### Plaintext History (UI)
- Stored per object in `ObjectInteractionState.messages`
- Array of `ChatMessage` objects with content, sender, name, and timestamp
- Displayed in `ChatModal` component
- Player messages and NPC responses are both stored
- Names are displayed for NPC messages when available

## Types

### Key Type Definitions

```typescript
// Interaction Types
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

// Map Types (see src/types/map.ts for full definitions)
interface ScenarioData {
  createdDate: string;
  scenarioId: number;
  scenarioName: string;
  map: GameMap;
}
```

## Development Mode

By default, the game uses mock data to allow development without a running backend:

```typescript
// In GameScreen.tsx
const { data: scenarioData } = useMapData({
  useMockData: true,  // Set to false to use API
});
```

To test with the real API:
1. Set up the backend server
2. Configure `VITE_API_BASE_URL` in `.env`
3. Change `useMockData: true` to `useMockData: false` in GameScreen.tsx
4. The application will automatically fall back to mock data if API calls fail

## Error Handling

- **Map Loading**: Automatically falls back to mock data on errors, logs error to console
- **Interactions**: Displays error in console, maintains UI state
- **Network Failures**: Gracefully handled with error messages and fallbacks

## Testing

To test the API integration:

1. **Map Loading**: 
   - Start the dev server
   - Check browser console for "Loading map data" messages
   - Verify map renders correctly
   
2. **Interactions**:
   - Move player near an interactable object (요리사 1, 2, or 3)
   - Press E or Space to interact
   - Chat modal should appear with initial message
   - For two-way interactions, try sending messages

3. **History**:
   - Interact with an object, close modal
   - Interact again - history should be preserved
   - Switch to different object - separate history should be maintained
