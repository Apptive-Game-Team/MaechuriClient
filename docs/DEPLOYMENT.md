# CI/CD 배포 가이드

## 개요
이 프로젝트는 GitHub Actions를 사용하여 자동으로 GitHub Pages에 배포됩니다.

## 자동 배포 프로세스

### 배포 트리거
- `main` 브랜치에 푸시할 때 자동으로 배포가 시작됩니다.
- 수동으로 배포하려면 GitHub Actions 탭에서 "Deploy to GitHub Pages" 워크플로우를 실행할 수 있습니다.

### 배포 단계
1. **빌드 단계**
   - Node.js 20 환경 설정
   - 의존성 설치 (`npm ci`)
   - TypeScript 컴파일 및 Vite 빌드
   - 빌드 결과물(dist)을 아티팩트로 업로드

2. **배포 단계**
   - GitHub Pages에 빌드 결과물 배포
   - 배포 URL은 워크플로우 실행 후 확인 가능

## 초기 설정

### GitHub Pages 활성화
1. GitHub 리포지토리 설정으로 이동
2. 'Pages' 섹션 선택
3. Source를 "GitHub Actions"로 설정

### Vite 설정
`vite.config.ts` 파일에서 `base` 옵션이 올바르게 설정되어 있어야 합니다:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/MaechuriClient/', // 리포지토리 이름과 일치
})
```

## 로컬 개발

### 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 빌드 테스트
```bash
npm run build
npm run preview
```

## 배포 확인
배포된 사이트는 다음 URL에서 확인할 수 있습니다:
`https://apptive-game-team.github.io/MaechuriClient/`

## 문제 해결

### 배포 실패 시
1. GitHub Actions 탭에서 워크플로우 실행 로그 확인
2. 빌드 오류가 있는지 확인
3. 로컬에서 `npm run build` 실행하여 빌드 가능 여부 확인

### 리소스 로딩 실패 시
- `vite.config.ts`의 `base` 설정이 올바른지 확인
- 리포지토리 이름과 base URL이 일치하는지 확인
