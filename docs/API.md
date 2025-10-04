# API 문서

## 📋 개요

AI 기반 통합 콘텐츠 생성기 API는 RESTful 서비스로, 제품 설명을 입력받아 블로그, 이미지, 비디오, 팟캐스트 콘텐츠를 자동 생성합니다.

**Base URL**: `https://your-domain.pages.dev`

## 🔐 인증

현재 버전은 인증이 필요하지 않습니다. 향후 API 키 기반 인증이 추가될 예정입니다.

## 📡 엔드포인트

### 1. 통합 콘텐츠 생성

**POST** `/api/generate-content`

하나의 요청으로 모든 타입의 콘텐츠를 생성합니다.

#### Request Body
```json
{
  "productDescription": "스마트 워치 - 건강 모니터링과 피트니스 추적을 위한 차세대 웨어러블 디바이스",
  "options": {
    "imageStyle": "modern",
    "videoDuration": 30,
    "voice": "professional",
    "language": "ko"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "blog": {
      "title": "웨어러블 혁신의 새로운 기준 - 2024년 최고의 선택",
      "content": "...",
      "tags": ["웨어러블", "제품리뷰", "추천"],
      "seoKeywords": ["웨어러블", "웨어러블 추천", "웨어러블 리뷰"],
      "readingTime": 5
    },
    "socialGraphic": {
      "imageUrl": "https://example.com/image.png",
      "description": "웨어러블 제품을 위한 modern 스타일의 소셜 미디어 그래픽",
      "dimensions": "1200x630"
    },
    "promoVideo": {
      "videoUrl": "https://example.com/video.mp4",
      "duration": 30,
      "description": "30초 길이의 웨어러블 프로모션 비디오",
      "thumbnail": "https://example.com/thumb.png"
    },
    "podcast": {
      "scriptText": "안녕하세요! 오늘은 웨어러블 분야의...",
      "audioUrl": "https://example.com/audio.mp3",
      "duration": 120,
      "description": "professional 톤의 한국어 팟캐스트 에피소드"
    },
    "generatedAt": "2024-10-04T01:14:41.024Z",
    "productDescription": "...",
    "processingTime": 2340
  },
  "message": "모든 콘텐츠가 성공적으로 생성되었습니다.",
  "processingTime": 2340
}
```

### 2. 개별 콘텐츠 생성

#### 블로그 글 생성
**POST** `/api/generate-blog`

```json
{
  "productDescription": "제품 설명"
}
```

#### 소셜 그래픽 생성  
**POST** `/api/generate-image`

```json
{
  "productDescription": "제품 설명",
  "style": "modern"
}
```

#### 프로모션 비디오 생성
**POST** `/api/generate-video`

```json
{
  "productDescription": "제품 설명", 
  "duration": 30
}
```

#### 팟캐스트 콘텐츠 생성
**POST** `/api/generate-podcast`

```json
{
  "productDescription": "제품 설명",
  "voice": "professional"
}
```

### 3. 시스템 정보

#### Health Check
**GET** `/api/health`

```json
{
  "status": "healthy",
  "timestamp": "2024-10-04T01:14:32.216Z", 
  "version": "1.0.0",
  "services": {
    "blog": "active",
    "image": "active",
    "video": "active", 
    "podcast": "active"
  }
}
```

#### 사용 통계
**GET** `/api/stats`

```json
{
  "totalGenerated": 1250,
  "todayGenerated": 45,
  "averageProcessingTime": 2.3,
  "popularContentTypes": {
    "blog": 35,
    "socialGraphic": 25,
    "promoVideo": 25, 
    "podcast": 15
  },
  "userSatisfaction": 4.8
}
```

## 🔧 매개변수

### Options 객체

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `imageStyle` | string | "modern" | 이미지 스타일: "modern", "minimal", "vibrant", "professional" |
| `videoDuration` | number | 30 | 비디오 길이 (초): 15, 30, 60 |
| `voice` | string | "professional" | 음성 타입: "professional", "friendly", "energetic" |
| `language` | string | "ko" | 언어: "ko", "en" |

## 📊 응답 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (필수 필드 누락) |
| 500 | 서버 오류 |

## 🚀 사용 예제

### cURL
```bash
curl -X POST https://your-domain.pages.dev/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "productDescription": "스마트 워치 - 건강 모니터링 웨어러블",
    "options": {
      "imageStyle": "modern",
      "videoDuration": 30,
      "voice": "professional", 
      "language": "ko"
    }
  }'
```

### JavaScript
```javascript
const response = await fetch('/api/generate-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productDescription: '스마트 워치 - 건강 모니터링 웨어러블',
    options: {
      imageStyle: 'modern',
      videoDuration: 30,
      voice: 'professional',
      language: 'ko'
    }
  })
});

const result = await response.json();
```

### Python
```python
import requests

response = requests.post(
    'https://your-domain.pages.dev/api/generate-content',
    json={
        'productDescription': '스마트 워치 - 건강 모니터링 웨어러블',
        'options': {
            'imageStyle': 'modern',
            'videoDuration': 30,
            'voice': 'professional',
            'language': 'ko'
        }
    }
)

result = response.json()
```

## ⚡ 성능 및 제한사항

- **처리 시간**: 평균 2-5초
- **동시 요청**: 제한 없음 (향후 rate limiting 추가 예정)
- **입력 길이**: 제품 설명 최대 1000자
- **타임아웃**: 30초

## 🔮 향후 계획

- [ ] API 키 기반 인증
- [ ] Rate limiting
- [ ] 웹훅 지원
- [ ] 실시간 진행 상태 API
- [ ] 배치 처리 API
- [ ] 커스텀 템플릿 API

---

문의사항: infrastructure@kakao.com