// 생성 이력 저장 및 관리 서비스
// D1 데이터베이스를 사용한 사용자별 콘텐츠 생성 이력 관리

import type { AuthTokenPayload } from './auth-service'

// 타입 정의
export interface ContentGenerationHistory {
  id: string;
  userId: string;
  productDescription: string;
  generationOptions: any;
  
  // 생성된 콘텐츠들
  blogTitle?: string;
  blogContent?: string;
  blogTags?: string[];
  blogSeoKeywords?: string[];
  blogReadingTime?: number;
  
  socialGraphicUrl?: string;
  socialGraphicDescription?: string;
  socialGraphicPrompt?: string;
  socialGraphicDimensions?: string;
  
  promoVideoUrl?: string;
  promoVideoDuration?: number;
  promoVideoDescription?: string;
  promoVideoThumbnail?: string;
  promoVideoPrompt?: string;
  
  podcastScript?: string;
  podcastAudioUrl?: string;
  podcastDuration?: number;
  podcastDescription?: string;
  
  // 메타데이터
  processingTime: number;
  realAiUsed: number;
  totalAiCalls: number;
  failedAiCalls: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IndividualGenerationHistory {
  id: string;
  userId: string;
  contentType: 'blog' | 'image' | 'video' | 'podcast';
  productDescription: string;
  generationOptions: any;
  contentData: any; // 생성된 콘텐츠 데이터
  processingTime: number;
  realAiUsed: boolean;
  status: string;
  createdAt: string;
}

export interface UserUsage {
  id: string;
  userId: string;
  feature: string;
  usageCount: number;
  quotaLimit: number;
  resetDate: string;
  updatedAt: string;
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  contentType?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export interface HistoryStats {
  totalGenerations: number;
  thisMonthGenerations: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  successRate: number;
  realAiUsageRate: number;
  contentTypeBreakdown: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    processingTime: number;
  }>;
}

export class HistoryService {
  private db: D1Database;

  constructor(database?: D1Database) {
    this.db = database as D1Database;
    console.log('📊 HistoryService initialized');
  }

  // ID 생성 헬퍼
  private generateId(prefix: string = 'gen'): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
  }

  // 콘텐츠 생성 이력 저장
  public async saveContentGeneration(
    user: AuthTokenPayload, 
    generationData: any, 
    request: Request
  ): Promise<{ success: boolean; historyId?: string; error?: string }> {
    if (!this.db) {
      console.warn('Database not available, skipping history save');
      return { success: false, error: 'Database not available' };
    }

    try {
      const historyId = this.generateId('cgen');
      const now = new Date().toISOString();
      
      // 클라이언트 정보 추출
      const ipAddress = request.headers.get('CF-Connecting-IP') || 
                       request.headers.get('X-Forwarded-For') || 
                       'unknown';
      const userAgent = request.headers.get('User-Agent') || 'unknown';

      // 생성 데이터 파싱
      const { 
        blog, 
        socialGraphic, 
        promoVideo, 
        podcast,
        productDescription,
        processingTime,
        realAIUsed = 0,
        totalRealAICalls = 0,
        failedRealAICalls = 0,
        generatedAt 
      } = generationData;

      await this.db.prepare(`
        INSERT INTO content_generations (
          id, user_id, product_description, generation_options,
          blog_title, blog_content, blog_tags, blog_seo_keywords, blog_reading_time,
          social_graphic_url, social_graphic_description, social_graphic_prompt, social_graphic_dimensions,
          promo_video_url, promo_video_duration, promo_video_description, promo_video_thumbnail, promo_video_prompt,
          podcast_script, podcast_audio_url, podcast_duration, podcast_description,
          processing_time, real_ai_used, total_ai_calls, failed_ai_calls,
          status, created_at, updated_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        historyId, user.sub, productDescription, JSON.stringify(generationData.options || {}),
        blog?.title, blog?.content, JSON.stringify(blog?.tags || []), JSON.stringify(blog?.seoKeywords || []), blog?.readingTime,
        socialGraphic?.imageUrl, socialGraphic?.description, socialGraphic?.prompt, socialGraphic?.dimensions,
        promoVideo?.videoUrl, promoVideo?.duration, promoVideo?.description, promoVideo?.thumbnail, promoVideo?.prompt,
        podcast?.scriptText, podcast?.audioUrl, podcast?.duration, podcast?.description,
        processingTime, realAIUsed, totalRealAICalls, failedRealAICalls,
        'completed', generatedAt || now, now, ipAddress, userAgent
      ).run();

      // 사용량 업데이트
      await this.updateUserUsage(user.sub, 'content-generation');

      console.log(`✅ Content generation history saved: ${historyId} for user ${user.email}`);
      return { success: true, historyId };

    } catch (error) {
      console.error('❌ Failed to save content generation history:', error);
      return { success: false, error: error.message };
    }
  }

  // 개별 콘텐츠 생성 이력 저장
  public async saveIndividualGeneration(
    user: AuthTokenPayload,
    contentType: string,
    generationData: any,
    request: Request
  ): Promise<{ success: boolean; historyId?: string; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const historyId = this.generateId('igen');
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO individual_generations (
          id, user_id, content_type, product_description, generation_options,
          content_data, processing_time, real_ai_used, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        historyId, user.sub, contentType, generationData.productDescription,
        JSON.stringify(generationData.options || {}), JSON.stringify(generationData.content),
        generationData.processingTime || 0, generationData.realAI || false, 'completed', now
      ).run();

      // 사용량 업데이트
      await this.updateUserUsage(user.sub, `${contentType}-generation`);

      console.log(`✅ Individual generation history saved: ${historyId} (${contentType}) for user ${user.email}`);
      return { success: true, historyId };

    } catch (error) {
      console.error('❌ Failed to save individual generation history:', error);
      return { success: false, error: error.message };
    }
  }

  // 사용자 이력 조회 (페이지네이션 지원)
  public async getUserHistory(
    userId: string, 
    filters: HistoryFilters = {}
  ): Promise<{
    success: boolean; 
    data?: {
      contentGenerations: ContentGenerationHistory[];
      individualGenerations: IndividualGenerationHistory[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
    }; 
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { page = 1, limit = 20, startDate, endDate, status, searchTerm } = filters;
      const offset = (page - 1) * limit;

      // 조건절 구성
      let whereConditions = ['user_id = ?'];
      let params = [userId];

      if (startDate) {
        whereConditions.push('created_at >= ?');
        params.push(startDate);
      }
      if (endDate) {
        whereConditions.push('created_at <= ?');
        params.push(endDate);
      }
      if (status) {
        whereConditions.push('status = ?');
        params.push(status);
      }
      if (searchTerm) {
        whereConditions.push('product_description LIKE ?');
        params.push(`%${searchTerm}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      // 통합 콘텐츠 생성 이력
      const contentGenerations = await this.db.prepare(`
        SELECT * FROM content_generations 
        WHERE ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      // 개별 콘텐츠 생성 이력
      const individualGenerations = await this.db.prepare(`
        SELECT * FROM individual_generations 
        WHERE ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      // 전체 개수 조회
      const totalCountResult = await this.db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM content_generations WHERE ${whereClause}) as content_count,
          (SELECT COUNT(*) FROM individual_generations WHERE ${whereClause}) as individual_count
      `).bind(...params, ...params).first();

      const totalCount = (totalCountResult?.content_count || 0) + (totalCountResult?.individual_count || 0);
      const totalPages = Math.ceil(totalCount / limit);

      console.log(`✅ Retrieved user history for ${userId}: ${totalCount} records`);

      return {
        success: true,
        data: {
          contentGenerations: contentGenerations.results.map(this.parseContentGenerationRow),
          individualGenerations: individualGenerations.results.map(this.parseIndividualGenerationRow),
          totalCount,
          totalPages,
          currentPage: page
        }
      };

    } catch (error) {
      console.error('❌ Failed to get user history:', error);
      return { success: false, error: error.message };
    }
  }

  // 사용자 통계 조회
  public async getUserStats(userId: string): Promise<{
    success: boolean; 
    data?: HistoryStats; 
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // 기본 통계
      const basicStats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_generations,
          AVG(processing_time) as avg_processing_time,
          SUM(processing_time) as total_processing_time,
          AVG(CASE WHEN status = 'completed' THEN 1.0 ELSE 0.0 END) * 100 as success_rate,
          AVG(CASE WHEN real_ai_used > 0 THEN 1.0 ELSE 0.0 END) * 100 as real_ai_usage_rate
        FROM content_generations 
        WHERE user_id = ?
      `).bind(userId).first();

      // 이번 달 생성 수
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const thisMonthStats = await this.db.prepare(`
        SELECT COUNT(*) as this_month_count
        FROM content_generations 
        WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
      `).bind(userId, thisMonth).first();

      // 콘텐츠 타입별 분석 (개별 생성 포함)
      const typeBreakdown = await this.db.prepare(`
        SELECT 
          'blog' as type, COUNT(*) as count
        FROM content_generations 
        WHERE user_id = ? AND blog_title IS NOT NULL
        UNION ALL
        SELECT 
          'image' as type, COUNT(*) as count
        FROM content_generations 
        WHERE user_id = ? AND social_graphic_url IS NOT NULL
        UNION ALL
        SELECT 
          'video' as type, COUNT(*) as count
        FROM content_generations 
        WHERE user_id = ? AND promo_video_url IS NOT NULL
        UNION ALL
        SELECT 
          'podcast' as type, COUNT(*) as count
        FROM content_generations 
        WHERE user_id = ? AND podcast_audio_url IS NOT NULL
        UNION ALL
        SELECT 
          content_type as type, COUNT(*) as count
        FROM individual_generations 
        WHERE user_id = ?
        GROUP BY content_type
      `).bind(userId, userId, userId, userId, userId).all();

      // 월별 트렌드 (최근 6개월)
      const monthlyTrend = await this.db.prepare(`
        SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as count,
          AVG(processing_time) as avg_processing_time
        FROM content_generations 
        WHERE user_id = ? 
          AND created_at >= datetime('now', '-6 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month DESC
      `).bind(userId).all();

      // 콘텐츠 타입 분석 결과 처리
      const contentTypeBreakdown: Record<string, number> = {};
      typeBreakdown.results?.forEach((row: any) => {
        contentTypeBreakdown[row.type] = (contentTypeBreakdown[row.type] || 0) + row.count;
      });

      const stats: HistoryStats = {
        totalGenerations: basicStats?.total_generations || 0,
        thisMonthGenerations: thisMonthStats?.this_month_count || 0,
        totalProcessingTime: Math.round(basicStats?.total_processing_time || 0),
        averageProcessingTime: Math.round(basicStats?.avg_processing_time || 0),
        successRate: Math.round(basicStats?.success_rate || 100),
        realAiUsageRate: Math.round(basicStats?.real_ai_usage_rate || 0),
        contentTypeBreakdown,
        monthlyTrend: monthlyTrend.results?.map((row: any) => ({
          month: row.month,
          count: row.count,
          processingTime: Math.round(row.avg_processing_time || 0)
        })) || []
      };

      console.log(`✅ Retrieved user stats for ${userId}`);
      return { success: true, data: stats };

    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return { success: false, error: error.message };
    }
  }

  // 사용량 업데이트
  private async updateUserUsage(userId: string, feature: string): Promise<void> {
    if (!this.db) return;

    try {
      const today = new Date();
      const resetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      // 현재 사용량 조회 또는 생성
      await this.db.prepare(`
        INSERT OR REPLACE INTO user_usage (
          id, user_id, feature, usage_count, quota_limit, reset_date, updated_at
        ) VALUES (
          COALESCE((SELECT id FROM user_usage WHERE user_id = ? AND feature = ? AND reset_date = ?), ?),
          ?, ?, 
          COALESCE((SELECT usage_count FROM user_usage WHERE user_id = ? AND feature = ? AND reset_date = ?), 0) + 1,
          0, -- TODO: 플랜별 쿼터 설정
          ?, 
          ?
        )
      `).bind(
        userId, feature, resetDate, this.generateId('usage'),
        userId, feature,
        userId, feature, resetDate,
        resetDate, new Date().toISOString()
      ).run();

      console.log(`✅ Updated usage for user ${userId}, feature ${feature}`);
    } catch (error) {
      console.error('❌ Failed to update user usage:', error);
    }
  }

  // 사용자 사용량 조회
  public async getUserUsage(userId: string): Promise<{
    success: boolean;
    data?: UserUsage[];
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const today = new Date();
      const resetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      const usage = await this.db.prepare(`
        SELECT * FROM user_usage 
        WHERE user_id = ? AND reset_date = ?
      `).bind(userId, resetDate).all();

      return {
        success: true,
        data: usage.results?.map(this.parseUserUsageRow) || []
      };
    } catch (error) {
      console.error('❌ Failed to get user usage:', error);
      return { success: false, error: error.message };
    }
  }

  // 특정 이력 조회
  public async getGenerationById(
    generationId: string, 
    userId?: string
  ): Promise<{
    success: boolean;
    data?: ContentGenerationHistory | IndividualGenerationHistory;
    type?: 'content' | 'individual';
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // 통합 콘텐츠 생성에서 먼저 찾기
      let whereClause = 'id = ?';
      let params = [generationId];
      
      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }

      const contentResult = await this.db.prepare(`
        SELECT * FROM content_generations WHERE ${whereClause}
      `).bind(...params).first();

      if (contentResult) {
        return {
          success: true,
          data: this.parseContentGenerationRow(contentResult),
          type: 'content'
        };
      }

      // 개별 생성에서 찾기
      const individualResult = await this.db.prepare(`
        SELECT * FROM individual_generations WHERE ${whereClause}
      `).bind(...params).first();

      if (individualResult) {
        return {
          success: true,
          data: this.parseIndividualGenerationRow(individualResult),
          type: 'individual'
        };
      }

      return { success: false, error: 'Generation not found' };

    } catch (error) {
      console.error('❌ Failed to get generation:', error);
      return { success: false, error: error.message };
    }
  }

  // 이력 삭제
  public async deleteGeneration(
    generationId: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // 통합 생성 삭제 시도
      const contentResult = await this.db.prepare(`
        DELETE FROM content_generations WHERE id = ? AND user_id = ?
      `).bind(generationId, userId).run();

      if (contentResult.changes > 0) {
        console.log(`✅ Deleted content generation ${generationId}`);
        return { success: true };
      }

      // 개별 생성 삭제 시도
      const individualResult = await this.db.prepare(`
        DELETE FROM individual_generations WHERE id = ? AND user_id = ?
      `).bind(generationId, userId).run();

      if (individualResult.changes > 0) {
        console.log(`✅ Deleted individual generation ${generationId}`);
        return { success: true };
      }

      return { success: false, error: 'Generation not found or access denied' };

    } catch (error) {
      console.error('❌ Failed to delete generation:', error);
      return { success: false, error: error.message };
    }
  }

  // 데이터 파싱 헬퍼 메서드들
  private parseContentGenerationRow(row: any): ContentGenerationHistory {
    return {
      id: row.id,
      userId: row.user_id,
      productDescription: row.product_description,
      generationOptions: JSON.parse(row.generation_options || '{}'),
      blogTitle: row.blog_title,
      blogContent: row.blog_content,
      blogTags: JSON.parse(row.blog_tags || '[]'),
      blogSeoKeywords: JSON.parse(row.blog_seo_keywords || '[]'),
      blogReadingTime: row.blog_reading_time,
      socialGraphicUrl: row.social_graphic_url,
      socialGraphicDescription: row.social_graphic_description,
      socialGraphicPrompt: row.social_graphic_prompt,
      socialGraphicDimensions: row.social_graphic_dimensions,
      promoVideoUrl: row.promo_video_url,
      promoVideoDuration: row.promo_video_duration,
      promoVideoDescription: row.promo_video_description,
      promoVideoThumbnail: row.promo_video_thumbnail,
      promoVideoPrompt: row.promo_video_prompt,
      podcastScript: row.podcast_script,
      podcastAudioUrl: row.podcast_audio_url,
      podcastDuration: row.podcast_duration,
      podcastDescription: row.podcast_description,
      processingTime: row.processing_time,
      realAiUsed: row.real_ai_used,
      totalAiCalls: row.total_ai_calls,
      failedAiCalls: row.failed_ai_calls,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    };
  }

  private parseIndividualGenerationRow(row: any): IndividualGenerationHistory {
    return {
      id: row.id,
      userId: row.user_id,
      contentType: row.content_type,
      productDescription: row.product_description,
      generationOptions: JSON.parse(row.generation_options || '{}'),
      contentData: JSON.parse(row.content_data || '{}'),
      processingTime: row.processing_time,
      realAiUsed: row.real_ai_used,
      status: row.status,
      createdAt: row.created_at
    };
  }

  private parseUserUsageRow(row: any): UserUsage {
    return {
      id: row.id,
      userId: row.user_id,
      feature: row.feature,
      usageCount: row.usage_count,
      quotaLimit: row.quota_limit,
      resetDate: row.reset_date,
      updatedAt: row.updated_at
    };
  }
}

export const historyService = new HistoryService();