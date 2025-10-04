/**
 * 데이터베이스 쿼리 최적화 및 성능 모니터링 시스템
 * Cloudflare D1 성능 최적화 전문 도구
 */

import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types'

export interface QueryPerformanceMetrics {
  queryId: string
  sql: string
  executionTime: number
  rowsReturned: number
  rowsScanned: number
  indexesUsed: string[]
  cacheHit: boolean
  timestamp: string
}

export interface QueryOptimizationSuggestion {
  type: 'index' | 'rewrite' | 'cache' | 'partition'
  priority: 'high' | 'medium' | 'low'
  message: string
  suggestedSql?: string
  suggestedIndex?: string
}

export interface SlowQueryReport {
  query: string
  avgExecutionTime: number
  totalExecutions: number
  maxExecutionTime: number
  lastExecuted: string
  suggestions: QueryOptimizationSuggestion[]
}

export class DatabaseQueryOptimizer {
  private db: D1Database
  private performanceCache = new Map<string, QueryPerformanceMetrics>()
  private slowQueryThreshold = 1000 // 1초
  private enableLogging = true

  constructor(database: D1Database, options: {
    slowQueryThreshold?: number
    enableLogging?: boolean
  } = {}) {
    this.db = database
    this.slowQueryThreshold = options.slowQueryThreshold || 1000
    this.enableLogging = options.enableLogging ?? true
  }

  /**
   * 쿼리 실행 및 성능 측정
   */
  async executeWithMetrics<T = any>(
    statement: D1PreparedStatement, 
    options: {
      queryId?: string
      expectRows?: number
      cacheKey?: string
    } = {}
  ): Promise<{ result: any; metrics: QueryPerformanceMetrics }> {
    const queryId = options.queryId || this.generateQueryId(statement.toString())
    const startTime = performance.now()
    
    try {
      // 캐시 확인
      const cacheKey = options.cacheKey
      if (cacheKey) {
        const cached = this.performanceCache.get(cacheKey)
        if (cached && this.isCacheValid(cached)) {
          return { 
            result: null, // 실제로는 캐시된 결과 반환
            metrics: { ...cached, cacheHit: true }
          }
        }
      }

      // 쿼리 실행
      const result = await statement.all()
      const executionTime = performance.now() - startTime

      // 성능 메트릭 수집
      const metrics: QueryPerformanceMetrics = {
        queryId,
        sql: statement.toString(),
        executionTime,
        rowsReturned: result.results?.length || 0,
        rowsScanned: this.estimateRowsScanned(statement.toString(), result.results?.length || 0),
        indexesUsed: await this.getIndexesUsed(statement.toString()),
        cacheHit: false,
        timestamp: new Date().toISOString()
      }

      // 성능 로깅
      if (this.enableLogging) {
        await this.logPerformanceMetrics(metrics)
      }

      // 느린 쿼리 감지
      if (executionTime > this.slowQueryThreshold) {
        await this.handleSlowQuery(metrics)
      }

      // 캐시 저장
      if (cacheKey) {
        this.performanceCache.set(cacheKey, metrics)
      }

      return { result, metrics }

    } catch (error) {
      const executionTime = performance.now() - startTime
      
      // 에러 로깅
      console.error(`❌ 쿼리 실행 오류 (${executionTime.toFixed(2)}ms):`, {
        queryId,
        sql: statement.toString(),
        error: error instanceof Error ? error.message : String(error)
      })
      
      throw error
    }
  }

  /**
   * 자동 쿼리 최적화 제안
   */
  async analyzeAndOptimizeQuery(sql: string): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = []
    const normalizedSql = sql.toLowerCase().trim()

    // 1. SELECT * 사용 검사
    if (normalizedSql.includes('select *')) {
      suggestions.push({
        type: 'rewrite',
        priority: 'medium',
        message: 'SELECT * 대신 필요한 컬럼만 명시하여 성능을 개선하세요',
        suggestedSql: sql.replace(/select\s+\*/i, 'SELECT column1, column2, ...')
      })
    }

    // 2. WHERE 절 인덱스 분석
    const whereConditions = this.extractWhereConditions(sql)
    for (const condition of whereConditions) {
      const hasIndex = await this.checkIndexExists(condition.table, condition.column)
      if (!hasIndex && condition.selectivity === 'high') {
        suggestions.push({
          type: 'index',
          priority: 'high',
          message: `${condition.table}.${condition.column}에 인덱스 생성을 권장합니다`,
          suggestedIndex: `CREATE INDEX idx_${condition.table}_${condition.column} ON ${condition.table}(${condition.column})`
        })
      }
    }

    // 3. JOIN 최적화 검사
    const joins = this.extractJoins(sql)
    for (const join of joins) {
      const hasIndex = await this.checkIndexExists(join.table, join.column)
      if (!hasIndex) {
        suggestions.push({
          type: 'index',
          priority: 'high',
          message: `JOIN 조건 ${join.table}.${join.column}에 인덱스가 필요합니다`,
          suggestedIndex: `CREATE INDEX idx_${join.table}_${join.column} ON ${join.table}(${join.column})`
        })
      }
    }

    // 4. ORDER BY 최적화 검사
    const orderByColumns = this.extractOrderByColumns(sql)
    if (orderByColumns.length > 0) {
      const orderByIndex = `idx_${orderByColumns[0].table}_${orderByColumns.map(c => c.column).join('_')}`
      const hasOrderIndex = await this.checkIndexExists(orderByColumns[0].table, orderByColumns.map(c => c.column))
      
      if (!hasOrderIndex) {
        suggestions.push({
          type: 'index',
          priority: 'medium',
          message: 'ORDER BY 절의 성능 향상을 위한 인덱스 생성을 권장합니다',
          suggestedIndex: `CREATE INDEX ${orderByIndex} ON ${orderByColumns[0].table}(${orderByColumns.map(c => c.column).join(', ')})`
        })
      }
    }

    // 5. LIMIT 없는 대용량 쿼리 검사
    if (!normalizedSql.includes('limit') && normalizedSql.includes('select')) {
      const estimatedRows = await this.estimateQueryRows(sql)
      if (estimatedRows > 1000) {
        suggestions.push({
          type: 'rewrite',
          priority: 'medium',
          message: '대용량 결과셋에 LIMIT 절 추가를 권장합니다',
          suggestedSql: sql + ' LIMIT 100'
        })
      }
    }

    // 6. 서브쿼리 최적화 검사
    if (normalizedSql.includes('in (select')) {
      suggestions.push({
        type: 'rewrite',
        priority: 'medium',
        message: 'IN (SELECT ...) 서브쿼리를 JOIN으로 재작성하면 성능이 개선될 수 있습니다'
      })
    }

    return suggestions
  }

  /**
   * 느린 쿼리 보고서 생성
   */
  async generateSlowQueryReport(days: number = 7): Promise<SlowQueryReport[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const slowQueries = await this.db.prepare(`
      SELECT 
        sql_hash,
        sql,
        COUNT(*) as execution_count,
        AVG(execution_time) as avg_execution_time,
        MAX(execution_time) as max_execution_time,
        MAX(timestamp) as last_executed
      FROM query_performance_log 
      WHERE timestamp >= ? AND execution_time > ?
      GROUP BY sql_hash, sql
      ORDER BY avg_execution_time DESC, execution_count DESC
      LIMIT 20
    `).bind(startDate.toISOString(), this.slowQueryThreshold).all()

    const reports: SlowQueryReport[] = []

    for (const query of slowQueries.results || []) {
      const suggestions = await this.analyzeAndOptimizeQuery(query.sql as string)
      
      reports.push({
        query: query.sql as string,
        avgExecutionTime: query.avg_execution_time as number,
        totalExecutions: query.execution_count as number,
        maxExecutionTime: query.max_execution_time as number,
        lastExecuted: query.last_executed as string,
        suggestions
      })
    }

    return reports
  }

  /**
   * 데이터베이스 통계 업데이트
   */
  async updateDatabaseStatistics(): Promise<void> {
    try {
      // SQLite ANALYZE 명령 실행 (쿼리 플래너 최적화)
      await this.db.prepare('ANALYZE').run()
      
      // 테이블별 통계 수집
      const tables = await this.getAllTables()
      
      for (const table of tables) {
        const stats = await this.collectTableStatistics(table)
        await this.saveTableStatistics(table, stats)
      }

      console.log(`📊 데이터베이스 통계 업데이트 완료: ${tables.length}개 테이블`)
      
    } catch (error) {
      console.error('❌ 통계 업데이트 실패:', error)
    }
  }

  /**
   * 인덱스 사용률 분석
   */
  async analyzeIndexUsage(days: number = 30): Promise<Array<{
    indexName: string
    tableName: string
    usageCount: number
    lastUsed: string | null
    effectiveness: number
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 모든 인덱스 조회
    const indexes = await this.db.prepare(`
      SELECT 
        name as index_name,
        tbl_name as table_name
      FROM sqlite_master 
      WHERE type = 'index' 
      AND name NOT LIKE 'sqlite_autoindex_%'
    `).all()

    const usageStats = []

    for (const index of indexes.results || []) {
      // 해당 인덱스 사용 통계 조회
      const usage = await this.db.prepare(`
        SELECT 
          COUNT(*) as usage_count,
          MAX(timestamp) as last_used,
          AVG(execution_time) as avg_execution_time
        FROM query_performance_log 
        WHERE timestamp >= ? 
        AND json_extract(indexes_used, '$') LIKE '%' || ? || '%'
      `).bind(startDate.toISOString(), index.index_name).first()

      // 효율성 계산 (사용 빈도 vs 성능 향상)
      const effectiveness = this.calculateIndexEffectiveness(
        usage?.usage_count as number || 0,
        usage?.avg_execution_time as number || 0
      )

      usageStats.push({
        indexName: index.index_name as string,
        tableName: index.table_name as string,
        usageCount: usage?.usage_count as number || 0,
        lastUsed: usage?.last_used as string || null,
        effectiveness
      })
    }

    return usageStats.sort((a, b) => b.effectiveness - a.effectiveness)
  }

  /**
   * 자동 인덱스 생성 제안
   */
  async suggestAutoIndexes(): Promise<string[]> {
    const suggestions = []

    // 1. 자주 사용되는 WHERE 조건 분석
    const frequentConditions = await this.db.prepare(`
      SELECT 
        json_extract(query_pattern, '$.table') as table_name,
        json_extract(query_pattern, '$.where_columns') as where_columns,
        COUNT(*) as usage_count,
        AVG(execution_time) as avg_execution_time
      FROM query_performance_log 
      WHERE timestamp >= date('now', '-30 days')
      AND query_pattern IS NOT NULL
      GROUP BY table_name, where_columns
      HAVING usage_count >= 10 AND avg_execution_time > 100
      ORDER BY usage_count DESC, avg_execution_time DESC
    `).all()

    for (const condition of frequentConditions.results || []) {
      const tableName = condition.table_name as string
      const columns = JSON.parse(condition.where_columns as string || '[]')
      
      if (columns.length > 0) {
        const indexName = `idx_${tableName}_${columns.join('_')}_auto`
        const createIndex = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columns.join(', ')})`
        suggestions.push(createIndex)
      }
    }

    // 2. JOIN 조건 분석
    const frequentJoins = await this.db.prepare(`
      SELECT 
        json_extract(query_pattern, '$.join_conditions') as join_conditions,
        COUNT(*) as usage_count,
        AVG(execution_time) as avg_execution_time
      FROM query_performance_log 
      WHERE timestamp >= date('now', '-30 days')
      AND json_extract(query_pattern, '$.join_conditions') IS NOT NULL
      GROUP BY join_conditions
      HAVING usage_count >= 5 AND avg_execution_time > 200
    `).all()

    for (const join of frequentJoins.results || []) {
      const conditions = JSON.parse(join.join_conditions as string || '[]')
      
      for (const condition of conditions) {
        const indexName = `idx_${condition.table}_${condition.column}_join_auto`
        const createIndex = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${condition.table}(${condition.column})`
        suggestions.push(createIndex)
      }
    }

    return suggestions
  }

  /**
   * 실시간 성능 모니터링 대시보드 데이터
   */
  async getPerformanceDashboardData(): Promise<{
    currentConnections: number
    avgQueryTime: number
    slowQueries: number
    cacheHitRate: number
    topSlowQueries: Array<{query: string, avgTime: number, count: number}>
  }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const stats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_queries,
        AVG(execution_time) as avg_execution_time,
        COUNT(CASE WHEN execution_time > ? THEN 1 END) as slow_queries,
        COUNT(CASE WHEN cache_hit = 1 THEN 1 END) as cache_hits
      FROM query_performance_log 
      WHERE timestamp >= ?
    `).bind(this.slowQueryThreshold, oneHourAgo.toISOString()).first()

    const topSlow = await this.db.prepare(`
      SELECT 
        sql,
        AVG(execution_time) as avg_time,
        COUNT(*) as count
      FROM query_performance_log 
      WHERE timestamp >= ? AND execution_time > ?
      GROUP BY sql_hash
      ORDER BY avg_time DESC, count DESC
      LIMIT 5
    `).bind(oneHourAgo.toISOString(), this.slowQueryThreshold).all()

    return {
      currentConnections: 1, // D1은 단일 연결
      avgQueryTime: stats?.avg_execution_time as number || 0,
      slowQueries: stats?.slow_queries as number || 0,
      cacheHitRate: stats?.total_queries ? 
        ((stats.cache_hits as number || 0) / (stats.total_queries as number)) * 100 : 0,
      topSlowQueries: (topSlow.results || []).map(q => ({
        query: (q.sql as string).substring(0, 100) + '...',
        avgTime: q.avg_time as number,
        count: q.count as number
      }))
    }
  }

  // ========================================
  // 유틸리티 메소드들
  // ========================================

  private generateQueryId(sql: string): string {
    // 쿼리의 해시값 생성
    return btoa(sql).substring(0, 16)
  }

  private isCacheValid(cached: QueryPerformanceMetrics): boolean {
    const now = Date.now()
    const cacheTime = new Date(cached.timestamp).getTime()
    return (now - cacheTime) < 300000 // 5분 캐시
  }

  private estimateRowsScanned(sql: string, rowsReturned: number): number {
    // 실제로는 EXPLAIN QUERY PLAN 결과를 파싱해야 함
    // 여기서는 간단한 추정
    if (sql.toLowerCase().includes('where')) {
      return rowsReturned * 2 // 필터링된 경우
    }
    return rowsReturned * 10 // 전체 스캔 추정
  }

  private async getIndexesUsed(sql: string): Promise<string[]> {
    try {
      // SQLite EXPLAIN QUERY PLAN 실행
      const plan = await this.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all()
      const indexes: string[] = []
      
      for (const step of plan.results || []) {
        const detail = step.detail as string || ''
        if (detail.includes('USING INDEX')) {
          const match = detail.match(/USING INDEX (\w+)/)
          if (match) indexes.push(match[1])
        }
      }
      
      return indexes
    } catch {
      return []
    }
  }

  private async logPerformanceMetrics(metrics: QueryPerformanceMetrics): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO query_performance_log 
        (query_id, sql_hash, sql, execution_time, rows_returned, rows_scanned, 
         indexes_used, cache_hit, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        metrics.queryId,
        this.generateQueryId(metrics.sql),
        metrics.sql,
        metrics.executionTime,
        metrics.rowsReturned,
        metrics.rowsScanned,
        JSON.stringify(metrics.indexesUsed),
        metrics.cacheHit ? 1 : 0,
        metrics.timestamp
      ).run()
    } catch (error) {
      // 로깅 실패는 조용히 처리
      console.warn('성능 메트릭 로깅 실패:', error)
    }
  }

  private async handleSlowQuery(metrics: QueryPerformanceMetrics): Promise<void> {
    console.warn(`🐌 느린 쿼리 감지 (${metrics.executionTime.toFixed(2)}ms):`, {
      queryId: metrics.queryId,
      sql: metrics.sql.substring(0, 200) + '...',
      rowsReturned: metrics.rowsReturned,
      rowsScanned: metrics.rowsScanned
    })

    // 자동 최적화 제안 생성
    const suggestions = await this.analyzeAndOptimizeQuery(metrics.sql)
    if (suggestions.length > 0) {
      console.log('💡 최적화 제안:', suggestions)
    }
  }

  private extractWhereConditions(sql: string): Array<{
    table: string
    column: string
    selectivity: 'high' | 'medium' | 'low'
  }> {
    // 간단한 WHERE 조건 추출 (실제로는 SQL 파서 사용 권장)
    const conditions: Array<{table: string, column: string, selectivity: 'high' | 'medium' | 'low'}> = []
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:GROUP|ORDER|LIMIT|$)/i)
    
    if (whereMatch) {
      const whereClause = whereMatch[1]
      // 등호 조건 (높은 선택성)
      const equalityMatches = whereClause.match(/(\w+)\.(\w+)\s*=/g)
      if (equalityMatches) {
        for (const match of equalityMatches) {
          const [, table, column] = match.match(/(\w+)\.(\w+)/) || []
          if (table && column) {
            conditions.push({ table, column, selectivity: 'high' })
          }
        }
      }
    }
    
    return conditions
  }

  private extractJoins(sql: string): Array<{table: string, column: string}> {
    const joins: Array<{table: string, column: string}> = []
    const joinMatches = sql.match(/JOIN\s+(\w+).*?ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/gi)
    
    if (joinMatches) {
      for (const match of joinMatches) {
        const parts = match.match(/JOIN\s+(\w+).*?ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/i)
        if (parts) {
          joins.push({ table: parts[1], column: parts[2] })
          joins.push({ table: parts[1], column: parts[3] })
        }
      }
    }
    
    return joins
  }

  private extractOrderByColumns(sql: string): Array<{table: string, column: string}> {
    const columns: Array<{table: string, column: string}> = []
    const orderByMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/i)
    
    if (orderByMatch) {
      const orderByClause = orderByMatch[1]
      const columnMatches = orderByClause.match(/(\w+)\.(\w+)/g)
      
      if (columnMatches) {
        for (const match of columnMatches) {
          const [, table, column] = match.match(/(\w+)\.(\w+)/) || []
          if (table && column) {
            columns.push({ table, column })
          }
        }
      }
    }
    
    return columns
  }

  private async checkIndexExists(table: string, columns: string | string[]): Promise<boolean> {
    const columnList = Array.isArray(columns) ? columns.join('_') : columns
    
    const result = await this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type = 'index' 
      AND tbl_name = ? 
      AND (name LIKE '%' || ? || '%' OR sql LIKE '%' || ? || '%')
    `).bind(table, columnList, columnList).first()
    
    return !!result
  }

  private async estimateQueryRows(sql: string): Promise<number> {
    try {
      // 실제 실행 없이 행 수 추정 (EXPLAIN QUERY PLAN 활용)
      return 1000 // 임시값
    } catch {
      return 0
    }
  }

  private async getAllTables(): Promise<string[]> {
    const result = await this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
    `).all()
    
    return result.results.map((row: any) => row.name)
  }

  private async collectTableStatistics(table: string): Promise<{
    rowCount: number
    avgRowSize: number
    indexCount: number
  }> {
    const rowCount = await this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first()
    const indexes = await this.db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type = 'index' AND tbl_name = ?
    `).bind(table).first()

    return {
      rowCount: rowCount?.count as number || 0,
      avgRowSize: 100, // 추정값
      indexCount: indexes?.count as number || 0
    }
  }

  private async saveTableStatistics(table: string, stats: any): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO table_statistics 
      (table_name, row_count, avg_row_size, index_count, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      table,
      stats.rowCount,
      stats.avgRowSize,
      stats.indexCount,
      new Date().toISOString()
    ).run()
  }

  private calculateIndexEffectiveness(usageCount: number, avgExecutionTime: number): number {
    // 사용 빈도와 성능 향상을 종합한 효율성 점수 (0-100)
    const usageScore = Math.min(usageCount / 100 * 50, 50) // 최대 50점
    const performanceScore = Math.max(50 - (avgExecutionTime / 100), 0) // 최대 50점
    return usageScore + performanceScore
  }
}

/**
 * 쿼리 옵티마이저 팩토리 함수
 */
export function createQueryOptimizer(database: D1Database, options?: {
  slowQueryThreshold?: number
  enableLogging?: boolean
}): DatabaseQueryOptimizer {
  return new DatabaseQueryOptimizer(database, options)
}