-- 성능 모니터링 및 쿼리 최적화 지원 테이블
-- 실시간 성능 추적, 느린 쿼리 분석, 자동 최적화 제안

-- ========================================
-- 1. 쿼리 성능 로그 테이블
-- ========================================

-- 모든 쿼리 실행 성능 추적
CREATE TABLE IF NOT EXISTS query_performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id TEXT NOT NULL, -- 쿼리 식별자
  sql_hash TEXT NOT NULL, -- SQL 해시 (동일 쿼리 그룹화용)
  sql TEXT NOT NULL, -- 실제 SQL 쿼리
  
  -- 성능 메트릭
  execution_time REAL NOT NULL, -- 실행 시간 (밀리초)
  rows_returned INTEGER DEFAULT 0, -- 반환된 행 수
  rows_scanned INTEGER DEFAULT 0, -- 스캔된 행 수 (추정)
  
  -- 인덱스 사용 정보
  indexes_used TEXT, -- JSON 배열 형태의 사용된 인덱스들
  cache_hit BOOLEAN DEFAULT FALSE, -- 캐시 히트 여부
  
  -- 쿼리 패턴 분석 (자동 최적화용)
  query_type TEXT, -- SELECT, INSERT, UPDATE, DELETE
  table_names TEXT, -- JSON 배열 형태의 관련 테이블들
  where_conditions TEXT, -- JSON 형태의 WHERE 조건들
  join_conditions TEXT, -- JSON 형태의 JOIN 조건들
  order_by_columns TEXT, -- JSON 형태의 ORDER BY 컬럼들
  
  -- 실행 컨텍스트
  user_id TEXT, -- 실행한 사용자 (있는 경우)
  session_id TEXT, -- 세션 식별자
  ip_address TEXT, -- 클라이언트 IP
  user_agent TEXT, -- User-Agent (웹 요청인 경우)
  
  -- 시간 정보
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_part DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED -- 일별 파티셔닝용
);

-- ========================================
-- 2. 테이블 통계 정보
-- ========================================

-- 각 테이블의 통계 정보 저장
CREATE TABLE IF NOT EXISTS table_statistics (
  table_name TEXT PRIMARY KEY,
  
  -- 기본 통계
  row_count INTEGER NOT NULL DEFAULT 0,
  avg_row_size INTEGER DEFAULT 0, -- 바이트 단위
  total_size INTEGER DEFAULT 0, -- 전체 테이블 크기
  
  -- 인덱스 정보
  index_count INTEGER DEFAULT 0,
  index_size INTEGER DEFAULT 0, -- 모든 인덱스 크기 합계
  
  -- 액세스 패턴
  select_count INTEGER DEFAULT 0, -- SELECT 쿼리 횟수
  insert_count INTEGER DEFAULT 0, -- INSERT 쿼리 횟수
  update_count INTEGER DEFAULT 0, -- UPDATE 쿼리 횟수
  delete_count INTEGER DEFAULT 0, -- DELETE 쿼리 횟수
  
  -- 성능 정보
  avg_query_time REAL DEFAULT 0, -- 평균 쿼리 시간
  slowest_query_time REAL DEFAULT 0, -- 가장 느린 쿼리 시간
  
  -- 메타데이터
  last_analyzed DATETIME, -- 마지막 ANALYZE 실행 시간
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. 인덱스 사용 통계
-- ========================================

-- 인덱스별 사용 빈도 및 효율성 추적
CREATE TABLE IF NOT EXISTS index_usage_statistics (
  index_name TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  
  -- 사용 통계
  usage_count INTEGER DEFAULT 0,
  last_used DATETIME,
  
  -- 성능 기여도
  avg_performance_gain REAL DEFAULT 0, -- 평균 성능 향상 (밀리초)
  total_time_saved REAL DEFAULT 0, -- 총 절약된 시간
  
  -- 효율성 점수
  effectiveness_score REAL DEFAULT 0, -- 0-100 점수
  
  -- 생성 정보
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 4. 느린 쿼리 패턴
-- ========================================

-- 반복되는 느린 쿼리 패턴 추적
CREATE TABLE IF NOT EXISTS slow_query_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sql_pattern_hash TEXT UNIQUE NOT NULL, -- 패턴 해시
  sql_pattern TEXT NOT NULL, -- 매개변수화된 SQL 패턴
  
  -- 통계 정보
  occurrence_count INTEGER DEFAULT 1,
  avg_execution_time REAL NOT NULL,
  max_execution_time REAL NOT NULL,
  min_execution_time REAL NOT NULL,
  
  -- 최적화 상태
  optimization_status TEXT DEFAULT 'pending' CHECK(
    optimization_status IN ('pending', 'analyzed', 'optimized', 'ignored')
  ),
  suggested_optimizations TEXT, -- JSON 형태의 최적화 제안들
  applied_optimizations TEXT, -- 적용된 최적화들
  
  -- 시간 정보
  first_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_occurrence DATETIME DEFAULT CURRENT_TIMESTAMP,
  optimized_at DATETIME
);

-- ========================================
-- 5. 자동 최적화 제안
-- ========================================

-- 시스템이 생성한 최적화 제안들
CREATE TABLE IF NOT EXISTS optimization_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suggestion_type TEXT NOT NULL CHECK(
    suggestion_type IN ('index', 'query_rewrite', 'cache', 'partition')
  ),
  
  -- 제안 내용
  target_table TEXT,
  target_query_pattern TEXT,
  suggestion_title TEXT NOT NULL,
  suggestion_description TEXT NOT NULL,
  suggested_sql TEXT, -- 제안되는 SQL (인덱스 생성, 쿼리 재작성 등)
  
  -- 우선순위 및 효과
  priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
  estimated_improvement REAL, -- 예상 성능 향상 (%)
  effort_level TEXT CHECK(effort_level IN ('easy', 'medium', 'hard')),
  
  -- 상태 추적
  status TEXT DEFAULT 'pending' CHECK(
    status IN ('pending', 'approved', 'applied', 'rejected', 'outdated')
  ),
  
  -- 적용 정보
  applied_at DATETIME,
  applied_by TEXT, -- 적용한 사용자/시스템
  rollback_sql TEXT, -- 롤백용 SQL
  
  -- 결과 추적
  actual_improvement REAL, -- 실제 성능 향상
  side_effects TEXT, -- 부작용이나 문제점
  
  -- 생성 정보
  generated_by TEXT DEFAULT 'system', -- system, user
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 6. 시스템 성능 스냅샷
-- ========================================

-- 정기적인 시스템 성능 스냅샷
CREATE TABLE IF NOT EXISTS system_performance_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_type TEXT NOT NULL CHECK(
    snapshot_type IN ('hourly', 'daily', 'weekly', 'monthly')
  ),
  
  -- 전체 시스템 메트릭
  total_queries INTEGER NOT NULL,
  avg_query_time REAL NOT NULL,
  slow_queries INTEGER NOT NULL,
  failed_queries INTEGER NOT NULL,
  
  -- 캐시 통계
  cache_hit_rate REAL DEFAULT 0,
  cache_size INTEGER DEFAULT 0,
  
  -- 데이터베이스 통계
  total_tables INTEGER DEFAULT 0,
  total_indexes INTEGER DEFAULT 0,
  total_db_size INTEGER DEFAULT 0, -- 바이트 단위
  
  -- 상위 느린 쿼리들
  top_slow_queries TEXT, -- JSON 형태
  
  -- 메모리 및 리소스 사용량
  memory_usage REAL DEFAULT 0, -- MB 단위
  cpu_usage REAL DEFAULT 0, -- 백분율
  
  -- 시간 정보
  snapshot_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL
);

-- ========================================
-- 7. 성능 최적화 인덱스
-- ========================================

-- 쿼리 성능 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_query_performance_timestamp ON query_performance_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_hash_time ON query_performance_log(sql_hash, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_execution_time ON query_performance_log(execution_time DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_date_part ON query_performance_log(date_part);
CREATE INDEX IF NOT EXISTS idx_query_performance_user_time ON query_performance_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_slow_queries ON query_performance_log(execution_time) WHERE execution_time > 1000;

-- 테이블 통계 인덱스
CREATE INDEX IF NOT EXISTS idx_table_statistics_updated ON table_statistics(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_statistics_row_count ON table_statistics(row_count DESC);

-- 인덱스 사용 통계 인덱스
CREATE INDEX IF NOT EXISTS idx_index_usage_table ON index_usage_statistics(table_name);
CREATE INDEX IF NOT EXISTS idx_index_usage_effectiveness ON index_usage_statistics(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_index_usage_last_used ON index_usage_statistics(last_used DESC);

-- 느린 쿼리 패턴 인덱스
CREATE INDEX IF NOT EXISTS idx_slow_query_avg_time ON slow_query_patterns(avg_execution_time DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_count ON slow_query_patterns(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_status ON slow_query_patterns(optimization_status, avg_execution_time DESC);

-- 최적화 제안 인덱스
CREATE INDEX IF NOT EXISTS idx_optimization_suggestions_priority ON optimization_suggestions(priority, status);
CREATE INDEX IF NOT EXISTS idx_optimization_suggestions_type ON optimization_suggestions(suggestion_type, status);
CREATE INDEX IF NOT EXISTS idx_optimization_suggestions_created ON optimization_suggestions(created_at DESC);

-- 성능 스냅샷 인덱스
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_time ON system_performance_snapshots(snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_type ON system_performance_snapshots(snapshot_type, snapshot_time DESC);

-- ========================================
-- 8. 성능 모니터링 뷰
-- ========================================

-- 실시간 성능 대시보드 뷰
CREATE VIEW IF NOT EXISTS v_performance_dashboard AS
SELECT 
  -- 현재 시간 기준 통계 (최근 1시간)
  COUNT(*) as queries_last_hour,
  AVG(execution_time) as avg_execution_time,
  COUNT(CASE WHEN execution_time > 1000 THEN 1 END) as slow_queries,
  COUNT(CASE WHEN cache_hit = 1 THEN 1 END) as cache_hits,
  COUNT(CASE WHEN cache_hit = 1 THEN 1 END) * 100.0 / COUNT(*) as cache_hit_rate,
  
  -- 가장 느린 쿼리들
  (
    SELECT sql 
    FROM query_performance_log 
    WHERE timestamp >= datetime('now', '-1 hour') 
    ORDER BY execution_time DESC 
    LIMIT 1
  ) as slowest_query,
  
  MAX(execution_time) as max_execution_time
FROM query_performance_log 
WHERE timestamp >= datetime('now', '-1 hour');

-- 테이블별 성능 요약 뷰
CREATE VIEW IF NOT EXISTS v_table_performance_summary AS
SELECT 
  ts.table_name,
  ts.row_count,
  ts.avg_query_time,
  ts.select_count + ts.insert_count + ts.update_count + ts.delete_count as total_operations,
  
  -- 최근 24시간 쿼리 통계
  COUNT(qpl.id) as queries_24h,
  AVG(qpl.execution_time) as avg_time_24h,
  COUNT(CASE WHEN qpl.execution_time > 1000 THEN 1 END) as slow_queries_24h
  
FROM table_statistics ts
LEFT JOIN query_performance_log qpl ON 
  json_extract(qpl.table_names, '$[0]') = ts.table_name
  AND qpl.timestamp >= datetime('now', '-24 hours')
GROUP BY ts.table_name, ts.row_count, ts.avg_query_time, total_operations;

-- 최적화 기회 요약 뷰
CREATE VIEW IF NOT EXISTS v_optimization_opportunities AS
SELECT 
  suggestion_type,
  priority,
  COUNT(*) as total_suggestions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_suggestions,
  AVG(estimated_improvement) as avg_estimated_improvement,
  COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_suggestions,
  AVG(CASE WHEN actual_improvement IS NOT NULL THEN actual_improvement END) as avg_actual_improvement
FROM optimization_suggestions
GROUP BY suggestion_type, priority
ORDER BY priority DESC, avg_estimated_improvement DESC;

-- ========================================
-- 9. 자동 성능 분석 트리거
-- ========================================

-- 쿼리 실행시 자동 분석
CREATE TRIGGER IF NOT EXISTS analyze_query_performance
  AFTER INSERT ON query_performance_log
  WHEN NEW.execution_time > 1000 -- 1초 이상 쿼리만
BEGIN
  -- 느린 쿼리 패턴 업데이트
  INSERT OR REPLACE INTO slow_query_patterns (
    sql_pattern_hash,
    sql_pattern,
    occurrence_count,
    avg_execution_time,
    max_execution_time,
    min_execution_time,
    last_occurrence
  ) VALUES (
    NEW.sql_hash,
    NEW.sql,
    COALESCE((SELECT occurrence_count + 1 FROM slow_query_patterns WHERE sql_pattern_hash = NEW.sql_hash), 1),
    COALESCE((SELECT (avg_execution_time * occurrence_count + NEW.execution_time) / (occurrence_count + 1) 
             FROM slow_query_patterns WHERE sql_pattern_hash = NEW.sql_hash), NEW.execution_time),
    COALESCE((SELECT MAX(max_execution_time, NEW.execution_time) FROM slow_query_patterns WHERE sql_pattern_hash = NEW.sql_hash), NEW.execution_time),
    COALESCE((SELECT MIN(min_execution_time, NEW.execution_time) FROM slow_query_patterns WHERE sql_pattern_hash = NEW.sql_hash), NEW.execution_time),
    NEW.timestamp
  );
  
  -- 테이블 통계 업데이트
  UPDATE table_statistics 
  SET 
    avg_query_time = (avg_query_time * select_count + NEW.execution_time) / (select_count + 1),
    select_count = select_count + 1,
    slowest_query_time = MAX(slowest_query_time, NEW.execution_time),
    updated_at = CURRENT_TIMESTAMP
  WHERE table_name = json_extract(NEW.table_names, '$[0]');
END;

-- 인덱스 사용 통계 업데이트
CREATE TRIGGER IF NOT EXISTS update_index_usage_stats
  AFTER INSERT ON query_performance_log
  WHEN NEW.indexes_used IS NOT NULL AND NEW.indexes_used != '[]'
BEGIN
  -- JSON 배열의 각 인덱스에 대해 통계 업데이트 (SQLite JSON 함수 활용)
  -- 실제 구현시에는 애플리케이션 레벨에서 처리 권장
  UPDATE index_usage_statistics 
  SET 
    usage_count = usage_count + 1,
    last_used = NEW.timestamp,
    updated_at = CURRENT_TIMESTAMP
  WHERE index_name IN (
    SELECT value FROM json_each(NEW.indexes_used)
  );
END;

-- ========================================
-- 10. 초기 데이터 및 설정
-- ========================================

-- 기본 테이블 통계 초기화
INSERT OR IGNORE INTO table_statistics (table_name, row_count, updated_at)
SELECT 
  name as table_name,
  0 as row_count,
  CURRENT_TIMESTAMP as updated_at
FROM sqlite_master 
WHERE type = 'table' 
AND name NOT LIKE 'sqlite_%'
AND name NOT LIKE '_cf_%';

-- ========================================
-- 마이그레이션 완료 기록 (schema_migrations 테이블이 존재하는 경우에만)
-- ========================================
-- INSERT OR REPLACE INTO schema_migrations (version, description, applied_at)
-- VALUES ('0005', 'Performance monitoring - query logs, statistics, optimization suggestions', CURRENT_TIMESTAMP);