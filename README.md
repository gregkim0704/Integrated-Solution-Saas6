# AI 기반 통합 콘텐츠 생성 플랫폼

## 프로젝트 개요
- **이름**: 통합 콘텐츠 생성기
- **목표**: 하나의 제품 설명으로 블로그, 소셜 그래픽, 프로모션 비디오, 팟캐스트를 동시에 생성하는 AI 기반 마케팅 자동화
- **핵심 가치**: 마케팅 워크플로우 혁신, 콘텐츠 제작 시간 단축, 일관된 브랜딩

## 🚀 현재 완료된 기능 (3/8 완성)

### ✅ 1. 실제 AI API 연동
- **GenSpark AI 도구 통합**: 이미지, 비디오, 오디오 생성
- **실제 AI 서비스**: image_generation, video_generation, audio_generation 도구 활용
- **성능 모니터링**: AI 호출 성공률, 처리 시간, 실패 추적
- **폴백 시스템**: AI 서비스 실패 시 목업 데이터 제공

### ✅ 2. 사용자 계정 및 인증 시스템
- **JWT 기반 인증**: 액세스/리프레시 토큰 시스템
- **역할 기반 접근 제어**: admin, premium, user 역할
- **보안 미들웨어**: 인증, 권한, 속도 제한, 사용량 쿼터
- **테스트 사용자**: 다양한 역할의 사전 생성된 테스트 계정
- **브루트포스 방지**: 로그인 실패 추적 및 제한

### ✅ 3. 생성 이력 저장 및 관리
- **Cloudflare D1 데이터베이스**: 통합 및 개별 생성 이력 저장
- **통계 대시보드**: 사용자별 생성 통계, 성공률, 콘텐츠 타입 분석
- **고급 필터링**: 날짜별, 상태별, 콘텐츠 타입별 검색
- **페이지네이션**: 효율적인 대용량 데이터 처리
- **상세 보기**: 생성 결과 및 메타데이터 상세 조회
- **데이터 내보내기**: CSV 형태로 이력 데이터 내보내기
- **사용량 추적**: 기능별 월간 사용량 모니터링

## 🔄 진행 예정 기능 (5개 남음)

### 4. 콘텐츠 템플릿 시스템
- 업계별/목적별 사전 정의된 템플릿
- 사용자 정의 템플릿 생성 및 저장
- 템플릿 공유 및 마켓플레이스

### 5. 영어와 일본어 지원 확장
- 다국어 인터페이스 (한국어/영어/일본어)
- 언어별 AI 프롬프트 최적화
- 지역별 문화 맥락 반영

### 6. 고급 브랜딩 옵션
- 브랜드 가이드라인 설정
- 로고 및 색상 팔레트 통합
- 일관된 브랜드 톤앤매너 적용

### 7. 배치 처리 시스템
- 대량 콘텐츠 생성 큐 시스템
- 스케줄링 및 자동화
- 진행 상황 모니터링

### 8. 실시간 협업 기능
- 팀 워크스페이스
- 실시간 편집 및 피드백
- 승인 워크플로우

## 🌐 실제 배포 URL
- **프로덕션**: https://3000-iy97ehumbpg1ba4kvmlcw-6532622b.e2b.dev
- **GitHub**: https://github.com/gregkim0704/Integrated-Solution-Saas2

## 📊 데이터 아키텍처

### 데이터 모델
```sql
-- 사용자 관리
users: id, email, name, role, plan, created_at, updated_at

-- 통합 콘텐츠 생성 이력
content_generations: 
  - 기본 정보: id, user_id, product_description, status
  - 블로그: blog_title, blog_content, blog_tags, blog_seo_keywords
  - 소셜 그래픽: social_graphic_url, social_graphic_description
  - 프로모션 비디오: promo_video_url, promo_video_duration
  - 팟캐스트: podcast_script, podcast_audio_url
  - 메타데이터: processing_time, real_ai_used, created_at

-- 개별 생성 이력
individual_generations: id, user_id, content_type, content_data

-- 사용량 추적
user_usage: id, user_id, feature, usage_count, quota_limit, reset_date
```

### 저장 서비스
- **Cloudflare D1**: 관계형 데이터 (사용자, 이력, 통계)
- **AI Drive**: 생성된 미디어 파일 저장
- **JWT 토큰**: 인증 정보 관리

## 📋 주요 API 엔드포인트

### 인증 관련
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/refresh` - 토큰 새로고침
- `POST /api/auth/logout` - 로그아웃

### 콘텐츠 생성
- `POST /api/generate-content` - 통합 콘텐츠 생성
- `POST /api/generate-blog` - 블로그만 생성
- `POST /api/generate-image` - 이미지만 생성
- `POST /api/generate-video` - 비디오만 생성
- `POST /api/generate-podcast` - 팟캐스트만 생성

### 이력 관리
- `GET /api/history` - 생성 이력 조회 (페이지네이션, 필터 지원)
- `GET /api/history/stats` - 사용자 통계
- `GET /api/history/:id` - 특정 생성 상세 조회
- `DELETE /api/history/:id` - 생성 이력 삭제
- `GET /api/usage` - 사용량 현황

### 관리자 기능
- `GET /api/admin/users` - 사용자 목록
- `PUT /api/admin/users/:id/role` - 사용자 역할 변경
- `GET /api/admin/stats` - 전체 시스템 통계

## 🎯 사용자 가이드

### 1. 계정 생성 및 로그인
1. 우측 상단 "로그인" 버튼 클릭
2. 신규 사용자는 "회원가입" 탭에서 계정 생성
3. 이메일/비밀번호로 로그인

### 2. 통합 콘텐츠 생성
1. "콘텐츠 생성" 탭에서 제품 설명 입력
2. 생성 옵션 설정 (이미지 스타일, 비디오 길이 등)
3. "모든 콘텐츠 생성" 버튼 클릭
4. AI가 블로그, 이미지, 비디오, 팟캐스트를 동시 생성

### 3. 생성 이력 관리
1. "생성 이력" 탭으로 이동
2. 통계 대시보드에서 사용 현황 확인
3. 필터 옵션으로 원하는 이력 검색
4. 상세 보기로 생성 결과 확인
5. CSV 내보내기로 데이터 백업

### 4. 계정 관리
1. "계정 관리" 탭에서 프로필 정보 확인
2. 사용량 현황 모니터링
3. 계정 데이터 관리

## 🚀 배포 정보
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 활성화
- **기술 스택**: 
  - **백엔드**: Hono + TypeScript + Cloudflare Workers
  - **프론트엔드**: Vanilla JavaScript + TailwindCSS
  - **데이터베이스**: Cloudflare D1 (SQLite)
  - **인증**: JWT + bcrypt
  - **AI 서비스**: GenSpark AI Tools
- **마지막 업데이트**: 2025-01-15

## 🔧 개발 환경 설정

### 로컬 개발
```bash
# 의존성 설치
npm install

# D1 데이터베이스 마이그레이션
npm run db:migrate:local

# 개발 서버 시작
npm run dev

# 또는 PM2로 시작 (권장)
npm run build
pm2 start ecosystem.config.cjs
```

### 테스트 계정
```
관리자: admin@test.com / admin123!@#
프리미엄: premium@test.com / premium123!@#  
일반 사용자: user@test.com / user123!@#
```

---

**한국인프라연구원(주)** | infrastructure@kakao.com | 010-9143-0800

> 이 프로젝트는 AI 기반 마케팅 자동화를 통해 콘텐츠 제작의 혁신을 목표로 합니다. 단순한 도구를 넘어 전체 마케팅 워크플로우를 변화시키는 통합 솔루션을 지향합니다.