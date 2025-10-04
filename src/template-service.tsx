// 콘텐츠 템플릿 관리 서비스
// 업계별, 목적별 템플릿 관리 및 사용자 정의 템플릿 지원

import type { AuthTokenPayload } from './auth-service'

// 타입 정의
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  type: 'industry' | 'purpose';
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  
  // 템플릿 설정
  isSystem: boolean;
  isPublic: boolean;
  creatorId?: string;
  
  // 콘텐츠 템플릿 구성
  blogTemplate?: BlogTemplate;
  imageTemplate?: ImageTemplate;
  videoTemplate?: VideoTemplate;
  podcastTemplate?: PodcastTemplate;
  
  // 메타데이터
  tags: string[];
  usageCount: number;
  rating: number;
  ratingCount: number;
  
  // 시간 정보
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터
  category?: TemplateCategory;
  creator?: { name: string; email: string };
}

export interface BlogTemplate {
  titleFormat: string; // "{{keywords}} 기반 {{productType}} - {{benefits}}"
  contentStructure: {
    introduction: string;
    sections: Array<{
      heading: string;
      contentTemplate: string;
    }>;
    conclusion: string;
  };
  seoSettings: {
    keywordDensity: number;
    metaDescription: string;
    tags: string[];
  };
  styleGuide: {
    tone: 'professional' | 'friendly' | 'authoritative' | 'casual';
    length: 'short' | 'medium' | 'long';
    language: string;
  };
}

export interface ImageTemplate {
  style: string; // 이미지 스타일
  dimensions: string; // "1024x1024"
  colorScheme: string[]; // 색상 팔레트
  composition: {
    layout: 'centered' | 'split' | 'overlay' | 'minimal';
    textPlacement: 'top' | 'bottom' | 'center' | 'side';
    textStyle: string;
  };
  promptTemplate: string; // "{{productType}} in {{style}} style, {{mood}}"
  brandElements: {
    includeLogo: boolean;
    logoPosition: string;
    brandColors: boolean;
  };
}

export interface VideoTemplate {
  duration: number; // 초
  format: '16:9' | '9:16' | '1:1';
  style: string;
  scriptStructure: {
    hook: string; // 첫 3초 후킹 전략
    introduction: string;
    mainContent: string;
    callToAction: string;
  };
  visualElements: {
    transitions: string[];
    effects: string[];
    musicStyle: string;
  };
  promptTemplate: string;
}

export interface PodcastTemplate {
  duration: number; // 초
  scriptStructure: {
    intro: string;
    segments: Array<{
      title: string;
      contentTemplate: string;
      duration: number;
    }>;
    outro: string;
  };
  voiceSettings: {
    style: 'professional' | 'conversational' | 'energetic' | 'calm';
    pace: 'slow' | 'normal' | 'fast';
    language: string;
  };
  promptTemplate: string;
}

export interface TemplateUsage {
  id: string;
  templateId: string;
  userId: string;
  generationId?: string;
  customizations?: any;
  satisfactionRating?: number;
  feedback?: string;
  usedAt: string;
}

export interface TemplateFilters {
  categoryId?: string;
  type?: 'industry' | 'purpose';
  isPublic?: boolean;
  isSystem?: boolean;
  creatorId?: string;
  tags?: string[];
  searchTerm?: string;
  sortBy?: 'name' | 'usage' | 'rating' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TemplateStats {
  totalTemplates: number;
  userTemplates: number;
  favoriteTemplates: number;
  mostUsedTemplate?: ContentTemplate;
  categoryBreakdown: Record<string, number>;
  usageThisMonth: number;
  averageRating: number;
}

export class TemplateService {
  private db: D1Database;

  constructor(database?: D1Database) {
    this.db = database as D1Database;
    console.log('📋 TemplateService initialized');
  }

  // ID 생성 헬퍼
  private generateId(prefix: string = 'tpl'): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
  }

  // === 카테고리 관리 ===

  async getCategories(type?: 'industry' | 'purpose'): Promise<{
    success: boolean;
    data?: TemplateCategory[];
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      let query = 'SELECT * FROM template_categories WHERE active = TRUE';
      let params: any[] = [];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY sort_order, name';

      const result = await this.db.prepare(query).bind(...params).all();

      return {
        success: true,
        data: result.results?.map(this.parseCategoryRow) || []
      };
    } catch (error) {
      console.error('❌ Failed to get categories:', error);
      return { success: false, error: error.message };
    }
  }

  async createCategory(categoryData: Partial<TemplateCategory>): Promise<{
    success: boolean;
    data?: TemplateCategory;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const id = this.generateId('cat');
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO template_categories (
          id, name, description, icon, color, type, sort_order, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        categoryData.name,
        categoryData.description || null,
        categoryData.icon || null,
        categoryData.color || 'blue',
        categoryData.type,
        categoryData.sortOrder || 0,
        categoryData.active !== false,
        now,
        now
      ).run();

      const created = await this.getCategoryById(id);
      return created;
    } catch (error) {
      console.error('❌ Failed to create category:', error);
      return { success: false, error: error.message };
    }
  }

  async getCategoryById(categoryId: string): Promise<{
    success: boolean;
    data?: TemplateCategory;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const result = await this.db.prepare(`
        SELECT * FROM template_categories WHERE id = ?
      `).bind(categoryId).first();

      if (!result) {
        return { success: false, error: 'Category not found' };
      }

      return {
        success: true,
        data: this.parseCategoryRow(result)
      };
    } catch (error) {
      console.error('❌ Failed to get category:', error);
      return { success: false, error: error.message };
    }
  }

  // === 템플릿 관리 ===

  async getTemplates(filters: TemplateFilters = {}): Promise<{
    success: boolean;
    data?: {
      templates: ContentTemplate[];
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
      const {
        categoryId,
        type,
        isPublic,
        isSystem,
        creatorId,
        searchTerm,
        sortBy = 'updated',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;

      // 조건절 구성
      let whereConditions = ['1=1'];
      let params: any[] = [];

      if (categoryId) {
        whereConditions.push('ct.category_id = ?');
        params.push(categoryId);
      }

      if (type && !categoryId) {
        whereConditions.push('tc.type = ?');
        params.push(type);
      }

      if (isPublic !== undefined) {
        whereConditions.push('ct.is_public = ?');
        params.push(isPublic);
      }

      if (isSystem !== undefined) {
        whereConditions.push('ct.is_system = ?');
        params.push(isSystem);
      }

      if (creatorId) {
        whereConditions.push('ct.creator_id = ?');
        params.push(creatorId);
      }

      if (searchTerm) {
        whereConditions.push('(ct.name LIKE ? OR ct.description LIKE ? OR ct.tags LIKE ?)');
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // 정렬 컬럼 매핑
      const sortColumns = {
        name: 'ct.name',
        usage: 'ct.usage_count',
        rating: 'ct.rating',
        created: 'ct.created_at',
        updated: 'ct.updated_at'
      };

      const sortColumn = sortColumns[sortBy] || sortColumns.updated;
      const orderClause = `${sortColumn} ${sortOrder.toUpperCase()}`;

      // 템플릿 조회 (카테고리 조인)
      const templatesResult = await this.db.prepare(`
        SELECT 
          ct.*,
          tc.name as category_name,
          tc.description as category_description,
          tc.icon as category_icon,
          tc.color as category_color,
          tc.type as category_type,
          u.name as creator_name,
          u.email as creator_email
        FROM content_templates ct
        LEFT JOIN template_categories tc ON ct.category_id = tc.id
        LEFT JOIN users u ON ct.creator_id = u.id
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      // 총 개수 조회
      const countResult = await this.db.prepare(`
        SELECT COUNT(*) as total_count
        FROM content_templates ct
        LEFT JOIN template_categories tc ON ct.category_id = tc.id
        WHERE ${whereClause}
      `).bind(...params).first();

      const totalCount = countResult?.total_count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          templates: templatesResult.results?.map(this.parseTemplateRow) || [],
          totalCount,
          totalPages,
          currentPage: page
        }
      };
    } catch (error) {
      console.error('❌ Failed to get templates:', error);
      return { success: false, error: error.message };
    }
  }

  async getTemplateById(templateId: string, userId?: string): Promise<{
    success: boolean;
    data?: ContentTemplate;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const result = await this.db.prepare(`
        SELECT 
          ct.*,
          tc.name as category_name,
          tc.description as category_description,
          tc.icon as category_icon,
          tc.color as category_color,
          tc.type as category_type,
          u.name as creator_name,
          u.email as creator_email
        FROM content_templates ct
        LEFT JOIN template_categories tc ON ct.category_id = tc.id
        LEFT JOIN users u ON ct.creator_id = u.id
        WHERE ct.id = ?
      `).bind(templateId).first();

      if (!result) {
        return { success: false, error: 'Template not found' };
      }

      // 접근 권한 체크
      const template = this.parseTemplateRow(result);
      if (!template.isPublic && !template.isSystem && template.creatorId !== userId) {
        return { success: false, error: 'Access denied' };
      }

      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('❌ Failed to get template:', error);
      return { success: false, error: error.message };
    }
  }

  async createTemplate(
    user: AuthTokenPayload,
    templateData: Partial<ContentTemplate>
  ): Promise<{
    success: boolean;
    data?: ContentTemplate;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const id = this.generateId('tpl');
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO content_templates (
          id, name, description, category_id, is_system, is_public, creator_id,
          blog_template, image_template, video_template, podcast_template,
          tags, usage_count, rating, rating_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        templateData.name,
        templateData.description || null,
        templateData.categoryId || null,
        false, // 사용자 생성 템플릿은 시스템 템플릿이 아님
        templateData.isPublic || false,
        user.sub,
        templateData.blogTemplate ? JSON.stringify(templateData.blogTemplate) : null,
        templateData.imageTemplate ? JSON.stringify(templateData.imageTemplate) : null,
        templateData.videoTemplate ? JSON.stringify(templateData.videoTemplate) : null,
        templateData.podcastTemplate ? JSON.stringify(templateData.podcastTemplate) : null,
        JSON.stringify(templateData.tags || []),
        0,
        0.0,
        0,
        now,
        now
      ).run();

      const created = await this.getTemplateById(id, user.sub);
      console.log(`✅ Template created: ${id} by user ${user.email}`);
      return created;
    } catch (error) {
      console.error('❌ Failed to create template:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTemplate(
    templateId: string,
    user: AuthTokenPayload,
    templateData: Partial<ContentTemplate>
  ): Promise<{
    success: boolean;
    data?: ContentTemplate;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // 권한 체크
      const existing = await this.getTemplateById(templateId, user.sub);
      if (!existing.success) {
        return existing;
      }

      if (existing.data?.creatorId !== user.sub && user.role !== 'admin') {
        return { success: false, error: 'Access denied' };
      }

      const updateFields: string[] = [];
      const params: any[] = [];

      if (templateData.name !== undefined) {
        updateFields.push('name = ?');
        params.push(templateData.name);
      }

      if (templateData.description !== undefined) {
        updateFields.push('description = ?');
        params.push(templateData.description);
      }

      if (templateData.categoryId !== undefined) {
        updateFields.push('category_id = ?');
        params.push(templateData.categoryId);
      }

      if (templateData.isPublic !== undefined) {
        updateFields.push('is_public = ?');
        params.push(templateData.isPublic);
      }

      if (templateData.blogTemplate !== undefined) {
        updateFields.push('blog_template = ?');
        params.push(templateData.blogTemplate ? JSON.stringify(templateData.blogTemplate) : null);
      }

      if (templateData.imageTemplate !== undefined) {
        updateFields.push('image_template = ?');
        params.push(templateData.imageTemplate ? JSON.stringify(templateData.imageTemplate) : null);
      }

      if (templateData.videoTemplate !== undefined) {
        updateFields.push('video_template = ?');
        params.push(templateData.videoTemplate ? JSON.stringify(templateData.videoTemplate) : null);
      }

      if (templateData.podcastTemplate !== undefined) {
        updateFields.push('podcast_template = ?');
        params.push(templateData.podcastTemplate ? JSON.stringify(templateData.podcastTemplate) : null);
      }

      if (templateData.tags !== undefined) {
        updateFields.push('tags = ?');
        params.push(JSON.stringify(templateData.tags));
      }

      if (updateFields.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updateFields.push('updated_at = ?');
      params.push(new Date().toISOString());

      params.push(templateId);

      await this.db.prepare(`
        UPDATE content_templates 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...params).run();

      const updated = await this.getTemplateById(templateId, user.sub);
      console.log(`✅ Template updated: ${templateId}`);
      return updated;
    } catch (error) {
      console.error('❌ Failed to update template:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteTemplate(
    templateId: string,
    user: AuthTokenPayload
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // 권한 체크
      const existing = await this.getTemplateById(templateId, user.sub);
      if (!existing.success) {
        return { success: false, error: existing.error };
      }

      if (existing.data?.creatorId !== user.sub && user.role !== 'admin') {
        return { success: false, error: 'Access denied' };
      }

      if (existing.data?.isSystem) {
        return { success: false, error: 'Cannot delete system template' };
      }

      const result = await this.db.prepare(`
        DELETE FROM content_templates WHERE id = ?
      `).bind(templateId).run();

      if (result.changes === 0) {
        return { success: false, error: 'Template not found' };
      }

      console.log(`✅ Template deleted: ${templateId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete template:', error);
      return { success: false, error: error.message };
    }
  }

  // === 템플릿 사용 관리 ===

  async recordTemplateUsage(
    templateId: string,
    user: AuthTokenPayload,
    generationId?: string,
    customizations?: any
  ): Promise<{
    success: boolean;
    data?: TemplateUsage;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const id = this.generateId('usage');
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO template_usage (
          id, template_id, user_id, generation_id, customizations, used_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        templateId,
        user.sub,
        generationId || null,
        customizations ? JSON.stringify(customizations) : null,
        now
      ).run();

      console.log(`✅ Template usage recorded: ${templateId} by ${user.email}`);
      return {
        success: true,
        data: {
          id,
          templateId,
          userId: user.sub,
          generationId,
          customizations,
          usedAt: now
        }
      };
    } catch (error) {
      console.error('❌ Failed to record template usage:', error);
      return { success: false, error: error.message };
    }
  }

  // === 즐겨찾기 관리 ===

  async addToFavorites(
    templateId: string,
    user: AuthTokenPayload
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const id = this.generateId('fav');
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT OR REPLACE INTO user_favorite_templates (
          id, user_id, template_id, created_at
        ) VALUES (?, ?, ?, ?)
      `).bind(id, user.sub, templateId, now).run();

      console.log(`✅ Template added to favorites: ${templateId} by ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to add to favorites:', error);
      return { success: false, error: error.message };
    }
  }

  async removeFromFavorites(
    templateId: string,
    user: AuthTokenPayload
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const result = await this.db.prepare(`
        DELETE FROM user_favorite_templates 
        WHERE user_id = ? AND template_id = ?
      `).bind(user.sub, templateId).run();

      if (result.changes === 0) {
        return { success: false, error: 'Favorite not found' };
      }

      console.log(`✅ Template removed from favorites: ${templateId} by ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to remove from favorites:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserFavorites(user: AuthTokenPayload): Promise<{
    success: boolean;
    data?: ContentTemplate[];
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const result = await this.db.prepare(`
        SELECT 
          ct.*,
          tc.name as category_name,
          tc.description as category_description,
          tc.icon as category_icon,
          tc.color as category_color,
          tc.type as category_type,
          u.name as creator_name,
          u.email as creator_email
        FROM user_favorite_templates uf
        JOIN content_templates ct ON uf.template_id = ct.id
        LEFT JOIN template_categories tc ON ct.category_id = tc.id
        LEFT JOIN users u ON ct.creator_id = u.id
        WHERE uf.user_id = ?
        ORDER BY uf.created_at DESC
      `).bind(user.sub).all();

      return {
        success: true,
        data: result.results?.map(this.parseTemplateRow) || []
      };
    } catch (error) {
      console.error('❌ Failed to get user favorites:', error);
      return { success: false, error: error.message };
    }
  }

  // === 통계 및 분석 ===

  async getTemplateStats(userId?: string): Promise<{
    success: boolean;
    data?: TemplateStats;
    error?: string;
  }> {
    if (!this.db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // 기본 통계
      const basicStats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_templates,
          COUNT(CASE WHEN creator_id = ? THEN 1 END) as user_templates,
          AVG(rating) as average_rating
        FROM content_templates
        WHERE (is_public = TRUE OR creator_id = ? OR is_system = TRUE)
      `).bind(userId || '', userId || '').first();

      // 즐겨찾기 수
      const favoriteCount = userId ? await this.db.prepare(`
        SELECT COUNT(*) as favorite_count
        FROM user_favorite_templates
        WHERE user_id = ?
      `).bind(userId).first() : null;

      // 카테고리별 분포
      const categoryBreakdown = await this.db.prepare(`
        SELECT 
          tc.name as category_name,
          COUNT(ct.id) as template_count
        FROM content_templates ct
        LEFT JOIN template_categories tc ON ct.category_id = tc.id
        WHERE (ct.is_public = TRUE OR ct.creator_id = ? OR ct.is_system = TRUE)
        GROUP BY tc.id, tc.name
      `).bind(userId || '').all();

      // 이번 달 사용량
      const thisMonth = new Date().toISOString().substring(0, 7);
      const monthlyUsage = userId ? await this.db.prepare(`
        SELECT COUNT(*) as usage_count
        FROM template_usage
        WHERE user_id = ? AND strftime('%Y-%m', used_at) = ?
      `).bind(userId, thisMonth).first() : null;

      // 가장 많이 사용된 템플릿
      const mostUsedResult = await this.db.prepare(`
        SELECT 
          ct.*,
          tc.name as category_name,
          tc.description as category_description,
          tc.icon as category_icon,
          tc.color as category_color,
          tc.type as category_type
        FROM content_templates ct
        LEFT JOIN template_categories tc ON ct.category_id = tc.id
        WHERE ct.usage_count > 0 
          AND (ct.is_public = TRUE OR ct.creator_id = ? OR ct.is_system = TRUE)
        ORDER BY ct.usage_count DESC
        LIMIT 1
      `).bind(userId || '').first();

      const categoryBreakdownMap: Record<string, number> = {};
      categoryBreakdown.results?.forEach((row: any) => {
        categoryBreakdownMap[row.category_name || '기타'] = row.template_count;
      });

      const stats: TemplateStats = {
        totalTemplates: basicStats?.total_templates || 0,
        userTemplates: basicStats?.user_templates || 0,
        favoriteTemplates: favoriteCount?.favorite_count || 0,
        mostUsedTemplate: mostUsedResult ? this.parseTemplateRow(mostUsedResult) : undefined,
        categoryBreakdown: categoryBreakdownMap,
        usageThisMonth: monthlyUsage?.usage_count || 0,
        averageRating: Math.round((basicStats?.average_rating || 0) * 10) / 10
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('❌ Failed to get template stats:', error);
      return { success: false, error: error.message };
    }
  }

  // === 데이터 파싱 헬퍼 메서드들 ===

  private parseCategoryRow(row: any): TemplateCategory {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      type: row.type,
      sortOrder: row.sort_order,
      active: Boolean(row.active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private parseTemplateRow(row: any): ContentTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      isSystem: Boolean(row.is_system),
      isPublic: Boolean(row.is_public),
      creatorId: row.creator_id,
      blogTemplate: row.blog_template ? JSON.parse(row.blog_template) : undefined,
      imageTemplate: row.image_template ? JSON.parse(row.image_template) : undefined,
      videoTemplate: row.video_template ? JSON.parse(row.video_template) : undefined,
      podcastTemplate: row.podcast_template ? JSON.parse(row.podcast_template) : undefined,
      tags: JSON.parse(row.tags || '[]'),
      usageCount: row.usage_count || 0,
      rating: row.rating || 0,
      ratingCount: row.rating_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description,
        icon: row.category_icon,
        color: row.category_color,
        type: row.category_type,
        sortOrder: 0,
        active: true,
        createdAt: '',
        updatedAt: ''
      } : undefined,
      creator: row.creator_name ? {
        name: row.creator_name,
        email: row.creator_email
      } : undefined
    };
  }
}

export const templateService = new TemplateService();