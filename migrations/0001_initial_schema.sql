-- 통합 콘텐츠 생성기 데이터베이스 스키마
-- 사용자별 생성 이력 및 통계 관리

-- 사용자 테이블 (인메모리에서 D1으로 이전)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  metadata TEXT -- JSON 형태로 저장
);

-- 콘텐츠 생성 이력 테이블
CREATE TABLE IF NOT EXISTS content_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_description TEXT NOT NULL,
  generation_options TEXT, -- JSON 형태로 저장
  
  -- 생성된 콘텐츠들
  blog_title TEXT,
  blog_content TEXT,
  blog_tags TEXT, -- JSON array
  blog_seo_keywords TEXT, -- JSON array
  blog_reading_time INTEGER,
  
  social_graphic_url TEXT,
  social_graphic_description TEXT,
  social_graphic_prompt TEXT,
  social_graphic_dimensions TEXT,
  
  promo_video_url TEXT,
  promo_video_duration INTEGER,
  promo_video_description TEXT,
  promo_video_thumbnail TEXT,
  promo_video_prompt TEXT,
  
  podcast_script TEXT,
  podcast_audio_url TEXT,
  podcast_duration INTEGER,
  podcast_description TEXT,
  
  -- 생성 메타데이터
  processing_time INTEGER, -- 밀리초
  real_ai_used INTEGER DEFAULT 0, -- 실제 AI 사용 개수
  total_ai_calls INTEGER DEFAULT 0,
  failed_ai_calls INTEGER DEFAULT 0,
  
  -- 상태 및 타임스탬프
  status TEXT DEFAULT 'completed', -- pending, processing, completed, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 추가 메타데이터
  ip_address TEXT,
  user_agent TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 개별 콘텐츠 생성 이력 테이블 (단일 타입 생성용)
CREATE TABLE IF NOT EXISTS individual_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- blog, image, video, podcast
  product_description TEXT NOT NULL,
  generation_options TEXT, -- JSON
  
  -- 생성된 콘텐츠 (타입별로 다름)
  content_data TEXT, -- JSON 형태로 저장
  
  -- 메타데이터
  processing_time INTEGER,
  real_ai_used BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 사용자 사용량 추적 테이블 (쿼터 관리)
CREATE TABLE IF NOT EXISTS user_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  feature TEXT NOT NULL, -- content-generation, image-generation, video-generation, audio-generation
  usage_count INTEGER DEFAULT 0,
  quota_limit INTEGER DEFAULT 0,
  reset_date DATE, -- 월별 리셋일
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, feature, reset_date)
);

-- 즐겨찾기/북마크 테이블
CREATE TABLE IF NOT EXISTS user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_generation_id TEXT,
  individual_generation_id TEXT,
  favorite_type TEXT NOT NULL, -- generation, individual
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (content_generation_id) REFERENCES content_generations(id) ON DELETE CASCADE,
  FOREIGN KEY (individual_generation_id) REFERENCES individual_generations(id) ON DELETE CASCADE
);

-- 생성 이력 공유 테이블
CREATE TABLE IF NOT EXISTS generation_shares (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL,
  generation_type TEXT NOT NULL, -- content, individual
  share_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  password_hash TEXT, -- 선택적 비밀번호 보호
  expires_at DATETIME,
  view_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 사용 통계 및 분석을 위한 인덱스들
CREATE INDEX IF NOT EXISTS idx_content_generations_user_id ON content_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_content_generations_created_at ON content_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_content_generations_status ON content_generations(status);
CREATE INDEX IF NOT EXISTS idx_content_generations_user_created ON content_generations(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_individual_generations_user_id ON individual_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_generations_type ON individual_generations(content_type);
CREATE INDEX IF NOT EXISTS idx_individual_generations_user_type ON individual_generations(user_id, content_type);

CREATE INDEX IF NOT EXISTS idx_user_usage_user_feature ON user_usage(user_id, feature);
CREATE INDEX IF NOT EXISTS idx_user_usage_reset_date ON user_usage(reset_date);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_generation_shares_token ON generation_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_generation_shares_user_id ON generation_shares(user_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);