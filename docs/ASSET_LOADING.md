# Asset Loading System

## Overview
This system handles loading game assets from URLs and supports directional images for sprites.

## Asset Format

Assets are JSON files that define directional images:

```json
{
  "left": "https://example.com/sprite_left.png",
  "right": "https://example.com/sprite_right.png",
  "front": "https://example.com/sprite_front.png",
  "back": "https://example.com/sprite_back.png"
}
```

### Supported Formats
- **All directions**: Provide all four directional images
- **Front only**: Provide only `front` - used for all directions
- **Partial**: Provide any combination - system falls back intelligently
- **Empty**: System falls back to colored tiles

## Usage

### 1. Define Objects in Map Data

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

### 2. Assets Load Automatically

The `useAssetLoader` hook automatically:
- Fetches all object assets
- Fetches player asset
- Handles loading states
- Provides error handling
- Falls back gracefully on failure

### 3. Rendering

Renderers automatically use loaded assets with the following logic:

#### For Tiles
- Uses the `front` image if available
- Falls back to any available directional image
- Falls back to colored tiles if no asset

#### For Player
- Maps game directions to asset directions:
  - `up` → `back` image
  - `down` → `front` image
  - `left` → `left` image
  - `right` → `right` image
- Falls back to `front` if specific direction unavailable
- Falls back to any image if `front` unavailable
- Falls back to colored circle if no asset

## API Reference

### `fetchObjectAsset(objectUrl: string): Promise<DirectionalAsset>`
Fetches an asset definition from a URL.
- Validates the asset structure
- Throws error if invalid or fetch fails

### `getAssetImage(asset: DirectionalAsset, direction?: string): string | undefined`
Gets the appropriate image URL for a direction.
- Returns direction-specific image if available
- Falls back to `front`, then any available image

### `useAssetLoader(objects: MapObject[], playerObjectUrl?: string): AssetsState`
React hook for loading and managing assets.
- Returns loading state, loaded assets, and errors
- Handles individual asset failures gracefully

## Error Handling

The system is designed to be resilient:
1. **Network Errors**: Logs warning, continues with fallback
2. **Invalid JSON**: Logs error, uses fallback rendering
3. **Missing Images**: Uses next available image in priority order
4. **CORS Issues**: Falls back to colored tiles

## Example Asset URLs

```
https://s3.yunseong.dev/maechuri/objects/tile_floor.json
https://s3.yunseong.dev/maechuri/objects/wood_floor.json
https://s3.yunseong.dev/maechuri/objects/cook_1.json
https://s3.yunseong.dev/maechuri/objects/player.json
```
