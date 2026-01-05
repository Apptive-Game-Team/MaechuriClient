# 매추리 클라이언트 (Maechuri Client)

이 프로젝트는 React, TypeScript 및 `react-game-engine`을 사용하여 구축된 2D 게임 클라이언트입니다.

## ✨ 주요 기능

-   **ECS (Entity-Component-System) 아키텍처**: `react-game-engine`을 활용한 유연하고 확장 가능한 게임 구조.
-   **타일 기반 맵 렌더링**: 여러 레이어로 구성된 맵을 동적으로 렌더링합니다.
-   **플레이어 이동 및 조작**: 키보드 입력에 따른 상하좌우 이동.
-   **충돌 감지**: 벽, 비통과(Non-Passable) 오브젝트 등과의 충돌을 처리합니다.
-   **상호작용 시스템**: 플레이어가 특정 오브젝트와 상호작용할 수 있는 기반을 제공합니다.
-   **동적 에셋 로딩**: 시나리오에 정의된 에셋(이미지, JSON)을 비동기적으로 로드합니다.
-   **전쟁 안개 (Fog of War)**: 플레이어의 시야를 기준으로 맵을 밝히는 기능을 구현했습니다.
-   **맵 오브젝트**: 캐릭터, 아이템 등 타일이 아닌 독립적인 개체를 맵에 배치하고 관리합니다.

## 📂 폴더 구조

프로젝트의 주요 폴더 구조는 다음과 같습니다.

```
/src
├───assets/         # 정적 에셋 (이미지 등)
├───components/     # React 컴포넌트 (메인 화면, 게임 화면 등)
│   ├───GameScreen/ # 게임 화면 관련 컴포넌트, 훅, 시스템
│   └───MainScreen/ # 메인 메뉴 화면
├───data/           # 목(mock) 데이터 (시나리오, 맵 정보)
├───systems/        # 게임 로직을 처리하는 시스템 (ECS)
├───hooks/          # 재사용 가능한 커스텀 훅
├───types/          # TypeScript 타입 정의
└───utils/          # 유틸리티 함수
/docs               # 프로젝트 관련 문서
```

## 🚀 시작하기

### 사전 요구 사항

-   [Node.js](https://nodejs.org/) (v18 이상 권장)
-   [npm](https://www.npmjs.com/) 또는 [yarn](https://yarnpkg.com/)

### 설치 및 실행

1.  **의존성 설치**:
    ```bash
    npm install
    ```

2.  **개발 서버 실행**:
    ```bash
    npm run dev
    ```
    서버가 실행되면 브라우저에서 `http://localhost:5173` (또는 다른 포트)으로 접속할 수 있습니다.

## 📜 사용 가능한 스크립트

`package.json`에 정의된 주요 스크립트는 다음과 같습니다.

-   `npm run dev`: Vite 개발 서버를 실행합니다.
-   `npm run build`: TypeScript 컴파일 및 Vite 프로덕션 빌드를 실행합니다.
-   `npm run lint`: ESLint를 사용하여 코드 스타일을 검사합니다.
-   `npm run preview`: 프로덕션 빌드 결과물을 미리 봅니다.

## 💡 핵심 개념

### ECS (Entity-Component-System)

이 프로젝트는 `react-game-engine` 라이브러리를 통해 ECS 패턴을 따릅니다.

-   **엔티티 (Entity)**: 게임 세계의 모든 객체입니다 (플레이어, 타일, 오브젝트 등).
-   **컴포넌트 (Component)**: 엔티티에 부착되는 데이터 덩어리입니다 (위치, 속도, 체력 등). `renderers.tsx`에서 렌더링 로직을 담당합니다.
-   **시스템 (System)**: 엔티티와 컴포넌트의 데이터를 기반으로 게임의 로직을 실행합니다 (이동, 충돌 처리 등). `systems` 폴더에 정의되어 있습니다.

### 시나리오 데이터

게임의 모든 데이터(맵, 오브젝트, 에셋)는 `ScenarioData` 타입으로 구조화되어 있으며, 현재는 `src/data/mockData.ts` 파일에서 목 데이터를 사용하고 있습니다. 이 구조를 통해 다양한 시나리오를 쉽게 추가하고 관리할 수 있습니다.

### 에셋 로딩

게임에 필요한 에셋은 `useAssetLoader` 훅을 통해 동적으로 로드됩니다. 에셋은 단순 이미지일 수도 있고, 캐릭터의 방향에 따라 다른 이미지를 정의하는 JSON 파일일 수도 있습니다. 자세한 내용은 `docs/ASSET_LOADING.md` 문서를 참고하세요.