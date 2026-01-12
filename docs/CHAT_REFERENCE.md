# 대화창 Reference 기능

## 개요

대화창에서 단서(clue)나 용의자(suspect) 등의 기록(record)을 참조할 수 있는 기능을 구현했습니다. 사용자가 `:` 기호를 입력하면 자동완성 기능이 활성화되어 등록된 기록을 쉽게 참조할 수 있습니다.

## 주요 기능

### 1. 입력 제한
대화창 입력창에서는 다음 문자만 입력할 수 있습니다:
- 영문자 (a-z, A-Z)
- 한글 (가-힣) - **IME 조합 완전 지원**
- 숫자 (0-9)
- 콜론 (:)
- 공백

기타 특수문자는 자동으로 필터링됩니다.

### 2. Reference 자동완성

#### 자동완성 활성화
- `:` 기호를 입력하면 자동완성 드롭다운이 나타납니다
- `:` 뒤에 텍스트를 입력하면 해당 텍스트를 포함하는 기록만 필터링되어 표시됩니다
- 공백을 입력하면 자동완성이 닫힙니다
- **여러 개의 reference를 한 메시지에 삽입 가능**

#### 자동완성 사용 방법
1. **키보드 사용**:
   - `↑` / `↓` : 항목 선택 이동
   - `Enter` : 선택한 항목 삽입
   - `Esc` : 자동완성 닫기

2. **마우스 사용**:
   - 항목을 클릭하여 삽입

### 3. Reference 표시

#### 입력창
- 선택된 reference는 파란색 박스로 표시됩니다
- 박스 안에는 기록의 이름이 표시됩니다
- 박스는 편집이 불가능하며 하나의 단위로 취급됩니다
- **한 메시지에 여러 개의 reference 삽입 가능**

#### 메시지
- 전송된 메시지에서도 reference는 파란색 박스로 렌더링됩니다
- 사용자와 NPC 메시지 모두에서 reference를 확인할 수 있습니다

### 4. 저장 형식

Reference는 다음 형식으로 저장됩니다:
```
[type-id]
```

예시:
- `[clue-10]` : ID가 10인 단서
- `[suspect-11]` : ID가 11인 용의자
- `여기 [clue-10]을 보고 [suspect-11]과 대화하세요` : 여러 개의 reference

### 5. 플레이어 이동 제어
- **대화창이 열려 있을 때는 플레이어 이동이 비활성화됩니다**
- 방향키 (↑↓←→)와 WASD 키가 대화창에서 차단됩니다
- 대화창을 닫으면 정상적으로 플레이어를 이동할 수 있습니다

## 데이터 구조

### Record 타입
```typescript
export type RecordType = 'clue' | 'suspect';

export interface Record {
  id: string;
  type: RecordType;
  name: string;
}

export interface RecordsData {
  records: Record[];
}
```

### Mock 데이터
현재 다음과 같은 mock 데이터를 사용합니다 (`src/data/recordsData.ts`):
```typescript
{
  records: [
    {
      id: "10",
      type: "clue",
      name: "눈물 젖은 빵"
    },
    {
      id: "11",
      type: "suspect",
      name: "홍길동"
    },
    {
      id: "12",
      type: "clue",
      name: "피 묻은 칼"
    },
    {
      id: "13",
      type: "suspect",
      name: "김철수"
    }
  ]
}
```

## 확장성

### 새로운 Record 추가
`src/data/recordsData.ts` 파일의 `mockRecordsData` 배열에 새로운 record를 추가할 수 있습니다:

```typescript
{
  id: "14",
  type: "clue",
  name: "새로운 단서"
}
```

### 새로운 Record 타입 추가
1. `src/types/record.ts`에서 `RecordType` 타입에 새로운 타입 추가:
```typescript
export type RecordType = 'clue' | 'suspect' | 'location';
```

2. 해당 타입의 record를 `recordsData.ts`에 추가

### 동적 데이터 로딩
향후 백엔드 API와 연동하여 동적으로 record를 로드할 수 있도록 확장 가능합니다:
- `ChatModal` 컴포넌트에 `records` prop 추가
- API를 통해 실시간으로 record 목록 업데이트

## 스타일링

### CSS 클래스

- `.chat-modal-input-editable`: contentEditable 기반 입력창
- `.reference-tag`: 입력창 내 reference 박스
- `.reference-tag-display`: 메시지 내 reference 박스
- `.autocomplete-dropdown`: 자동완성 드롭다운
- `.autocomplete-item`: 자동완성 항목
- `.autocomplete-type`: 자동완성 항목의 타입 표시
- `.autocomplete-name`: 자동완성 항목의 이름 표시

### 커스터마이징
`src/components/ChatModal/ChatModal.css`에서 색상, 크기, 간격 등을 수정할 수 있습니다.

## 구현 세부사항

### contentEditable 사용
일반 `<input>` 태그 대신 `contentEditable` div를 사용하여:
- Reference를 HTML 요소로 렌더링
- 복잡한 입력 컨텐츠 관리
- 실시간 입력 필터링 및 포맷팅
- **여러 개의 reference를 혼합하여 사용 가능**

### 한글 입력 (IME) 지원
- `compositionStart`, `compositionEnd` 이벤트를 사용하여 한글 조합 중인 상태를 추적
- 조합 중에는 입력 필터링과 Enter 키 처리를 일시 중지
- 조합이 완료되면 정상적으로 필터링 및 자동완성 작동

### 커서 위치 추적
- `getCursorPosition()` 함수로 contentEditable 내의 정확한 커서 위치 계산
- 기존 reference 요소를 고려한 전체 텍스트 길이 계산
- 여러 개의 reference가 있어도 정확한 위치에 새 reference 삽입

### 플레이어 이동 비활성화
- 대화창이 열려 있을 때 `keydown` 이벤트를 캡처 단계에서 가로챔
- 게임 컨트롤 키 (방향키, WASD, Space, E)를 `stopPropagation()`으로 차단
- 대화창이 닫히면 자동으로 이벤트 리스너 제거

### Reference 변환
1. **입력 시**: 사용자가 선택한 record를 `<span class="reference-tag">` 요소로 삽입
2. **전송 시**: HTML 요소를 `[type-id]` 형식의 텍스트로 변환
3. **표시 시**: `[type-id]` 텍스트를 파싱하여 박스 형태로 렌더링

## 사용 예시

### 단일 Reference
1. 대화창에서 `:눈` 입력
2. "눈물 젖은 빵" 단서가 드롭다운에 표시됨
3. 화살표 키로 선택하거나 클릭
4. 파란색 박스로 "눈물 젖은 빵" 표시
5. 메시지 전송
6. 서버에는 "[clue-10]"이 포함된 텍스트로 전송됨
7. 메시지 목록에서 파란색 박스로 렌더링됨

### 여러 개의 Reference
1. "여기 :눈" 입력 → "눈물 젖은 빵" 선택
2. "을 보고 :홍" 입력 → "홍길동" 선택
3. "과 대화했어요" 입력
4. 결과: "여기 [눈물 젖은 빵] 을 보고 [홍길동] 과 대화했어요"
5. 서버 전송: "여기 [clue-10] 을 보고 [suspect-11] 과 대화했어요"

### 한글 입력
1. `:ㅎㅗㅇ` 입력 (조합 중)
2. 조합 완료 → `:홍`
3. "홍길동" 드롭다운에 표시
4. 선택하여 삽입
