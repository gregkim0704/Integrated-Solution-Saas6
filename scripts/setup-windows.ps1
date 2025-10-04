# Windows 자동 설정 스크립트
# PowerShell에서 실행: .\scripts\setup-windows.ps1

Write-Host "🚀 통합 콘텐츠 생성기 Windows 설정 시작..." -ForegroundColor Green

# Node.js 버전 확인
Write-Host "`n📋 시스템 요구사항 확인 중..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js 설치됨: $nodeVersion" -ForegroundColor Green
    
    # 버전 18 이상 확인
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "⚠️  Node.js 18 이상이 필요합니다. 현재: $nodeVersion" -ForegroundColor Red
        Write-Host "   https://nodejs.org/에서 최신 LTS 버전을 설치하세요." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ Node.js가 설치되지 않았습니다." -ForegroundColor Red
    Write-Host "   https://nodejs.org/에서 LTS 버전을 설치하세요." -ForegroundColor Yellow
    exit 1
}

# NPM 버전 확인
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✅ NPM 설치됨: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ NPM이 설치되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 포트 3000 확인
Write-Host "`n🔍 포트 3000 사용 여부 확인 중..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    Write-Host "⚠️  포트 3000이 사용 중입니다:" -ForegroundColor Yellow
    Write-Host "$port3000" -ForegroundColor Gray
    
    $response = Read-Host "포트 3000을 사용 중인 프로세스를 종료하시겠습니까? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $pid = ($port3000 -split '\s+')[-1]
        try {
            Stop-Process -Id $pid -Force
            Write-Host "✅ 프로세스 $pid 종료됨" -ForegroundColor Green
        } catch {
            Write-Host "❌ 프로세스 종료 실패: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ 포트 3000 사용 가능" -ForegroundColor Green
}

# 기존 설치 정리 (필요시)
if (Test-Path "node_modules") {
    Write-Host "`n🧹 기존 설치 파일 정리 중..." -ForegroundColor Yellow
    $response = Read-Host "기존 node_modules를 삭제하고 새로 설치하시겠습니까? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
        Write-Host "✅ 기존 파일 정리 완료" -ForegroundColor Green
    }
}

# 의존성 설치
Write-Host "`n📦 의존성 설치 중..." -ForegroundColor Yellow
Write-Host "   npm install --legacy-peer-deps" -ForegroundColor Gray
$installResult = npm install --legacy-peer-deps --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 의존성 설치 완료" -ForegroundColor Green
} else {
    Write-Host "❌ 의존성 설치 실패" -ForegroundColor Red
    Write-Host "   수동으로 실행해보세요: npm install --legacy-peer-deps" -ForegroundColor Yellow
    exit 1
}

# 프로젝트 빌드
Write-Host "`n🔨 프로젝트 빌드 중..." -ForegroundColor Yellow
Write-Host "   npm run build" -ForegroundColor Gray
$buildResult = npm run build --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 빌드 완료" -ForegroundColor Green
} else {
    Write-Host "❌ 빌드 실패" -ForegroundColor Red
    Write-Host "   수동으로 실행해보세요: npm run build" -ForegroundColor Yellow
    exit 1
}

# 환경 변수 파일 생성
if (-not (Test-Path ".env")) {
    Write-Host "`n⚙️  환경 변수 파일 생성 중..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "✅ .env 파일 생성 완료" -ForegroundColor Green
}

# 설치 완료
Write-Host "`n🎉 설정 완료!" -ForegroundColor Green
Write-Host "`n📋 다음 명령어로 서버를 시작하세요:" -ForegroundColor Yellow
Write-Host "   npm run dev:local" -ForegroundColor Cyan
Write-Host "   또는" -ForegroundColor Gray  
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host "`n🌐 서버 시작 후 브라우저에서 접속:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor Cyan

Write-Host "`n💡 문제가 발생하면 WINDOWS-SETUP.md 파일을 참조하세요." -ForegroundColor Yellow

# 자동 시작 여부 확인
$response = Read-Host "`n지금 바로 서버를 시작하시겠습니까? (Y/n)"
if ($response -ne 'n' -and $response -ne 'N') {
    Write-Host "`n🚀 서버 시작 중..." -ForegroundColor Green
    Write-Host "   브라우저에서 http://localhost:3000으로 접속하세요" -ForegroundColor Cyan
    Write-Host "   서버를 중지하려면 Ctrl+C를 누르세요" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    npm run dev:local
}