@echo off
REM Windows 배치 파일 - 서버 간편 시작
REM 더블클릭으로 실행 가능

echo.
echo 🚀 통합 콘텐츠 생성기 서버 시작...
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo    https://nodejs.org/에서 LTS 버전을 설치하세요.
    pause
    exit /b 1
)

REM 프로젝트 디렉토리인지 확인
if not exist "package.json" (
    echo ❌ package.json 파일을 찾을 수 없습니다.
    echo    프로젝트 루트 디렉토리에서 실행해주세요.
    pause
    exit /b 1
)

REM 의존성 확인
if not exist "node_modules" (
    echo 📦 의존성을 설치하는 중...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ 의존성 설치 실패
        pause
        exit /b 1
    )
)

REM 빌드 확인
if not exist "dist" (
    echo 🔨 프로젝트 빌드 중...
    call npm run build
    if errorlevel 1 (
        echo ❌ 빌드 실패
        pause
        exit /b 1
    )
)

echo ✅ 모든 준비가 완료되었습니다.
echo 🌐 브라우저에서 http://localhost:3000으로 접속하세요
echo 💡 서버를 중지하려면 Ctrl+C를 누르세요
echo.

REM 서버 시작
call npm run dev:local

echo.
echo 서버가 종료되었습니다.
pause