# 기여 가이드 (Contributing Guide)

AI 기반 통합 콘텐츠 생성기 프로젝트에 기여해주셔서 감사합니다!

## 🤝 기여 방법

### 1️⃣ 이슈 제출
- 버그 리포트
- 기능 요청
- 개선 제안

### 2️⃣ Pull Request 제출
1. Fork 저장소
2. 새 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m '새 기능 추가'`)
4. 브랜치에 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

## 📝 코딩 컨벤션

### TypeScript/JavaScript
- ESLint 및 Prettier 사용
- 함수와 변수명은 camelCase
- 상수는 UPPER_SNAKE_CASE
- 클래스는 PascalCase

### Git 커밋 메시지
```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 기타 작업
```

## 🧪 테스트

### 로컬 개발 환경
```bash
npm install
npm run build
npm run dev:sandbox
```

### API 테스트
```bash
# Health check
curl http://localhost:3000/api/health

# Content generation
curl -X POST http://localhost:3000/api/generate-content \
-H "Content-Type: application/json" \
-d '{"productDescription": "테스트 제품"}'
```

## 📋 개발 체크리스트

- [ ] 코드가 빌드 오류 없이 컴파일됨
- [ ] 기존 테스트가 모두 통과함
- [ ] 새로운 기능에 대한 테스트 추가
- [ ] 문서 업데이트 (필요시)
- [ ] 타입 정의 추가 (TypeScript)

## 🚀 배포 프로세스

1. **개발**: feature 브랜치에서 개발
2. **테스트**: PR 생성 시 자동 테스트 실행
3. **리뷰**: 코드 리뷰 및 승인
4. **병합**: main 브랜치로 병합
5. **배포**: Cloudflare Pages 자동 배포

## 📞 연락처

질문이나 제안사항이 있으시면 언제든 연락해주세요:

**한국인프라연구원(주)**
- 📧 Email: infrastructure@kakao.com
- 📱 Phone: 010-9143-0800

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조해주세요.

---

함께 혁신적인 AI 마케팅 자동화 플랫폼을 만들어갑시다! 🚀