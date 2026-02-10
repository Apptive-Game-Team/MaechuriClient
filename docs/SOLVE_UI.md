# Solve UI Feature

## Overview
The Solve UI feature allows players to submit their solution to solve the case. When interacting with a special object (id: `d:1`), a modal appears where players can select suspects and provide their reasoning.

## Components

### SolveModal
Located at `src/components/SolveModal/SolveModal.tsx`

A modal that provides:
- **Suspect Selection**: Multi-select checkboxes for suspects (objects with id starting with "s:")
- **Reasoning Input**: Text area for entering the player's reasoning
- **Conversation History**: Shows previous attempts with:
  - User's reasoning and selected suspects (displayed on the right)
  - System feedback including status, message, detailed feedback, and hints (displayed on the left)
  
The modal persists all previous attempts, allowing players to review their past submissions.

### ResultScreen
Located at `src/components/ResultScreen/ResultScreen.tsx`

Displays when the player successfully solves the case:
- **Score Breakdown**:
  - Culprit Score (40% weight)
  - Reasoning Score (60% weight)
  - Total Score
- **Result Message**: Feedback from the system
- **Home Button**: Returns to the main screen

## Integration

### GameScreen
The GameScreen component (`src/components/GameScreen/GameScreen.tsx`) handles:
- Detecting interaction with the solve object (id: `d:1`)
- Opening the SolveModal
- Submitting solve attempts to the API
- Navigating to ResultScreen on success

### App-Level State
The App component manages navigation between three screens:
- Main screen (home)
- Game screen
- Result screen

## API Integration

### Endpoint
`POST /api/scenarios/{scenarioId}/solve`

### Request
```typescript
{
  message: string;        // Player's reasoning
  suspectIds: string[];   // Array of suspect IDs (e.g., ["s:1", "s:2"])
}
```

### Response
```typescript
{
  status: 'correct' | 'partial' | 'incorrect';
  success: boolean;
  culprit_score: number;    // 0 or 100
  reasoning_score: number;  // 0-100
  total_score: number;      // Weighted: 40% culprit + 60% reasoning
  culprit_match: object;
  similarity_score: number; // 0-1
  message: string;
  feedback?: string;        // Detailed feedback (on failure)
  hints?: string[];         // Hints (on failure)
}
```

## User Flow

1. Player explores the game world
2. Player interacts with the solve object (id: `d:1`)
3. SolveModal opens
4. Player:
   - Selects one or more suspects
   - Enters their reasoning
   - Submits solution
5. System responds:
   - **If incorrect/partial**: Shows feedback and hints, keeps modal open for retry
   - **If correct**: Closes modal and navigates to ResultScreen
6. On ResultScreen, player can return to home

## Types

All solve-related types are defined in `src/types/solve.ts`:
- `SolveRequest`: Request payload
- `SolveResponse`: API response
- `SolveStatus`: Status enum
- `SolveAttempt`: Local state for tracking attempts

## Styling

- `SolveModal.css`: Modal styling with conversation-style layout
- `ResultScreen.css`: Result screen with gradient background and score cards

## Features

- ✅ Multi-select suspect list
- ✅ Text input for reasoning
- ✅ Conversation history with distinct styling for user/system messages
- ✅ Status badges (correct/partial/incorrect)
- ✅ Detailed feedback and hints display
- ✅ Score breakdown on success
- ✅ Navigation to home from result screen
- ✅ Persistent attempt history within a single session
