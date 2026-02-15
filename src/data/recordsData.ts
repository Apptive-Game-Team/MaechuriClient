import type { RecordsData } from "../types/record";

// Mock data for records that can be referenced in chat
// Note: In production, imageUrl should come from the map data's asset URLs
export const mockRecordsData: RecordsData = {
  records: [
    {
      id: "c:1",
      type: "CLUE",
      name: "피 묻은 칼",
      content: "주방에서 발견된 칼. 피가 묻어있다."
    },
    {
      id: "s:1",
      type: "NPC",
      name: "홍길동",
      content: "주방장. 사건 당시 주방에 있었다고 주장한다."
    },
    {
      id: "f:1",
      type: "FACT",
      name: "시간대 확인",
      content: "사건은 저녁 8시에서 9시 사이에 발생한 것으로 추정된다."
    }
  ]
};
