-- 데이터베이스 성능 최적화 마이그레이션
-- 고성능 인덱싱, 쿼리 최적화, 백업 자동화

-- ========================================
-- 1. 고성능 복합 인덱스 (Composite Indexes)
-- ========================================

-- 사용자별 콘텐츠 생성 이력 최적화 (가장 빈번한 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_content_generations_user_status_created 
ON content_generations(user_id, status, created_at DESC);

-- 템플릿 검색 및 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_content_templates_category_public_active 
ON content_templates(category_id, is_public, active, rating DESC);

-- 사용량 추적 최적화 (쿼터 관리용)
CREATE INDEX IF NOT EXISTS idx_user_usage_user_feature_reset 
ON user_usage(user_id, feature, reset_date, usage_count);

-- 생성 이력 날짜 범위 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_content_generations_created_status_user 
ON content_generations(created_at DESC, status, user_id);

-- 개별 콘텐츠 생성 최적화
CREATE INDEX IF NOT EXISTS idx_individual_generations_user_type_created 
ON individual_generations(user_id, content_type, created_at DESC);

-- 즐겨찾기 조회 최적화
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_type_created 
ON user_favorites(user_id, favorite_type, created_at DESC);

-- ========================================
-- 2. 부분 인덱스 (Partial Indexes) - SQLite 3.8.0+
-- ========================================

-- 활성 사용자만 대상 인덱스 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_active_plan_created 
ON users(plan, created_at DESC) 
WHERE is_active = TRUE;

-- 완료된 콘텐츠 생성만 대상 인덱스
CREATE INDEX IF NOT EXISTS idx_content_generations_completed_user_created 
ON content_generations(user_id, created_at DESC) 
WHERE status = 'completed';

-- 공개 템플릿만 대상 인덱스
CREATE INDEX IF NOT EXISTS idx_content_templates_public_rating_usage 
ON content_templates(rating DESC, usage_count DESC) 
WHERE is_public = TRUE AND active = TRUE;

-- 실제 AI 사용된 생성 이력 인덱스 (분석용)
CREATE INDEX IF NOT EXISTS idx_content_generations_real_ai_created 
ON content_generations(created_at DESC, processing_time) 
WHERE real_ai_used > 0;

-- ========================================
-- 3. JSON 필드 최적화 (SQLite JSON1 확장 활용)
-- ========================================

-- JSON 태그 검색 최적화를 위한 가상 컬럼 및 인덱스
-- SQLite JSON 확장이 있는 경우에만 생성
-- ALTER TABLE content_templates ADD COLUMN tags_searchable TEXT GENERATED ALWAYS AS (
--   CASE 
--     WHEN tags IS NOT NULL THEN lower(json_extract(tags, '$'))
--     ELSE NULL 
--   END
-- ) STORED;

-- 태그 검색용 인덱스 (SQLite JSON 지원시)
-- CREATE INDEX IF NOT EXISTS idx_content_templates_tags_searchable 
-- ON content_templates(tags_searchable) 
-- WHERE tags_searchable IS NOT NULL;

-- ========================================
-- 4. 통계 및 집계 최적화 인덱스
-- ========================================

-- 사용자 통계 생성용 인덱스
CREATE INDEX IF NOT EXISTS idx_content_generations_user_created_processing 
ON content_generations(user_id, created_at, processing_time, real_ai_used);

-- 템플릿 사용 통계용 인덱스
CREATE INDEX IF NOT EXISTS idx_template_usage_template_used_rating 
ON template_usage(template_id, used_at DESC, satisfaction_rating);

-- 월별/일별 사용량 분석용 인덱스
CREATE INDEX IF NOT EXISTS idx_user_usage_feature_reset_usage 
ON user_usage(feature, reset_date, usage_count DESC);

-- ========================================
-- 5. 성능 모니터링을 위한 뷰 생성
-- ========================================

-- 사용자별 생성 통계 뷰
CREATE VIEW IF NOT EXISTS v_user_generation_stats AS
SELECT 
  u.id as user_id,
  u.email,
  u.plan,
  COUNT(cg.id) as total_generations,
  COUNT(CASE WHEN cg.status = 'completed' THEN 1 END) as completed_generations,
  COUNT(CASE WHEN cg.real_ai_used > 0 THEN 1 END) as real_ai_generations,
  AVG(cg.processing_time) as avg_processing_time,
  MAX(cg.created_at) as last_generation_at,
  COUNT(CASE WHEN cg.created_at >= date('now', '-30 days') THEN 1 END) as generations_last_30_days
FROM users u
LEFT JOIN content_generations cg ON u.id = cg.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.email, u.plan;

-- 템플릿 인기도 및 성능 뷰
CREATE VIEW IF NOT EXISTS v_template_performance AS
SELECT 
  ct.id as template_id,
  ct.name,
  ct.category_id,
  ct.usage_count,
  ct.rating,
  ct.rating_count,
  COUNT(tu.id) as actual_usage_count,
  AVG(CAST(tu.satisfaction_rating AS REAL)) as avg_satisfaction,
  COUNT(CASE WHEN tu.used_at >= date('now', '-30 days') THEN 1 END) as usage_last_30_days
FROM content_templates ct
LEFT JOIN template_usage tu ON ct.id = tu.template_id
WHERE ct.active = TRUE
GROUP BY ct.id, ct.name, ct.category_id, ct.usage_count, ct.rating, ct.rating_count;

-- 시스템 성능 모니터링 뷰
CREATE VIEW IF NOT EXISTS v_system_performance AS
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
  COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as new_users_week,
  (SELECT COUNT(*) FROM content_generations WHERE created_at >= date('now', '-24 hours')) as generations_24h,
  (SELECT AVG(processing_time) FROM content_generations WHERE created_at >= date('now', '-24 hours')) as avg_processing_time_24h,
  (SELECT COUNT(*) FROM content_generations WHERE status = 'failed' AND created_at >= date('now', '-24 hours')) as failed_generations_24h
FROM users;

-- ========================================
-- 6. 트리거 최적화 (성능 향상)
-- ========================================

-- 기존 트리거 개선: 사용량 카운터 업데이트
DROP TRIGGER IF EXISTS increment_template_usage_count;
CREATE TRIGGER increment_template_usage_count
  AFTER INSERT ON template_usage
  WHEN NEW.template_id IS NOT NULL
BEGIN
  UPDATE content_templates 
  SET usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.template_id;
END;

-- 평점 자동 계산 트리거
CREATE TRIGGER IF NOT EXISTS update_template_rating
  AFTER INSERT ON template_usage
  WHEN NEW.satisfaction_rating IS NOT NULL
BEGIN
  UPDATE content_templates 
  SET rating = (
    SELECT AVG(CAST(satisfaction_rating AS REAL))
    FROM template_usage 
    WHERE template_id = NEW.template_id 
    AND satisfaction_rating IS NOT NULL
  ),
  rating_count = (
    SELECT COUNT(*)
    FROM template_usage 
    WHERE template_id = NEW.template_id 
    AND satisfaction_rating IS NOT NULL
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.template_id;
END;

-- 사용자 마지막 로그인 시간 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS update_user_last_login
  AFTER INSERT ON content_generations
  WHEN NEW.user_id IS NOT NULL
BEGIN
  UPDATE users 
  SET last_login_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id 
  AND (last_login_at IS NULL OR last_login_at < date('now', '-1 hour'));
END;

-- ========================================
-- 7. 데이터 정합성 개선
-- ========================================

-- orphaned 레코드 정리용 인덱스 (서브쿼리 제거)
CREATE INDEX IF NOT EXISTS idx_content_generations_orphan_check 
ON content_generations(user_id);

-- 만료된 공유 링크 정리용 인덱스 (함수 제거)
CREATE INDEX IF NOT EXISTS idx_generation_shares_expired 
ON generation_shares(expires_at) 
WHERE expires_at IS NOT NULL;

-- ========================================
-- 8. 쿼리 힌트 및 최적화 설정
-- ========================================

-- SQLite 성능 최적화 설정 (애플리케이션에서 실행)
-- PRAGMA journal_mode = WAL;
-- PRAGMA synchronous = NORMAL;
-- PRAGMA cache_size = 10000;
-- PRAGMA foreign_keys = ON;
-- PRAGMA optimize;

-- 분석 통계 업데이트 (쿼리 플래너 최적화)
ANALYZE;

-- ========================================
-- 마이그레이션 완료 로그 (테이블이 존재하는 경우에만)
-- ========================================
-- INSERT OR REPLACE INTO schema_migrations (version, description, applied_at)
-- VALUES ('0003', 'Performance optimization - indexes, views, triggers', CURRENT_TIMESTAMP);