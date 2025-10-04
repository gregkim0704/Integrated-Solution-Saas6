# 배포 가이드

## 🚀 Cloudflare Pages 배포

이 프로젝트는 Cloudflare Pages에 최적화되어 있습니다.

### 🔧 사전 준비

1. **Cloudflare 계정** 생성 및 로그인
2. **Wrangler CLI** 설치
   ```bash
   npm install -g wrangler
   ```

3. **Cloudflare API 토큰** 생성
   - Cloudflare 대시보드 → My Profile → API Tokens
   - "Custom token" 생성
   - 권한: Zone:Zone:Read, Zone:Page Rule:Edit

### 📋 배포 단계

#### 1️⃣ 로컬 개발 환경 설정
```bash
# 프로젝트 클론
git clone https://github.com/gregkim0704/Integrated-Solution-Saas.git
cd Integrated-Solution-Saas

# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run build
npm run dev:sandbox
```

#### 2️⃣ Wrangler 인증
```bash
# API 토큰으로 인증
wrangler auth login

# 또는 환경변수로 설정
export CLOUDFLARE_API_TOKEN=your-api-token
```

#### 3️⃣ 프로젝트 생성
```bash
# Cloudflare Pages 프로젝트 생성
wrangler pages project create content-generator \
  --production-branch main \
  --compatibility-date 2024-01-01
```

#### 4️⃣ 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# Cloudflare Pages에 배포
wrangler pages deploy dist --project-name content-generator
```

### 🔐 환경 변수 설정

#### 개발 환경 (.dev.vars)
```bash
# .dev.vars 파일 생성
ENVIRONMENT=development
DEBUG=true
```

#### 프로덕션 환경
```bash
# Cloudflare Pages 환경 변수 설정
wrangler pages secret put ENVIRONMENT --project-name content-generator
# 입력: production

wrangler pages secret put API_VERSION --project-name content-generator  
# 입력: v1.0.0
```

### 🔗 커스텀 도메인 설정

```bash
# 커스텀 도메인 추가
wrangler pages domain add yourdomain.com --project-name content-generator

# DNS 설정 확인
wrangler pages domain list --project-name content-generator
```

## 🐳 Docker 배포 (선택사항)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

### Docker 명령어
```bash
# 이미지 빌드
docker build -t content-generator .

# 컨테이너 실행
docker run -p 3000:3000 content-generator
```

## ☁️ 기타 플랫폼 배포

### Vercel
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### Netlify
```bash
# Netlify CLI 설치  
npm i -g netlify-cli

# 배포
netlify deploy --prod --dir=dist
```

### AWS CloudFront + S3
```bash
# AWS CLI로 S3에 업로드
aws s3 sync dist/ s3://your-bucket-name

# CloudFront 캐시 무효화
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔄 CI/CD 파이프라인

### GitHub Actions (.github/workflows/deploy.yml)

이미 설정된 워크플로우가 다음 작업을 자동화합니다:

1. **트리거**: main 브랜치에 푸시 시
2. **빌드**: `npm run build` 실행
3. **배포**: Cloudflare Pages에 자동 배포
4. **알림**: 배포 상태 슬랙/이메일 알림

### 필요한 GitHub Secrets

Repository Settings → Secrets and variables → Actions에서 설정:

```
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## 📊 배포 후 확인사항

### ✅ 체크리스트

- [ ] Health check API 응답 확인
  ```bash
  curl https://your-domain.com/api/health
  ```

- [ ] 주요 기능 테스트
  ```bash
  # 블로그 생성 테스트
  curl -X POST https://your-domain.com/api/generate-blog \
    -H "Content-Type: application/json" \
    -d '{"productDescription": "테스트 제품"}'
  ```

- [ ] 성능 모니터링
  - 응답 시간 < 5초
  - 오류율 < 1%
  - 가용성 > 99.9%

### 📈 모니터링 설정

#### Cloudflare Analytics
1. Cloudflare 대시보드 → Analytics
2. Pages 프로젝트 선택
3. 트래픽, 성능 지표 확인

#### 외부 모니터링 (선택)
- **UptimeRobot**: 가동 시간 모니터링
- **Pingdom**: 성능 모니터링  
- **New Relic**: APM 모니터링

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. 빌드 실패
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 타입 에러 확인
npm run build
```

#### 2. 배포 실패
```bash
# Wrangler 재인증
wrangler auth logout
wrangler auth login

# 프로젝트 설정 확인
wrangler pages project list
```

#### 3. API 응답 안됨
- wrangler.jsonc 설정 확인
- 환경 변수 설정 확인
- 로그 확인: `wrangler pages deployment tail`

### 로그 확인
```bash
# 실시간 로그
wrangler pages deployment tail --project-name content-generator

# 배포 이력
wrangler pages deployment list --project-name content-generator
```

## 🎯 성능 최적화

### 1. 캐싱 전략
```javascript
// wrangler.jsonc
{
  "rules": [
    {
      "include": ["/static/*"],
      "cache": true
    }
  ]
}
```

### 2. 압축 설정
- Gzip/Brotli 압축 자동 활성화 (Cloudflare)
- 이미지 최적화: WebP 변환

### 3. CDN 최적화
- 글로벌 엣지 캐시 활용
- 지연 로딩 구현
- 리소스 번들링 최소화

---

배포 관련 문의: infrastructure@kakao.com