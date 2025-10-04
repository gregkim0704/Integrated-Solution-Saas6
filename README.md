# 통합 콘텐츠 생성기 - AI 기반 마케팅 자동화

## 🚀 프로젝트 개요

**통합 콘텐츠 생성기**는 하나의 제품 설명만으로 블로그 글, 소셜 그래픽, 프로모션 비디오, 팟캐스트 콘텐츠를 동시에 생성하는 혁신적인 AI 기반 마케팅 자동화 플랫폼입니다.

### 🎯 핵심 가치 제안
- **시간 효율성**: 하나의 입력으로 4가지 미디어 동시 생성
- **일관성 유지**: 브랜드 메시지의 일관성 보장  
- **멀티채널 마케팅**: 다양한 플랫폼 대응
- **AI 기반 자동화**: 인적 리소스 최적화

### 🏗️ 주요 기능
1. **📝 블로그 글 생성**: SEO 최적화된 마케팅 블로그 포스트
2. **🎨 소셜 그래픽 생성**: 다양한 스타일의 소셜 미디어 그래픽
3. **🎬 프로모션 비디오 생성**: 15-60초 길이의 마케팅 비디오
4. **🎙️ 팟캐스트 콘텐츠 생성**: 스크립트 및 음성 오디오

## 🔗 URL 정보

### 📍 서비스 URL
- **개발 서버**: https://3000-ii2r9cghlz8eugsdrd3il-6532622b.e2b.dev
- **Health Check**: https://3000-ii2r9cghlz8eugsdrd3il-6532622b.e2b.dev/api/health

### 🔌 API 엔드포인트

#### 통합 콘텐츠 생성
```
POST /api/generate-content
Content-Type: application/json

{
  "productDescription": "제품 설명",
  "options": {
    "imageStyle": "modern|minimal|vibrant|professional",
    "videoDuration": 15|30|60,
    "voice": "professional|friendly|energetic",
    "language": "ko|en"
  }
}
```

#### 개별 콘텐츠 생성
- `POST /api/generate-blog` - 블로그 글 생성
- `POST /api/generate-image` - 소셜 그래픽 생성  
- `POST /api/generate-video` - 프로모션 비디오 생성
- `POST /api/generate-podcast` - 팟캐스트 콘텐츠 생성

#### 시스템 정보
- `GET /api/health` - 서비스 상태 확인
- `GET /api/stats` - 사용 통계

## 🏗️ 데이터 아키텍처

### 📊 데이터 모델
```typescript
interface ContentGenerationResult {
  blog: {
    title: string;
    content: string;
    tags: string[];
    seoKeywords: string[];
    readingTime: number;
  };
  socialGraphic: {
    imageUrl: string;
    description: string;
    dimensions: string;
  };
  promoVideo: {
    videoUrl: string;
    duration: number;
    description: string;
    thumbnail?: string;
  };
  podcast: {
    scriptText: string;
    audioUrl: string;
    duration: number;
    description: string;
  };
  generatedAt: string;
  productDescription: string;
  processingTime: number;
}
```

### 🗄️ 스토리지 서비스
- **Cloudflare Workers**: 서버리스 백엔드 로직
- **Cloudflare Pages**: 정적 파일 호스팅
- **외부 AI API**: 실제 콘텐츠 생성 (향후 연동)

## 📱 사용자 가이드

### 1️⃣ 기본 사용법
1. 웹 페이지 접속
2. 제품 설명 입력 (예: "스마트 워치 - 건강 모니터링과 피트니스 추적을 위한 차세대 웨어러블 디바이스")
3. 생성 옵션 설정 (이미지 스타일, 비디오 길이, 음성 타입 등)
4. "전체 콘텐츠 생성" 버튼 클릭
5. 실시간 진행 상태 확인
6. 생성 완료 후 각 콘텐츠 다운로드

### 2️⃣ 개별 콘텐츠 생성
- 특정 타입의 콘텐츠만 필요한 경우
- 블로그만, 이미지만, 비디오만, 팟캐스트만 개별 생성 가능
- 빠른 테스트 및 미리보기 용도

### 3️⃣ API 활용
```bash
# 통합 콘텐츠 생성 예제
curl -X POST https://3000-ii2r9cghlz8eugsdrd3il-6532622b.e2b.dev/api/generate-content \
-H "Content-Type: application/json" \
-d '{
  "productDescription": "스마트 워치 - 건강 모니터링과 피트니스 추적을 위한 차세대 웨어러블 디바이스",
  "options": {
    "imageStyle": "modern",
    "videoDuration": 30,
    "voice": "professional",
    "language": "ko"
  }
}'
```

## 🚀 배포 정보

### 💻 기술 스택
- **Backend**: Hono + TypeScript
- **Frontend**: Vanilla JavaScript + TailwindCSS  
- **Runtime**: Cloudflare Workers
- **Hosting**: Cloudflare Pages
- **Build Tool**: Vite

### 📋 배포 상태
- **플랫폼**: Cloudflare Pages (준비 완료)
- **상태**: ✅ 개발 서버 활성화
- **마지막 업데이트**: 2025-10-04

### 🔧 로컬 개발

#### Linux/Mac 환경
```bash
# 프로젝트 클론 후
npm install
npm run build
npm run dev:sandbox  # 샌드박스 환경
```

#### Windows 환경
```powershell
# 의존성 충돌 해결
npm install --legacy-peer-deps

# 빌드 및 실행
npm run build
npm run dev:local

# 또는 한 번에 실행
npm start
```

**Windows 사용자**: 
- 📋 자세한 설정: [WINDOWS-SETUP.md](./WINDOWS-SETUP.md)
- 🚀 자동 설정: `.\scripts\setup-windows.ps1` (PowerShell)
- 📱 간편 실행: `scripts\start-server.bat` (더블클릭)

## 🎨 현재 구현된 기능

### ✅ 완료된 기능
- [x] 제품 설명 분석 및 키워드 추출
- [x] 블로그 포스트 구조화 생성
- [x] SEO 최적화된 제목 및 태그 생성
- [x] 소셜 그래픽 프롬프트 생성
- [x] 비디오 시나리오 및 프롬프트 생성
- [x] 팟캐스트 스크립트 생성
- [x] 반응형 웹 인터페이스
- [x] 실시간 진행 상태 표시
- [x] API 엔드포인트 (4개 타입)
- [x] 에러 핸들링 및 로깅

### 🚧 향후 구현 예정
- [ ] 실제 AI API 연동 (이미지, 비디오, 오디오 생성)
- [ ] 사용자 계정 및 인증 시스템
- [ ] 생성 이력 저장 및 관리
- [ ] 콘텐츠 템플릿 시스템
- [ ] 다국어 지원 확장
- [ ] 고급 브랜딩 옵션
- [ ] 배치 처리 시스템
- [ ] 실시간 협업 기능

## 📊 예상 사업화 방안

### 🎯 타겟 고객
1. **중소기업 마케팅 담당자**: 리소스 부족한 마케팅 팀
2. **프리랜서/에이전시**: 콘텐츠 제작 서비스 제공업체
3. **전자상거래 업체**: 제품 마케팅 자동화 필요
4. **스타트업**: 비용 효율적인 마케팅 솔루션 필요

### 💰 수익 모델
1. **구독 기반 SaaS**: 월/연 단위 구독료
2. **사용량 기반**: 생성 콘텐츠 수량별 과금  
3. **프리미엄 기능**: 고급 템플릿, 브랜딩 옵션
4. **API 라이센스**: 타사 플랫폼 연동

### 🚀 성장 전략
1. **MVP 검증**: 현재 기능으로 시장 반응 테스트
2. **AI API 연동**: 실제 콘텐츠 생성 품질 향상
3. **사용자 피드백**: 기능 개선 및 확장
4. **파트너십**: 마케팅 도구 업체와 제휴
5. **글로벌 확장**: 다국어 지원 및 해외 시장 진출

## 📞 연락처

**한국인프라연구원(주)**
- 📧 Email: infrastructure@kakao.com  
- 📱 Phone: 010-9143-0800
- 🌐 Service: https://3000-ii2r9cghlz8eugsdrd3il-6532622b.e2b.dev

---

> 이 프로젝트는 AI 기반 마케팅 자동화의 혁신적인 접근을 통해 콘텐츠 제작의 패러다임을 변화시키고자 합니다. 하나의 제품 설명만으로 다양한 형태의 고품질 마케팅 콘텐츠를 동시에 생성함으로써, 마케팅 효율성과 일관성을 극대화하는 것이 목표입니다.