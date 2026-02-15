# Documentation Index

이 디렉토리는 **기록 시각화 모달(RecordsModal)** 구현을 위한 코드베이스 분석 문서를 포함합니다.

---

## 📋 문서 목록

### 🚀 빠른 시작
1. **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** (한국어)
   - **가장 먼저 읽어야 할 문서**
   - 단계별 구현 가이드
   - 코드 예제와 함께 제공
   - 문제 해결 팁 포함

### 📊 상세 분석
2. **[codebase-analysis-for-records-modal.md](./codebase-analysis-for-records-modal.md)** (한국어)
   - 전체 코드베이스 분석
   - 각 시스템별 상세 설명
   - 구현 체크리스트
   - 성능 최적화 가이드

3. **[EXPLORATION_SUMMARY.md](./EXPLORATION_SUMMARY.md)** (English)
   - Quick reference guide in English
   - Project structure overview
   - Implementation checklist
   - Key files reference

### 🏗️ 아키텍처
4. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** (Bilingual)
   - 컴포넌트 계층 구조
   - 데이터 흐름 다이어그램
   - 이벤트 타임라인
   - 파일 구조 설계

---

## 🎯 RecordsModal 기능 요구사항

### 핵심 기능
- ✅ **'r' 키로 모달 열기/닫기**
- ✅ **3가지 타입 기록 표시**: Clue, Suspect, Fact
- ✅ **드래그 앤 드롭**: 자유롭게 카드 위치 이동
- ✅ **위치 영속화**: localStorage에 위치 저장
- ✅ **API 통합**: 서버에서 기록 데이터 가져오기

### 추가 기능 (선택)
- ⬜ 필터 기능 (타입별)
- ⬜ 검색 기능
- ⬜ 상세 정보 패널
- ⬜ 연결선 그리기
- ⬜ 메모 추가

---

## 📚 기존 프로젝트 문서

이 리포지토리에는 기존 프로젝트 관련 문서도 포함되어 있습니다:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 전체 프로젝트 아키텍처
- **[API_INTEGRATION.md](./API_INTEGRATION.md)** - API 통합 가이드
- **[CHAT_REFERENCE.md](./CHAT_REFERENCE.md)** - 채팅 참조 기능
- **[FOG_OF_WAR.md](./FOG_OF_WAR.md)** - Fog of War 시스템
- **[MAP_OBJECTS.md](./MAP_OBJECTS.md)** - 맵 오브젝트
- **[SOLVE_UI.md](./SOLVE_UI.md)** - 해결 UI
- **[ASSET_LOADING.md](./ASSET_LOADING.md)** - 에셋 로딩
- **[CONVENIENCE_FEATURES.md](./CONVENIENCE_FEATURES.md)** - 편의 기능
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 배포 가이드

---

## 🛠️ 기술 스택 요약

| 카테고리 | 기술 |
|---------|-----|
| **Framework** | React 19.2.0 |
| **Language** | TypeScript |
| **Build Tool** | Vite 7.2.4 |
| **Game Engine** | react-game-engine 1.2.0 |
| **State Management** | React Context API |
| **HTTP Client** | Native Fetch API |
| **Drag & Drop** | @dnd-kit (구현 예정) |

---

## 📖 읽는 순서 추천

### 처음 시작하는 경우
1. **QUICK_START_GUIDE.md** - 빠른 시작 가이드
2. **ARCHITECTURE_DIAGRAM.md** - 아키텍처 이해
3. 코드 구현 시작!

### 상세하게 이해하고 싶은 경우
1. **EXPLORATION_SUMMARY.md** - 전체 개요 파악
2. **codebase-analysis-for-records-modal.md** - 상세 분석
3. **ARCHITECTURE_DIAGRAM.md** - 아키텍처 다이어그램
4. **QUICK_START_GUIDE.md** - 구현 가이드

### 특정 기능만 참고하고 싶은 경우
- **Modal 구현**: QUICK_START_GUIDE.md → Section 3
- **API 통합**: codebase-analysis-for-records-modal.md → Section 6
- **드래그 앤 드롭**: ARCHITECTURE_DIAGRAM.md → "Drag & Drop Flow"
- **위치 저장**: QUICK_START_GUIDE.md → Section 2.2

---

## 🔍 주요 발견 사항

### ✅ 이미 구현된 것
- React Context 기반 RecordsContext
- 재사용 가능한 Modal 컴포넌트
- 키보드 이벤트 핸들링 시스템
- API 통신 인프라 (apiFetch)
- 이미지 로딩 유틸리티

### ❌ 구현 필요한 것
- 드래그 앤 드롭 라이브러리 (@dnd-kit)
- RecordsModal 컴포넌트
- 위치 영속화 유틸리티
- 기록 API 엔드포인트 및 서비스 함수
- 'r' 키 핸들러

### ⚠️ 주의 사항
- 다른 모달 열려있을 때 'r' 키 무시 필요
- 입력 필드 포커스 시 키 이벤트 무시
- localStorage 용량 고려 (위치 데이터만 저장)
- 드래그 시 성능 최적화 (React.memo 사용)

---

## 💡 구현 팁

### 개발 순서
1. **Phase 1**: 기본 모달 구조 (1-2시간)
   - RecordsModal 컴포넌트
   - 'r' 키 핸들러
   - GameScreen 통합

2. **Phase 2**: 카드 표시 (2-3시간)
   - RecordCard 컴포넌트
   - 기본 레이아웃
   - 스타일링

3. **Phase 3**: 드래그 앤 드롭 (2-3시간)
   - @dnd-kit 설치
   - DndContext 설정
   - 드래그 핸들러

4. **Phase 4**: 영속화 (1-2시간)
   - localStorage 유틸리티
   - RecordsContext 확장
   - 위치 저장/로드

5. **Phase 5**: API 통합 (2-4시간)
   - API 엔드포인트 추가
   - 서비스 함수 구현
   - 로딩/에러 처리

### 디버깅 팁
```javascript
// 브라우저 콘솔에서 테스트
// 1. 현재 저장된 위치 확인
localStorage.getItem('maechuri_records_positions')

// 2. 위치 초기화
localStorage.removeItem('maechuri_records_positions')

// 3. RecordsContext 상태 확인
// React DevTools에서 RecordsProvider 찾기
```

---

## 🤝 기여 가이드

문서 개선이나 추가 예제가 필요한 경우:
1. 관련 문서 파일 수정
2. 명확하고 구체적인 예제 포함
3. 한국어와 영어 병행 작성 권장

---

## 📞 도움이 필요한 경우

### 문서 관련
- **QUICK_START_GUIDE.md**: 빠른 구현 가이드
- **codebase-analysis-for-records-modal.md**: 상세 분석

### 코드 참조
- **Modal**: `/src/components/common/Modal/Modal.tsx`
- **RecordsContext**: `/src/contexts/RecordsContext.tsx`
- **API**: `/src/services/api.ts`

### 외부 리소스
- [@dnd-kit 문서](https://docs.dndkit.com/)
- [React Context 가이드](https://react.dev/learn/passing-data-deeply-with-context)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

---

**문서 생성일**: 2025-01-15  
**버전**: 1.0  
**최종 업데이트**: 2025-01-15

---

## 📝 체크리스트

구현 시작 전 확인:
- [ ] QUICK_START_GUIDE.md 읽기
- [ ] @dnd-kit 설치
- [ ] RecordsContext 확장 계획
- [ ] API 엔드포인트 백엔드 팀과 확인

구현 중:
- [ ] Phase 1: 기본 모달 완료
- [ ] Phase 2: 카드 표시 완료
- [ ] Phase 3: 드래그 앤 드롭 완료
- [ ] Phase 4: 영속화 완료
- [ ] Phase 5: API 통합 완료

구현 후:
- [ ] 모든 테스트 케이스 통과
- [ ] 브라우저 호환성 확인
- [ ] 성능 최적화 완료
- [ ] 코드 리뷰 완료

---

**Happy Coding! 🚀**
