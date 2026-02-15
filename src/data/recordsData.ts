import type { RecordsData } from "../types/record";

// Mock data for records that can be referenced in chat
export const mockRecordsData: RecordsData = {
  records: [
    {
      id: "10",
      type: "CLUE",
      name: "눈물 젖은 빵",
      content: "피해자가 마지막으로 먹었던 것으로 보이는 빵. 눈물 자국이 있다.",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"
    },
    {
      id: "11",
      type: "NPC",
      name: "홍길동",
      content: "주방장. 사건 당시 주방에 있었다고 주장한다.",
      imageUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400"
    },
    {
      id: "12",
      type: "CLUE",
      name: "피 묻은 칼",
      content: "주방에서 발견된 칼. 피가 묻어있다.",
      imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400"
    },
    {
      id: "13",
      type: "NPC",
      name: "김철수",
      content: "웨이터. 사건 당시 식당에서 손님을 응대하고 있었다.",
      imageUrl: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400"
    },
    {
      id: "14",
      type: "FACT",
      name: "시간대 확인",
      content: "사건은 저녁 8시에서 9시 사이에 발생한 것으로 추정된다."
    }
  ]
};
