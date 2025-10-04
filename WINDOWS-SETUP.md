# Windows 환경 설정 가이드

## 🪟 Windows에서 통합 콘텐츠 생성기 실행하기

### 📋 사전 요구사항

1. **Node.js 설치** (18.0.0 이상)
   - https://nodejs.org/에서 LTS 버전 다운로드
   - 설치 후 확인: `node --version`

2. **Git 설치**
   - https://git-scm.com/download/win
   - 또는 GitHub Desktop 사용

### 🚀 빠른 시작

#### 1단계: 프로젝트 클론
```powershell
git clone https://github.com/gregkim0704/Integrated-Solution-Saas.git
cd Integrated-Solution-Saas
```

#### 2단계: 의존성 설치 (호환성 모드)
```powershell
# 의존성 충돌 해결을 위한 강제 설치
npm install --legacy-peer-deps

# 또는 한 번에 실행
npm run install:force
```

#### 3단계: 프로젝트 빌드
```powershell
npm run build
```

#### 4단계: 개발 서버 실행
```powershell
# Windows용 로컬 개발 서버
npm run dev:local

# 또는 빌드+시작을 한 번에
npm start
```

#### 5단계: 브라우저에서 확인
- http://localhost:3000 접속
- AI 콘텐츠 생성 테스트

### 🔧 문제 해결

#### 의존성 충돌 해결
```powershell
# 1. node_modules 삭제
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 2. 캐시 클리어
npm cache clean --force

# 3. 다시 설치
npm install --legacy-peer-deps
```

#### wrangler 명령어 인식 안 됨
```powershell
# 전역 설치
npm install -g wrangler

# 또는 npx 사용
npx wrangler pages dev dist --port 3000
```

#### 포트 충돌 해결
```powershell
# 3000 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID 확인 후)
taskkill /PID <PID번호> /F
```

### 🧪 테스트

#### API 테스트 (PowerShell)
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/api/health"

# 콘텐츠 생성 테스트
$body = @{
    productDescription = "스마트 워치 - 건강 모니터링의 새로운 기준"
    options = @{
        imageStyle = "modern"
        videoDuration = 30
        voice = "professional" 
        language = "ko"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/generate-content" -Method POST -Body $body -ContentType "application/json"
```

### 📊 성능 최적화

#### Windows용 최적화 설정
```powershell
# NPM 설정 최적화
npm config set fund false
npm config set audit false
npm config set progress false

# Node.js 메모리 할당 증가
set NODE_OPTIONS=--max-old-space-size=4096
```

### 🚀 배포 준비

#### Cloudflare Pages 배포
```powershell
# 1. Wrangler 로그인
npx wrangler auth login

# 2. 프로덕션 배포
npm run deploy:prod
```

### 📝 Windows 전용 스크립트

**package.json에 추가된 Windows 친화적 스크립트:**
```json
{
  "scripts": {
    "dev:local": "wrangler pages dev dist --port 3000",
    "test:win": "powershell -Command \"Invoke-RestMethod -Uri http://localhost:3000\"",
    "install:force": "npm install --legacy-peer-deps",
    "start": "npm run build && npm run dev:local"
  }
}
```

### 🆘 지원

문제가 지속되는 경우:

1. **GitHub Issues**: https://github.com/gregkim0704/Integrated-Solution-Saas/issues
2. **Email**: infrastructure@kakao.com
3. **Phone**: 010-9143-0800

### 🚀 초간편 실행 방법

#### **방법 1: 자동 설정 스크립트 (권장)**
```powershell
# PowerShell에서 실행
.\scripts\setup-windows.ps1
```
모든 설정을 자동으로 처리하고 서버까지 시작합니다.

#### **방법 2: 배치 파일 (가장 쉬움)**
1. `scripts\start-server.bat` 파일을 **더블클릭**
2. 자동으로 설치하고 서버 시작
3. 브라우저에서 http://localhost:3000 접속

### 💡 팁

- **Windows Terminal** 사용 권장 (PowerShell 7+)
- **VSCode**에서 통합 터미널 사용
- **Node.js** 18 LTS 버전 사용 권장
- **관리자 권한**으로 실행하지 말 것 (보안상 위험)

### 📁 추가된 편의 스크립트

- `scripts/setup-windows.ps1` - 전체 자동 설정
- `scripts/start-server.bat` - 더블클릭으로 서버 시작
- `.env.example` - 환경 변수 템플릿

---

**🎉 이제 Windows에서 클릭 한 번으로 8초만에 4가지 AI 콘텐츠 생성!**