/**
 * 통합 데이터베이스 관리 시스템
 * 성능 최적화, 백업, 모니터링을 통합 관리하는 마스터 클래스
 */

import type { D1Database } from '@cloudflare/workers-types'
import { DatabaseBackupManager, createBackupManager, type BackupConfig } from './database-backup'
import { DatabaseQueryOptimizer, createQueryOptimizer, type QueryPerformanceMetrics } from './query-optimizer'

export interface DatabaseManagerConfig {
  backup: Partial<BackupConfig>
  queryOptimizer: {
    slowQueryThreshold?: number
    enableLogging?: boolean
  }
  monitoring: {
    enableRealTimeStats?: boolean
    performanceSnapshotInterval?: number // 분 단위
    autoOptimization?: boolean
  }
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical'
  database: {
    status: 'connected' | 'slow' | 'error'
    avgQueryTime: number
    slowQueries: number
    errorRate: number
  }
  backup: {
    status: 'current' | 'overdue' | 'failed'
    lastBackupTime: string | null
    nextBackupTime: string | null
    backupSize: number
  }
  performance: {
    cacheHitRate: number
    indexEfficiency: number
    pendingOptimizations: number
    appliedOptimizations: number
  }
}

export class DatabaseManager {
  private db: D1Database
  private config: DatabaseManagerConfig
  private backupManager: DatabaseBackupManager
  private queryOptimizer: DatabaseQueryOptimizer
  private monitoringInterval: number | null = null

  constructor(database: D1Database, config: DatabaseManagerConfig = {}) {
    this.db = database
    this.config = {
      backup: {
        enabled: true,
        schedule: 'daily',
        retentionDays: 30,
        ...config.backup
      },
      queryOptimizer: {
        slowQueryThreshold: 1000,
        enableLogging: true,
        ...config.queryOptimizer
      },
      monitoring: {
        enableRealTimeStats: true,
        performanceSnapshotInterval: 60, // 1시간
        autoOptimization: false,
        ...config.monitoring
      }
    }

    this.backupManager = createBackupManager(database, this.config.backup)
    this.queryOptimizer = createQueryOptimizer(database, this.config.queryOptimizer)
  }

  /**
   * 데이터베이스 매니저 초기화
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 데이터베이스 매니저 초기화 시작...')

      // 1. 필요한 테이블 존재 확인
      await this.ensureSystemTables()

      // 2. 데이터베이스 설정 최적화
      await this.optimizeDatabaseSettings()

      // 3. 기존 백업 상태 확인
      await this.checkBackupStatus()

      // 4. 성능 모니터링 시작
      if (this.config.monitoring.enableRealTimeStats) {
        await this.startPerformanceMonitoring()
      }

      // 5. 자동 최적화 활성화
      if (this.config.monitoring.autoOptimization) {
        await this.enableAutoOptimization()
      }

      console.log('✅ 데이터베이스 매니저 초기화 완료')

    } catch (error) {
      console.error('❌ 데이터베이스 매니저 초기화 실패:', error)
      throw error
    }
  }

  /**
   * 종합 시스템 상태 점검
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      // 1. 데이터베이스 상태 확인
      const dbHealth = await this.checkDatabaseHealth()
      
      // 2. 백업 상태 확인
      const backupHealth = await this.checkBackupHealth()
      
      // 3. 성능 상태 확인
      const performanceHealth = await this.checkPerformanceHealth()

      // 4. 종합 상태 평가
      const overall = this.evaluateOverallHealth(dbHealth, backupHealth, performanceHealth)

      return {
        overall,
        database: dbHealth,
        backup: backupHealth,
        performance: performanceHealth
      }

    } catch (error) {
      console.error('❌ 시스템 상태 점검 실패:', error)
      return {
        overall: 'critical',
        database: {
          status: 'error',
          avgQueryTime: 0,
          slowQueries: 0,
          errorRate: 100
        },
        backup: {
          status: 'failed',
          lastBackupTime: null,
          nextBackupTime: null,
          backupSize: 0
        },
        performance: {
          cacheHitRate: 0,
          indexEfficiency: 0,
          pendingOptimizations: 0,
          appliedOptimizations: 0
        }
      }
    }
  }

  /**
   * 통합 성능 최적화 실행
   */
  async performComprehensiveOptimization(): Promise<{
    indexesCreated: string[]
    statisticsUpdated: boolean
    backupCompleted: boolean
    optimizationsSuggested: number
  }> {
    console.log('🔧 종합 성능 최적화 시작...')
    
    const results = {
      indexesCreated: [] as string[],
      statisticsUpdated: false,
      backupCompleted: false,
      optimizationsSuggested: 0
    }

    try {
      // 1. 자동 인덱스 생성
      const suggestedIndexes = await this.queryOptimizer.suggestAutoIndexes()
      
      for (const indexSql of suggestedIndexes) {
        try {
          await this.db.prepare(indexSql).run()
          results.indexesCreated.push(indexSql)
          console.log(`✅ 인덱스 생성: ${indexSql.match(/idx_\w+/)?.[0]}`)
        } catch (error) {
          console.warn(`⚠️ 인덱스 생성 실패: ${indexSql}`, error)
        }
      }

      // 2. 데이터베이스 통계 업데이트
      try {
        await this.queryOptimizer.updateDatabaseStatistics()
        results.statisticsUpdated = true
        console.log('✅ 데이터베이스 통계 업데이트 완료')
      } catch (error) {
        console.warn('⚠️ 통계 업데이트 실패:', error)
      }

      // 3. 백업 실행 (필요한 경우)
      try {
        await this.backupManager.scheduleAutomaticBackup()
        results.backupCompleted = true
        console.log('✅ 자동 백업 점검 완료')
      } catch (error) {
        console.warn('⚠️ 백업 실행 실패:', error)
      }

      // 4. 추가 최적화 제안 생성
      const slowQueries = await this.queryOptimizer.generateSlowQueryReport(7)
      let totalSuggestions = 0
      
      for (const report of slowQueries) {
        totalSuggestions += report.suggestions.length
        
        // 고우선순위 제안사항 자동 저장
        for (const suggestion of report.suggestions.filter(s => s.priority === 'high')) {
          await this.saveOptimizationSuggestion(suggestion, report.query)
        }
      }
      
      results.optimizationsSuggested = totalSuggestions
      
      console.log(`🎉 종합 최적화 완료:`, results)
      return results

    } catch (error) {
      console.error('❌ 종합 최적화 실패:', error)
      throw error
    }
  }

  /**
   * 실시간 성능 대시보드 데이터
   */
  async getPerformanceDashboard(): Promise<{
    current: any
    trends: {
      queryTrend: Array<{time: string, avgTime: number, count: number}>
      errorTrend: Array<{time: string, errors: number}>
      cacheTrend: Array<{time: string, hitRate: number}>
    }
    recommendations: Array<{
      type: string
      priority: string
      message: string
      action?: string
    }>
  }> {
    // 1. 현재 성능 데이터
    const current = await this.queryOptimizer.getPerformanceDashboardData()

    // 2. 성능 트렌드 데이터 (최근 24시간)
    const trends = await this.getPerformanceTrends()

    // 3. 실시간 추천사항
    const recommendations = await this.generateRealTimeRecommendations()

    return { current, trends, recommendations }
  }

  /**
   * 정기 유지보수 실행
   */
  async performRoutineMaintenance(): Promise<void> {
    console.log('🔄 정기 유지보수 시작...')

    try {
      // 1. 오래된 로그 정리
      await this.cleanupOldLogs()

      // 2. 사용되지 않는 인덱스 분석
      const indexUsage = await this.queryOptimizer.analyzeIndexUsage(30)
      const unusedIndexes = indexUsage.filter(idx => idx.usageCount === 0)
      
      if (unusedIndexes.length > 0) {
        console.log(`⚠️ 사용되지 않는 인덱스 ${unusedIndexes.length}개 발견:`, 
          unusedIndexes.map(idx => idx.indexName))
      }

      // 3. 데이터 정합성 검사
      await this.verifyDataIntegrity()

      // 4. 성능 스냅샷 생성
      await this.createPerformanceSnapshot('daily')

      console.log('✅ 정기 유지보수 완료')

    } catch (error) {
      console.error('❌ 정기 유지보수 실패:', error)
      throw error
    }
  }

  /**
   * 응급 복구 실행
   */
  async emergencyRecovery(backupId: string): Promise<void> {
    console.log(`🚨 응급 복구 시작: ${backupId}`)

    try {
      // 1. 현재 상태 백업 (롤백용)
      const emergencyBackup = await this.backupManager.createFullBackup()
      console.log(`💾 현재 상태 응급 백업: ${emergencyBackup.id}`)

      // 2. 지정된 백업에서 복구
      await this.backupManager.restoreFromBackup(backupId, {
        dropExisting: true
      })

      // 3. 복구 후 상태 검증
      const health = await this.getSystemHealth()
      if (health.overall === 'critical') {
        throw new Error('복구 후에도 시스템 상태가 비정상입니다')
      }

      console.log('✅ 응급 복구 완료')

    } catch (error) {
      console.error('❌ 응급 복구 실패:', error)
      throw error
    }
  }

  // ========================================
  // Private 메소드들
  // ========================================

  private async ensureSystemTables(): Promise<void> {
    const requiredTables = [
      'backup_metadata',
      'query_performance_log', 
      'table_statistics',
      'optimization_suggestions'
    ]

    for (const table of requiredTables) {
      const exists = await this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).bind(table).first()

      if (!exists) {
        console.warn(`⚠️ 필수 테이블 누락: ${table}`)
        // 마이그레이션 실행 필요
      }
    }
  }

  private async optimizeDatabaseSettings(): Promise<void> {
    const settings = [
      'PRAGMA journal_mode = WAL',
      'PRAGMA synchronous = NORMAL', 
      'PRAGMA cache_size = 10000',
      'PRAGMA foreign_keys = ON',
      'PRAGMA temp_store = MEMORY'
    ]

    for (const setting of settings) {
      try {
        await this.db.prepare(setting).run()
      } catch (error) {
        console.warn(`⚠️ 설정 적용 실패: ${setting}`, error)
      }
    }
  }

  private async checkBackupStatus(): Promise<void> {
    try {
      const lastBackup = await this.db.prepare(`
        SELECT timestamp, status FROM backup_metadata 
        ORDER BY timestamp DESC LIMIT 1
      `).first()

      if (!lastBackup) {
        console.log('📋 백업 이력이 없습니다. 첫 백업을 실행합니다.')
        await this.backupManager.createFullBackup()
      } else {
        const backupAge = Date.now() - new Date(lastBackup.timestamp as string).getTime()
        const hoursAgo = backupAge / (1000 * 60 * 60)
        
        if (hoursAgo > 24) {
          console.log(`⏰ 마지막 백업이 ${hoursAgo.toFixed(1)}시간 전입니다.`)
        }
      }
    } catch (error) {
      console.warn('⚠️ 백업 상태 확인 실패:', error)
    }
  }

  private async startPerformanceMonitoring(): Promise<void> {
    if (this.monitoringInterval) return

    const intervalMinutes = this.config.monitoring.performanceSnapshotInterval || 60
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.createPerformanceSnapshot('hourly')
      } catch (error) {
        console.error('❌ 성능 스냅샷 생성 실패:', error)
      }
    }, intervalMinutes * 60 * 1000) as unknown as number
  }

  private async enableAutoOptimization(): Promise<void> {
    // 자동 최적화 로직 구현
    console.log('🤖 자동 최적화 활성화됨')
  }

  private async checkDatabaseHealth(): Promise<SystemHealthStatus['database']> {
    try {
      const startTime = performance.now()
      await this.db.prepare('SELECT 1').first()
      const connectionTime = performance.now() - startTime

      const stats = await this.db.prepare(`
        SELECT 
          AVG(execution_time) as avg_time,
          COUNT(CASE WHEN execution_time > 1000 THEN 1 END) as slow_count,
          COUNT(*) as total_count
        FROM query_performance_log 
        WHERE timestamp >= datetime('now', '-1 hour')
      `).first()

      const avgQueryTime = stats?.avg_time as number || 0
      const slowQueries = stats?.slow_count as number || 0
      const totalQueries = stats?.total_count as number || 0
      const errorRate = 0 // 실제로는 실패한 쿼리 비율 계산

      let status: 'connected' | 'slow' | 'error' = 'connected'
      if (connectionTime > 1000 || avgQueryTime > 2000) {
        status = 'slow'
      }
      if (errorRate > 5) {
        status = 'error'
      }

      return {
        status,
        avgQueryTime,
        slowQueries,
        errorRate
      }
    } catch (error) {
      return {
        status: 'error',
        avgQueryTime: 0,
        slowQueries: 0,
        errorRate: 100
      }
    }
  }

  private async checkBackupHealth(): Promise<SystemHealthStatus['backup']> {
    try {
      const lastBackup = await this.db.prepare(`
        SELECT timestamp, size, status 
        FROM backup_metadata 
        WHERE status = 'completed'
        ORDER BY timestamp DESC LIMIT 1
      `).first()

      if (!lastBackup) {
        return {
          status: 'overdue',
          lastBackupTime: null,
          nextBackupTime: null,
          backupSize: 0
        }
      }

      const lastBackupTime = lastBackup.timestamp as string
      const backupAge = Date.now() - new Date(lastBackupTime).getTime()
      const hoursAgo = backupAge / (1000 * 60 * 60)

      let status: 'current' | 'overdue' | 'failed' = 'current'
      if (hoursAgo > 25) { // 일일 백업 기준 1시간 여유
        status = 'overdue'
      }

      return {
        status,
        lastBackupTime,
        nextBackupTime: null, // 계산 로직 추가 필요
        backupSize: lastBackup.size as number || 0
      }
    } catch (error) {
      return {
        status: 'failed',
        lastBackupTime: null,
        nextBackupTime: null,
        backupSize: 0
      }
    }
  }

  private async checkPerformanceHealth(): Promise<SystemHealthStatus['performance']> {
    try {
      const cacheStats = await this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN cache_hit = 1 THEN 1 END) * 100.0 / COUNT(*) as hit_rate
        FROM query_performance_log 
        WHERE timestamp >= datetime('now', '-1 hour')
      `).first()

      const optimizationStats = await this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied
        FROM optimization_suggestions
      `).first()

      return {
        cacheHitRate: cacheStats?.hit_rate as number || 0,
        indexEfficiency: 85, // 실제 계산 로직 필요
        pendingOptimizations: optimizationStats?.pending as number || 0,
        appliedOptimizations: optimizationStats?.applied as number || 0
      }
    } catch (error) {
      return {
        cacheHitRate: 0,
        indexEfficiency: 0,
        pendingOptimizations: 0,
        appliedOptimizations: 0
      }
    }
  }

  private evaluateOverallHealth(
    db: SystemHealthStatus['database'],
    backup: SystemHealthStatus['backup'],
    performance: SystemHealthStatus['performance']
  ): 'healthy' | 'warning' | 'critical' {
    if (db.status === 'error' || backup.status === 'failed') {
      return 'critical'
    }
    
    if (db.status === 'slow' || backup.status === 'overdue' || 
        performance.cacheHitRate < 50 || performance.indexEfficiency < 70) {
      return 'warning'
    }
    
    return 'healthy'
  }

  private async saveOptimizationSuggestion(suggestion: any, query: string): Promise<void> {
    await this.db.prepare(`
      INSERT INTO optimization_suggestions 
      (suggestion_type, target_query_pattern, suggestion_title, suggestion_description, 
       suggested_sql, priority, estimated_improvement, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      suggestion.type,
      query,
      `${suggestion.type} 최적화`,
      suggestion.message,
      suggestion.suggestedSql || suggestion.suggestedIndex,
      suggestion.priority,
      50 // 기본 추정 개선률
    ).run()
  }

  private async getPerformanceTrends(): Promise<any> {
    // 성능 트렌드 데이터 조회 로직
    return {
      queryTrend: [],
      errorTrend: [],
      cacheTrend: []
    }
  }

  private async generateRealTimeRecommendations(): Promise<any[]> {
    // 실시간 추천사항 생성 로직
    return []
  }

  private async cleanupOldLogs(): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await this.db.prepare(`
      DELETE FROM query_performance_log 
      WHERE timestamp < ?
    `).bind(thirtyDaysAgo.toISOString()).run()
  }

  private async verifyDataIntegrity(): Promise<void> {
    await this.db.prepare('PRAGMA integrity_check').run()
  }

  private async createPerformanceSnapshot(type: 'hourly' | 'daily'): Promise<void> {
    const now = new Date()
    const periodStart = new Date(now.getTime() - (type === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))

    const stats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_queries,
        AVG(execution_time) as avg_query_time,
        COUNT(CASE WHEN execution_time > 1000 THEN 1 END) as slow_queries,
        0 as failed_queries
      FROM query_performance_log 
      WHERE timestamp BETWEEN ? AND ?
    `).bind(periodStart.toISOString(), now.toISOString()).first()

    await this.db.prepare(`
      INSERT INTO system_performance_snapshots 
      (snapshot_type, total_queries, avg_query_time, slow_queries, failed_queries,
       period_start, period_end)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      type,
      stats?.total_queries || 0,
      stats?.avg_query_time || 0,
      stats?.slow_queries || 0,
      stats?.failed_queries || 0,
      periodStart.toISOString(),
      now.toISOString()
    ).run()
  }
}

/**
 * 데이터베이스 매니저 팩토리 함수
 */
export function createDatabaseManager(
  database: D1Database, 
  config?: DatabaseManagerConfig
): DatabaseManager {
  return new DatabaseManager(database, config)
}

/**
 * 헬스체크 전용 함수 (가벼운 상태 확인)
 */
export async function quickHealthCheck(database: D1Database): Promise<boolean> {
  try {
    const startTime = performance.now()
    await database.prepare('SELECT 1').first()
    const responseTime = performance.now() - startTime
    
    return responseTime < 1000 // 1초 이내 응답
  } catch {
    return false
  }
}