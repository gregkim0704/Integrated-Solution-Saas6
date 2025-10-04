-- 콘텐츠 템플릿 시스템 데이터베이스 스키마
-- 업계별, 목적별 템플릿 관리 및 사용자 정의 템플릿 지원

-- 템플릿 카테고리 (업계/목적별 분류)
CREATE TABLE IF NOT EXISTS template_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- FontAwesome 아이콘 클래스
  color TEXT DEFAULT 'blue', -- 테마 색상
  type TEXT NOT NULL CHECK(type IN ('industry', 'purpose')), -- 업계별 또는 목적별
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 템플릿
CREATE TABLE IF NOT EXISTS content_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  
  -- 템플릿 설정
  is_system BOOLEAN DEFAULT FALSE, -- 시스템 기본 템플릿 여부
  is_public BOOLEAN DEFAULT FALSE, -- 공개 템플릿 여부
  creator_id TEXT, -- 생성자 (사용자 정의 템플릿의 경우)
  active BOOLEAN DEFAULT TRUE, -- 활성화 여부
  
  -- 콘텐츠 템플릿 구성
  blog_template TEXT, -- 블로그 템플릿 (JSON)
  image_template TEXT, -- 이미지 생성 템플릿 (JSON)  
  video_template TEXT, -- 비디오 생성 템플릿 (JSON)
  podcast_template TEXT, -- 팟캐스트 생성 템플릿 (JSON)
  
  -- 메타데이터
  tags TEXT, -- JSON 배열 형태의 태그들
  usage_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0.0, -- 평균 평점
  rating_count INTEGER DEFAULT 0,
  
  -- 시간 정보
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 외래키
  FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 템플릿 사용 이력
CREATE TABLE IF NOT EXISTS template_usage (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  generation_id TEXT, -- 생성 결과와 연결
  
  -- 사용 정보
  customizations TEXT, -- 사용자가 수정한 부분들 (JSON)
  satisfaction_rating INTEGER CHECK(satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT, -- 사용자 피드백
  
  -- 시간 정보  
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 외래키
  FOREIGN KEY (template_id) REFERENCES content_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (generation_id) REFERENCES content_generations(id) ON DELETE SET NULL
);

-- 사용자 즐겨찾기 템플릿
CREATE TABLE IF NOT EXISTS user_favorite_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 외래키
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES content_templates(id) ON DELETE CASCADE,
  
  -- 중복 방지
  UNIQUE(user_id, template_id)
);

-- 템플릿 공유 (마켓플레이스)
CREATE TABLE IF NOT EXISTS template_shares (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  sharer_id TEXT NOT NULL,
  
  -- 공유 설정
  share_type TEXT NOT NULL CHECK(share_type IN ('public', 'team', 'private')),
  access_code TEXT, -- 비공개 공유용 코드
  download_count INTEGER DEFAULT 0,
  
  -- 시간 정보
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- 공유 만료일 (옵션)
  
  -- 외래키
  FOREIGN KEY (template_id) REFERENCES content_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (sharer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_template_categories_type ON template_categories(type, active);
CREATE INDEX IF NOT EXISTS idx_template_categories_sort ON template_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates(category_id, is_public, is_system);
CREATE INDEX IF NOT EXISTS idx_content_templates_creator ON content_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_public ON content_templates(is_public, active);
CREATE INDEX IF NOT EXISTS idx_content_templates_usage ON content_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_templates_rating ON content_templates(rating DESC, rating_count DESC);

CREATE INDEX IF NOT EXISTS idx_template_usage_template ON template_usage(template_id, used_at);
CREATE INDEX IF NOT EXISTS idx_template_usage_user ON template_usage(user_id, used_at);

CREATE INDEX IF NOT EXISTS idx_user_favorite_templates_user ON user_favorite_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_template_shares_template ON template_shares(template_id, share_type);
CREATE INDEX IF NOT EXISTS idx_template_shares_sharer ON template_shares(sharer_id);

-- 업데이트 트리거 (updated_at 자동 업데이트)
CREATE TRIGGER IF NOT EXISTS update_template_categories_updated_at 
  AFTER UPDATE ON template_categories
BEGIN
  UPDATE template_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_content_templates_updated_at 
  AFTER UPDATE ON content_templates  
BEGIN
  UPDATE content_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 사용 횟수 자동 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS increment_template_usage_count
  AFTER INSERT ON template_usage
BEGIN
  UPDATE content_templates 
  SET usage_count = usage_count + 1 
  WHERE id = NEW.template_id;
END;