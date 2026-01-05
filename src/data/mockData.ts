import type { ScenarioData } from "../types/map";

export const mockScenarioData: ScenarioData = {
  createdDate: "2025-12-22",
  scenarioId: 1,
  scenarioName: "요리사 3인방의 사건 현장",
  map: {
    layers: [
      {
        orderInLayer: 1,
        name: "floor",
        type: ["Non-Interactable", "Passable"],
        tileMap: [
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
        ]
      },
      {
        orderInLayer: 2,
        name: "wall",
        type: ["Non-Interactable", "Non-Passable", "Blocks-Vision"],
        tileMap: [
          [1, 1, 1, 1, 1, 1, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 0, 0, 0, 0, 0, 1],
          [1, 1, 1, 1, 1, 1, 1],
        ]
      },
      {
        orderInLayer: 3,
        name: "interactable-objects",
        type: ["Interactable", "Non-Passable", "Blocks-Vision"],
        tileMap: [
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 100, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 100, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
        ]
      }
    ],
    objects: [
      {
        id: 0,
        objectUrl: "https://s3.yunseong.dev/maechuri/objects/tile_floor.json"
      },
      {
        id: 1,
        objectUrl: "https://s3.yunseong.dev/maechuri/objects/wood_floor.json"
      },
      {
        id: 100,
        objectUrl: "https://s3.yunseong.dev/maechuri/objects/cook_1.json"
      }
    ],
    playerObjectUrl: "https://s3.yunseong.dev/maechuri/objects/player.json"
  }
};
