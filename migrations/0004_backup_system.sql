-- 백업 시스템 지원 테이블 생성
-- 자동 백업 메타데이터 및 복구 이력 관리

-- ========================================
-- 1. 백업 메타데이터 테이블
-- ========================================

-- 백업 이력 및 메타데이터 저장
CREATE TABLE IF NOT EXISTS backup_metadata (
  id TEXT PRIMARY KEY, -- backup_2024-01-15T10-30-00 형식
  timestamp DATETIME NOT NULL,
  backup_type TEXT NOT NULL DEFAULT 'full' CHECK(backup_type IN ('full', 'incremental')),
  
  -- 백업 크기 및 통계
  size INTEGER NOT NULL, -- 바이트 단위
  compressed BOOLEAN DEFAULT FALSE,
  encrypted BOOLEAN DEFAULT FALSE,
  checksum TEXT NOT NULL, -- SHA-256 체크섬
  
  -- 백업 범위 정보
  tables TEXT NOT NULL, -- JSON 배열 형태
  record_count INTEGER NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  
  -- 백업 상태
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT, -- 실패시 오류 메시지
  
  -- 저장 위치 정보
  storage_provider TEXT DEFAULT 'r2', -- r2, kv, local
  storage_path TEXT, -- 저장 경로 또는 키
  
  -- 생성 정보
  created_by TEXT DEFAULT 'system', -- system, user, scheduled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 복구 관련 정보
  restored_count INTEGER DEFAULT 0, -- 이 백업으로부터 복구된 횟수
  last_restored_at DATETIME -- 마지막 복구 시간
);

-- ========================================
-- 2. 복구 이력 테이블  
-- ========================================

-- 백업 복구 작업 이력
CREATE TABLE IF NOT EXISTS backup_restore_history (
  id TEXT PRIMARY KEY,
  backup_id TEXT NOT NULL,
  
  -- 복구 설정
  restore_type TEXT NOT NULL CHECK(restore_type IN ('full', 'partial', 'schema_only', 'data_only')),
  target_tables TEXT, -- JSON 배열, null이면 전체
  drop_existing BOOLEAN DEFAULT FALSE,
  
  -- 복구 결과
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'failed')),
  restored_tables TEXT, -- 실제 복구된 테이블들 (JSON)
  restored_records INTEGER DEFAULT 0,
  
  -- 시간 정보
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  duration_seconds INTEGER, -- 복구 소요 시간
  
  -- 오류 정보
  error_message TEXT,
  error_details TEXT, -- JSON 형태의 상세 오류 정보
  
  -- 수행자 정보
  performed_by TEXT DEFAULT 'system', -- system, user_id
  ip_address TEXT,
  user_agent TEXT,
  
  -- 외래키
  FOREIGN KEY (backup_id) REFERENCES backup_metadata(id) ON DELETE CASCADE
);

-- ========================================
-- 3. 스키마 마이그레이션 이력 테이블
-- ========================================

-- 데이터베이스 스키마 변경 이력 (마이그레이션 추적)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY, -- 0001, 0002, 0003 등
  description TEXT NOT NULL,
  filename TEXT, -- 마이그레이션 파일명
  checksum TEXT, -- 파일 체크섬 (변경 감지용)
  
  -- 실행 정보
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER,
  
  -- 롤백 정보
  rollback_sql TEXT, -- 롤백 SQL (가능한 경우)
  rolled_back_at DATETIME,
  rollback_reason TEXT
);

-- ========================================
-- 4. 백업 스케줄 설정 테이블
-- ========================================

-- 자동 백업 스케줄 관리
CREATE TABLE IF NOT EXISTS backup_schedules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- 스케줄 설정
  schedule_type TEXT NOT NULL CHECK(schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  cron_expression TEXT, -- custom 타입인 경우 cron 식
  
  -- 백업 설정
  backup_type TEXT NOT NULL DEFAULT 'full' CHECK(backup_type IN ('full', 'incremental')),
  retention_days INTEGER DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT TRUE,
  encryption_enabled BOOLEAN DEFAULT FALSE,
  
  -- 알림 설정
  notification_enabled BOOLEAN DEFAULT FALSE,
  notification_email TEXT,
  notification_webhook TEXT,
  
  -- 상태
  active BOOLEAN DEFAULT TRUE,
  last_run_at DATETIME,
  next_run_at DATETIME,
  last_backup_id TEXT, -- 마지막 생성된 백업 ID
  
  -- 통계
  total_backups INTEGER DEFAULT 0,
  successful_backups INTEGER DEFAULT 0,
  failed_backups INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 외래키
  FOREIGN KEY (last_backup_id) REFERENCES backup_metadata(id) ON DELETE SET NULL
);

-- ========================================
-- 5. 백업 시스템 성능 최적화 인덱스
-- ========================================

-- 백업 메타데이터 인덱스
CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_type_status ON backup_metadata(backup_type, status);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_size ON backup_metadata(size DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_checksum ON backup_metadata(checksum);

-- 복구 이력 인덱스
CREATE INDEX IF NOT EXISTS idx_backup_restore_backup_id ON backup_restore_history(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_restore_status_started ON backup_restore_history(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_restore_performed_by ON backup_restore_history(performed_by, started_at DESC);

-- 스키마 마이그레이션 인덱스
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied ON schema_migrations(applied_at DESC);

-- 백업 스케줄 인덱스
CREATE INDEX IF NOT EXISTS idx_backup_schedules_active_next ON backup_schedules(active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_last_run ON backup_schedules(last_run_at DESC);

-- ========================================
-- 6. 백업 시스템 뷰 및 통계
-- ========================================

-- 백업 시스템 상태 뷰
CREATE VIEW IF NOT EXISTS v_backup_system_status AS
SELECT 
  COUNT(*) as total_backups,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_backups,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_backups,
  COUNT(CASE WHEN backup_type = 'full' THEN 1 END) as full_backups,
  COUNT(CASE WHEN backup_type = 'incremental' THEN 1 END) as incremental_backups,
  
  -- 크기 통계
  SUM(size) as total_backup_size,
  AVG(size) as average_backup_size,
  MAX(size) as largest_backup_size,
  
  -- 최근 백업 정보
  MAX(timestamp) as last_backup_time,
  COUNT(CASE WHEN timestamp >= datetime('now', '-24 hours') THEN 1 END) as backups_last_24h,
  COUNT(CASE WHEN timestamp >= datetime('now', '-7 days') THEN 1 END) as backups_last_week
FROM backup_metadata;

-- 백업 복구 통계 뷰
CREATE VIEW IF NOT EXISTS v_backup_restore_stats AS
SELECT 
  COUNT(*) as total_restore_operations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_restores,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_restores,
  
  -- 복구 시간 통계
  AVG(duration_seconds) as avg_restore_time_seconds,
  MAX(duration_seconds) as max_restore_time_seconds,
  
  -- 최근 복구 활동
  MAX(started_at) as last_restore_time,
  COUNT(CASE WHEN started_at >= datetime('now', '-30 days') THEN 1 END) as restores_last_30_days
FROM backup_restore_history;

-- ========================================
-- 7. 백업 시스템 트리거
-- ========================================

-- 백업 생성시 스케줄 정보 업데이트
CREATE TRIGGER IF NOT EXISTS update_schedule_on_backup
  AFTER INSERT ON backup_metadata
  WHEN NEW.created_by = 'scheduled'
BEGIN
  UPDATE backup_schedules 
  SET 
    last_run_at = NEW.timestamp,
    last_backup_id = NEW.id,
    total_backups = total_backups + 1,
    successful_backups = CASE WHEN NEW.status = 'completed' THEN successful_backups + 1 ELSE successful_backups END,
    failed_backups = CASE WHEN NEW.status = 'failed' THEN failed_backups + 1 ELSE failed_backups END,
    updated_at = CURRENT_TIMESTAMP
  WHERE active = TRUE; -- 활성 스케줄에만 적용
END;

-- 복구 완료시 백업 메타데이터 업데이트
CREATE TRIGGER IF NOT EXISTS update_backup_on_restore
  AFTER UPDATE ON backup_restore_history
  WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
  UPDATE backup_metadata 
  SET 
    restored_count = restored_count + 1,
    last_restored_at = NEW.completed_at
  WHERE id = NEW.backup_id;
END;

-- 백업 스케줄 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS update_backup_schedules_updated_at
  AFTER UPDATE ON backup_schedules
BEGIN
  UPDATE backup_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ========================================
-- 8. 초기 데이터 삽입
-- ========================================

-- 기본 일일 백업 스케줄 생성
INSERT OR IGNORE INTO backup_schedules (
  id, name, description, schedule_type, backup_type, retention_days,
  compression_enabled, encryption_enabled, active, next_run_at
) VALUES (
  'daily_full_backup',
  '일일 전체 백업',
  '매일 자정에 실행되는 전체 데이터베이스 백업',
  'daily',
  'full', 
  30,
  TRUE,
  FALSE,
  TRUE,
  datetime('now', '+1 day', 'start of day')
);

-- 기본 주간 전체 백업 스케줄 생성
INSERT OR IGNORE INTO backup_schedules (
  id, name, description, schedule_type, backup_type, retention_days,
  compression_enabled, encryption_enabled, active, next_run_at
) VALUES (
  'weekly_full_backup',
  '주간 전체 백업',
  '매주 일요일에 실행되는 전체 데이터베이스 백업 (압축 + 암호화)',
  'weekly',
  'full',
  90,
  TRUE,
  TRUE,
  TRUE,
  datetime('now', 'weekday 0', '+1 day', 'start of day', '+2 hours')
);

-- ========================================
-- 마이그레이션 완료 기록 (schema_migrations 테이블이 존재하는 경우에만)
-- ========================================
-- INSERT OR REPLACE INTO schema_migrations (version, description, applied_at)
-- VALUES ('0004', 'Backup system - metadata, schedules, restore history', CURRENT_TIMESTAMP);