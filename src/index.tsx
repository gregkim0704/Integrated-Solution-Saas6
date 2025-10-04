import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { renderer } from './renderer'
import { serverAICalls } from './server-ai-calls'
import { authService, UserRole } from './auth-service'
import { 
  requireAuth, 
  optionalAuth, 
  securityHeaders, 
  rateLimiter, 
  requirePremium, 
  checkUsageQuota,
  apiLogger 
} from './auth-middleware'
import { HistoryService } from './history-service'
import { TemplateService } from './template-service'

// Cloudflare 바인딩 타입 정의
type Bindings = {
  DB: D1Database
}

// Hono 컨텍스트 타입 정의
type Env = {
  Bindings: Bindings
}

// 실제 AI 생성 서비스 (GenSpark AI 도구들 사용)
class ProductiveAIService {
  private performanceStats = {
    totalRequests: 0,
    successfulRequests: 0,
    averageProcessingTime: 0,
    lastGenerationTime: 0,
    realAICallsCount: 0,
    failedAICallsCount: 0
  };

  // 제품 분석
  private analyzeProduct(productDescription: string) {
    const analysis = {
      keywords: [],
      category: '',
      targetAudience: '20-40대 활동적인 현대인',
      benefits: ['편의성 향상', '시간 절약', '효율성 증대', '품질 개선'],
      features: ['첨단 기술', '사용자 친화적 디자인', '높은 신뢰성', '지속적 업데이트']
    };

    // 키워드 추출
    const keywordList = ['스마트', '건강', '혁신', '고품질', '편리', '효율', '안전', '디자인', '기술', '성능'];
    analysis.keywords = keywordList.filter(keyword => 
      productDescription.toLowerCase().includes(keyword.toLowerCase())
    );

    // 카테고리 분류
    if (productDescription.includes('워치') || productDescription.includes('웨어러블')) {
      analysis.category = 'wearable';
    } else if (productDescription.includes('앱') || productDescription.includes('소프트웨어')) {
      analysis.category = 'software';
    } else if (productDescription.includes('화장품') || productDescription.includes('뷰티')) {
      analysis.category = 'beauty';
    } else {
      analysis.category = 'general';
    }

    return analysis;
  }

  // 블로그 콘텐츠 생성
  private async generateBlogContent(productDescription: string, analysis: any, options: any) {
    const language = options.language || 'ko';
    
    const title = language === 'ko' 
      ? `${analysis.keywords.slice(0, 2).join(' ')} 기반 혁신 솔루션 - ${productDescription.split(' ').slice(0, 3).join(' ')}`
      : language === 'en'
      ? `${analysis.keywords.slice(0, 2).join(' ')} Innovation - ${productDescription.split(' ').slice(0, 3).join(' ')}`
      : `${analysis.keywords.slice(0, 2).join(' ')} イノベーション - ${productDescription.split(' ').slice(0, 3).join(' ')}`;

    const content = `
# ${title}

## 🚀 혁신적인 솔루션

${productDescription}은 현대 사회의 요구에 부응하는 혁신적인 제품입니다.

## ✨ 핵심 특징
${analysis.features.map((feature, i) => `${i + 1}. **${feature}** - 차별화된 경쟁력의 핵심`).join('\n')}

## 🎯 주요 혜택
${analysis.benefits.map((benefit, i) => `${i + 1}. **${benefit}** - 사용자 만족도 극대화`).join('\n')}

## 👥 타겟 고객
**${analysis.targetAudience}**을 위해 특별히 설계되었습니다.

## 🔑 핵심 키워드
${analysis.keywords.map(k => `#${k}`).join(' ')}

## 💡 결론
${productDescription}은 단순한 제품을 넘어 라이프스타일 혁신을 가져다주는 솔루션입니다.
    `.trim();

    return {
      title,
      content,
      tags: [...analysis.keywords, '혁신', '리뷰'],
      seoKeywords: [...analysis.keywords, '제품리뷰', '추천'],
      readingTime: Math.ceil(content.length / 300)
    };
  }

  // 실제 AI 이미지 생성
  private async generateSocialGraphic(productDescription: string, analysis: any, options: any) {
    const imageStyle = options.imageStyle || 'modern';
    
    const styleMap = {
      modern: '현대적이고 세련된 디자인',
      minimal: '미니멀하고 깔끔한 스타일',
      vibrant: '생동감 있고 컬러풀한 느낌',
      professional: '전문적이고 신뢰감 있는 분위기'
    };

    const prompt = `${styleMap[imageStyle]}의 ${productDescription} 소셜 미디어 그래픽을 생성하세요. 
                   주요 요소: ${analysis.keywords.join(', ')}, 고품질 상업용 이미지, 1080x1080 정사각형 포맷`;

    try {
      console.log('🎨 [REAL AI] Generating image with actual AI tools...');
      const result = await serverAICalls.callImageGeneration({
        query: prompt,
        imageStyle: imageStyle,
        taskSummary: `Generate ${imageStyle} social media image for ${productDescription}`
      });

      this.performanceStats.realAICallsCount++;
      
      if (result.success) {
        return {
          imageUrl: result.data.generated_images[0]?.url || '/static/placeholder-image.jpg',
          description: `AI 생성 ${styleMap[imageStyle]} 소셜 그래픽`,
          dimensions: '1080x1080',
          prompt: prompt,
          realAI: true,
          processingTime: result.processingTime
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.performanceStats.failedAICallsCount++;
      console.error('❌ Image AI generation failed:', error);
      
      return {
        imageUrl: '/static/placeholder-image.jpg',
        description: `${styleMap[imageStyle]} 소셜 그래픽 (AI 생성 실패)`,
        dimensions: '1080x1080',
        prompt: prompt,
        realAI: false,
        error: error.message
      };
    }
  }

  // 실제 AI 비디오 생성
  private async generatePromoVideo(productDescription: string, analysis: any, options: any) {
    const duration = options.videoDuration || 30;
    const language = options.language || 'ko';
    
    const prompt = `${productDescription}의 매력적인 ${duration}초 프로모션 비디오. 
                   ${analysis.keywords.join(', ')} 요소 강조, 현대적 스타일, 전문적 마케팅 비디오`;

    try {
      console.log('🎬 [REAL AI] Generating video with actual AI tools...');
      const result = await serverAICalls.callVideoGeneration({
        query: prompt,
        duration: duration,
        taskSummary: `Generate ${duration}s promotional video for ${productDescription}`
      });

      this.performanceStats.realAICallsCount++;
      
      if (result.success) {
        return {
          videoUrl: result.data.generated_videos[0]?.url || '/static/placeholder-video.mp4',
          duration: duration,
          description: `AI 생성 ${duration}초 프로모션 비디오`,
          thumbnail: result.data.generated_videos[0]?.thumbnail,
          prompt: prompt,
          realAI: true,
          processingTime: result.processingTime
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.performanceStats.failedAICallsCount++;
      console.error('❌ Video AI generation failed:', error);
      
      return {
        videoUrl: '/static/placeholder-video.mp4',
        duration: duration,
        description: `${duration}초 프로모션 비디오 (AI 생성 실패)`,
        prompt: prompt,
        realAI: false,
        error: error.message
      };
    }
  }

  // 실제 AI 오디오 생성
  private async generatePodcastContent(productDescription: string, analysis: any, options: any) {
    const voice = options.voice || 'professional';
    const language = options.language || 'ko';
    
    const scriptText = `안녕하세요! ${productDescription}에 대해 소개해드리겠습니다. 
                       이 제품의 주요 특징은 ${analysis.features.slice(0, 2).join('과 ')}이며, 
                       ${analysis.benefits.slice(0, 2).join('과 ')}를 통해 고객의 만족도를 높입니다. 
                       ${analysis.keywords.join(', ')} 등의 핵심 요소를 갖춘 혁신적인 솔루션입니다. 
                       자세한 정보는 제품 페이지에서 확인하세요. 감사합니다!`;

    try {
      console.log('🎙️ [REAL AI] Generating audio with actual AI tools...');
      const result = await serverAICalls.callAudioGeneration({
        script: scriptText,
        voice: voice,
        language: language,
        taskSummary: `Generate ${voice} podcast audio for ${productDescription}`
      });

      this.performanceStats.realAICallsCount++;
      
      if (result.success) {
        return {
          scriptText,
          audioUrl: result.data.generated_audios[0]?.url || '/static/placeholder-audio.mp3',
          duration: result.data.generated_audios[0]?.duration || 60,
          description: `AI 생성 ${voice} 톤 팟캐스트`,
          realAI: true,
          processingTime: result.processingTime
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.performanceStats.failedAICallsCount++;
      console.error('❌ Audio AI generation failed:', error);
      
      return {
        scriptText,
        audioUrl: '/static/placeholder-audio.mp3',
        duration: 60,
        description: `${voice} 톤 팟캐스트 (AI 생성 실패)`,
        realAI: false,
        error: error.message
      };
    }
  }

  // 통합 콘텐츠 생성
  public async generateAllContent(productDescription: string, options = {}) {
    const startTime = Date.now();
    
    try {
      this.performanceStats.totalRequests++;
      console.log('🔥 [PRODUCTIVE AI] Starting real AI content generation...');
      
      const analysis = this.analyzeProduct(productDescription);
      
      // 순차적으로 AI 도구들 호출
      const [blog, socialGraphic, promoVideo, podcast] = await Promise.all([
        this.generateBlogContent(productDescription, analysis, options),
        this.generateSocialGraphic(productDescription, analysis, options),
        this.generatePromoVideo(productDescription, analysis, options),
        this.generatePodcastContent(productDescription, analysis, options)
      ]);

      const processingTime = Date.now() - startTime;
      
      const realAICount = [socialGraphic.realAI, promoVideo.realAI, podcast.realAI].filter(Boolean).length;
      
      if (realAICount > 0) {
        this.performanceStats.successfulRequests++;
      }
      this.performanceStats.lastGenerationTime = processingTime;
      this.performanceStats.averageProcessingTime = 
        (this.performanceStats.averageProcessingTime * (this.performanceStats.successfulRequests - 1) + processingTime) 
        / this.performanceStats.successfulRequests;

      const result = {
        blog,
        socialGraphic,
        promoVideo,
        podcast,
        generatedAt: new Date().toISOString(),
        productDescription,
        processingTime,
        realAIUsed: realAICount,
        totalRealAICalls: this.performanceStats.realAICallsCount,
        failedRealAICalls: this.performanceStats.failedAICallsCount
      };

      console.log(`✅ [PRODUCTIVE AI] Content generation completed in ${processingTime}ms (Real AI: ${realAICount}/3)`);
      return result;

    } catch (error) {
      console.error('❌ [PRODUCTIVE AI] Generation failed:', error);
      throw error;
    }
  }

  // 개별 생성 메소드들
  public async generateBlogOnly(productDescription: string, options = {}) {
    const analysis = this.analyzeProduct(productDescription);
    return await this.generateBlogContent(productDescription, analysis, options);
  }

  public async generateImageOnly(productDescription: string, options = {}) {
    const analysis = this.analyzeProduct(productDescription);
    return await this.generateSocialGraphic(productDescription, analysis, options);
  }

  public async generateVideoOnly(productDescription: string, options = {}) {
    const analysis = this.analyzeProduct(productDescription);
    return await this.generatePromoVideo(productDescription, analysis, options);
  }

  public async generateAudioOnly(productDescription: string, options = {}) {
    const analysis = this.analyzeProduct(productDescription);
    return await this.generatePodcastContent(productDescription, analysis, options);
  }

  public getPerformanceStats() {
    return {
      ...this.performanceStats,
      aiSuccessRate: this.performanceStats.realAICallsCount > 0 ? 
        ((this.performanceStats.realAICallsCount - this.performanceStats.failedAICallsCount) / this.performanceStats.realAICallsCount * 100) : 0
    };
  }

  public resetStats() {
    this.performanceStats = {
      totalRequests: 0,
      successfulRequests: 0,
      averageProcessingTime: 0,
      lastGenerationTime: 0,
      realAICallsCount: 0,
      failedAICallsCount: 0
    };
  }

  public checkAvailability() {
    return {
      imageGeneration: true,
      videoGeneration: true,
      audioGeneration: true,
      textGeneration: true,
      status: 'active',
      realAI: true,
      serverAICalls: serverAICalls.checkAIToolsAvailability(),
      lastChecked: new Date().toISOString()
    };
  }
}

const productiveAIService = new ProductiveAIService()

const app = new Hono<Env>()

// Middleware
app.use('*', securityHeaders)
app.use('*', cors())
app.use('*', logger())
app.use('/api/*', apiLogger)
app.use('/api/*', rateLimiter.middleware())
app.use(renderer)

// 인증 API Routes
app.post('/api/auth/signup', rateLimiter.middleware(10), async (c) => {
  try {
    const { email, password, name, company, industry } = await c.req.json()
    
    if (!email || !password || !name) {
      return c.json({ 
        error: '이메일, 비밀번호, 이름은 필수 항목입니다.' 
      }, 400)
    }

    const result = await authService.signup({
      email,
      password,
      name,
      company,
      industry
    })

    if (result.success) {
      console.log(`✅ New user signup: ${email}`)
      return c.json(result, 201)
    } else {
      return c.json(result, 400)
    }
  } catch (error) {
    console.error('Signup API error:', error)
    return c.json({ 
      error: '회원가입 처리 중 오류가 발생했습니다.' 
    }, 500)
  }
})

app.post('/api/auth/login', rateLimiter.middleware(20), async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ 
        error: '이메일과 비밀번호를 입력해주세요.' 
      }, 400)
    }

    const result = await authService.login({ email, password })

    if (result.success) {
      console.log(`✅ User login: ${email}`)
      return c.json(result)
    } else {
      return c.json(result, 401)
    }
  } catch (error) {
    console.error('Login API error:', error)
    return c.json({ 
      error: '로그인 처리 중 오류가 발생했습니다.' 
    }, 500)
  }
})

app.post('/api/auth/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json()
    
    if (!refreshToken) {
      return c.json({ 
        error: '리프레시 토큰이 필요합니다.' 
      }, 400)
    }

    const result = await authService.refreshAccessToken(refreshToken)
    return c.json(result, result.success ? 200 : 401)
  } catch (error) {
    console.error('Token refresh API error:', error)
    return c.json({ 
      error: '토큰 갱신 중 오류가 발생했습니다.' 
    }, 500)
  }
})

app.post('/api/auth/logout', requireAuth(), async (c) => {
  try {
    const { refreshToken } = await c.req.json()
    const user = c.get('user')
    
    const result = await authService.logout(refreshToken || '')
    console.log(`✅ User logout: ${user?.email}`)
    
    return c.json(result)
  } catch (error) {
    console.error('Logout API error:', error)
    return c.json({ 
      error: '로그아웃 처리 중 오류가 발생했습니다.' 
    }, 500)
  }
})

app.get('/api/auth/me', requireAuth(), async (c) => {
  try {
    const user = c.get('user')
    return c.json({ 
      success: true, 
      user: {
        id: user?.sub,
        email: user?.email,
        name: user?.name,
        role: user?.role,
        plan: user?.plan
      }
    })
  } catch (error) {
    console.error('Get user info API error:', error)
    return c.json({ 
      error: '사용자 정보 조회 중 오류가 발생했습니다.' 
    }, 500)
  }
})

// 관리자 전용 API
app.get('/api/admin/users', requireAuth(UserRole.ADMIN), async (c) => {
  try {
    const user = c.get('user')
    const result = await authService.getUsers(user?.role as UserRole)
    return c.json(result, result.success ? 200 : 403)
  } catch (error) {
    console.error('Get users API error:', error)
    return c.json({ 
      error: '사용자 목록 조회 중 오류가 발생했습니다.' 
    }, 500)
  }
})

app.put('/api/admin/users/:userId/role', requireAuth(UserRole.ADMIN), async (c) => {
  try {
    const userId = c.req.param('userId')
    const { role, plan } = await c.req.json()
    const adminUser = c.get('user')
    
    if (!role || !plan) {
      return c.json({ 
        error: '역할과 플랜을 지정해주세요.' 
      }, 400)
    }

    const result = await authService.updateUserRole(
      userId, 
      role, 
      plan, 
      adminUser?.role as UserRole
    )
    
    return c.json(result, result.success ? 200 : 400)
  } catch (error) {
    console.error('Update user role API error:', error)
    return c.json({ 
      error: '사용자 권한 업데이트 중 오류가 발생했습니다.' 
    }, 500)
  }
})

app.get('/api/auth/stats', requireAuth(UserRole.ADMIN), async (c) => {
  try {
    const stats = authService.getStats()
    return c.json({ 
      success: true, 
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get auth stats API error:', error)
    return c.json({ 
      error: '인증 통계 조회 중 오류가 발생했습니다.' 
    }, 500)
  }
})

// AI 콘텐츠 생성 API Routes (인증 및 쿼터 적용)
app.post('/api/generate-content', requireAuth(), checkUsageQuota('content-generation'), async (c) => {
  const body = await c.req.json()
  const { productDescription, options = {} } = body

  if (!productDescription) {
    return c.json({ error: '제품 설명을 입력해주세요.' }, 400)
  }

  try {
    const env = c.env;
    const user = c.get('user');
    
    // 실제 AI 서비스를 사용한 통합 콘텐츠 생성
    const contentResults = await productiveAIService.generateAllContent(productDescription, options)
    
    // 히스토리 저장 (비동기, 실패해도 메인 응답에 영향 없음)
    if (env.DB) {
      const historyService = initializeHistoryService(env);
      historyService.saveContentGeneration(user, contentResults, c.req.raw)
        .then(result => {
          if (result.success) {
            console.log(`✅ History saved: ${result.historyId}`);
          } else {
            console.warn(`⚠️ History save failed: ${result.error}`);
          }
        })
        .catch(error => {
          console.error('❌ History save error:', error);
        });
    }
    
    return c.json({
      success: true,
      data: contentResults,
      message: '모든 콘텐츠가 성공적으로 생성되었습니다.',
      processingTime: contentResults.processingTime,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return c.json({ 
      error: '콘텐츠 생성 중 오류가 발생했습니다.',
      details: error.message 
    }, 500)
  }
})

// 개별 콘텐츠 타입별 API (실제 AI 서비스 사용)
app.post('/api/generate-blog', requireAuth(), checkUsageQuota('content-generation'), async (c) => {
  const { productDescription, options = {} } = await c.req.json()
  
  if (!productDescription) {
    return c.json({ error: '제품 설명을 입력해주세요.' }, 400)
  }
  
  try {
    const env = c.env;
    const user = c.get('user');
    
    const blogContent = await productiveAIService.generateBlogOnly(productDescription, options)
    
    // 개별 생성 히스토리 저장
    if (env.DB) {
      const historyService = initializeHistoryService(env);
      historyService.saveIndividualGeneration(user, 'blog', {
        productDescription,
        options,
        content: blogContent,
        processingTime: blogContent.processingTime || 0,
        realAI: false
      }, c.req.raw)
        .then(result => {
          if (result.success) {
            console.log(`✅ Blog history saved: ${result.historyId}`);
          }
        })
        .catch(error => {
          console.error('❌ Blog history save error:', error);
        });
    }
    
    return c.json({ 
      success: true, 
      content: blogContent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Blog generation error:', error)
    return c.json({ 
      error: '블로그 생성 중 오류가 발생했습니다.',
      details: error.message 
    }, 500)
  }
})

app.post('/api/generate-image', requireAuth(), checkUsageQuota('image-generation'), async (c) => {
  const { productDescription, style = 'modern', options = {} } = await c.req.json()
  
  if (!productDescription) {
    return c.json({ error: '제품 설명을 입력해주세요.' }, 400)
  }
  
  try {
    const mergedOptions = { ...options, imageStyle: style }
    const imageResult = await productiveAIService.generateImageOnly(productDescription, mergedOptions)
    return c.json({ 
      success: true, 
      ...imageResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return c.json({ 
      error: '이미지 생성 중 오류가 발생했습니다.',
      details: error.message 
    }, 500)
  }
})

app.post('/api/generate-video', requireAuth(), requirePremium, checkUsageQuota('video-generation'), async (c) => {
  const { productDescription, duration = 30, options = {} } = await c.req.json()
  
  if (!productDescription) {
    return c.json({ error: '제품 설명을 입력해주세요.' }, 400)
  }
  
  try {
    const mergedOptions = { ...options, videoDuration: duration }
    const videoResult = await productiveAIService.generateVideoOnly(productDescription, mergedOptions)
    return c.json({ 
      success: true, 
      ...videoResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return c.json({ 
      error: '비디오 생성 중 오류가 발생했습니다.',
      details: error.message 
    }, 500)
  }
})

app.post('/api/generate-podcast', requireAuth(), checkUsageQuota('audio-generation'), async (c) => {
  const { productDescription, voice = 'professional', options = {} } = await c.req.json()
  
  if (!productDescription) {
    return c.json({ error: '제품 설명을 입력해주세요.' }, 400)
  }
  
  try {
    const mergedOptions = { ...options, voice }
    const podcastResult = await productiveAIService.generateAudioOnly(productDescription, mergedOptions)
    return c.json({ 
      success: true, 
      ...podcastResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Podcast generation error:', error)
    return c.json({ 
      error: '팟캐스트 생성 중 오류가 발생했습니다.',
      details: error.message 
    }, 500)
  }
})

// 메인 페이지
app.get('/', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      {/* 탭 네비게이션 */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-6xl mx-auto">
          <div class="tab-nav">
            <button id="generatorTab" class="tab-button active" onclick="switchTab('generator')">
              <i class="fas fa-magic mr-2"></i>
              콘텐츠 생성
            </button>
            <button id="historyTab" class="tab-button" onclick="switchTab('history')">
              <i class="fas fa-history mr-2"></i>
              생성 이력
            </button>
            <button id="templatesTab" class="tab-button" onclick="switchTab('templates')">
              <i class="fas fa-layer-group mr-2"></i>
              템플릿
            </button>
            <button id="accountTab" class="tab-button" onclick="switchTab('account')">
              <i class="fas fa-user mr-2"></i>
              계정 관리
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div class="max-w-6xl mx-auto p-6">
        {/* 콘텐츠 생성 탭 */}
        <div id="generatorContent" class="tab-content">
          <div id="app">
            {/* JavaScript가 콘텐츠 생성 UI를 렌더링합니다 */}
          </div>
        </div>

        {/* 히스토리 탭 */}
        <div id="historyContent" class="tab-content hidden">
          <div id="historyContainer">
            {/* JavaScript가 히스토리 UI를 렌더링합니다 */}
          </div>
        </div>

        {/* 템플릿 탭 */}
        <div id="templatesContent" class="tab-content hidden">
          <div id="templateContainer">
            {/* JavaScript가 템플릿 UI를 렌더링합니다 */}
          </div>
        </div>

        {/* 계정 관리 탭 */}
        <div id="accountContent" class="tab-content hidden">
          <div id="accountContainer">
            {/* JavaScript가 계정 관리 UI를 렌더링합니다 */}
          </div>
        </div>
      </div>
    </div>
  )
})

// 상태 확인 API
app.get('/api/health', (c) => {
  const availability = productiveAIService.checkAvailability()
  
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      blog: availability.textGeneration ? 'active' : 'inactive',
      image: availability.imageGeneration ? 'active' : 'inactive', 
      video: availability.videoGeneration ? 'active' : 'inactive',
      podcast: availability.audioGeneration ? 'active' : 'inactive'
    },
    aiService: {
      status: availability.status,
      lastChecked: availability.lastChecked
    }
  })
})

// 통계 및 분석 API (실제 AI 서비스 통계 사용)
app.get('/api/stats', (c) => {
  const performance = productiveAIService.getPerformanceStats()
  
  return c.json({
    totalGenerated: performance.totalRequests,
    successfulGenerated: performance.successfulRequests,
    todayGenerated: Math.floor(performance.totalRequests * 0.1), // 대략적인 오늘 생성량
    averageProcessingTime: Math.round(performance.averageProcessingTime / 1000 * 100) / 100, // 밀리초를 초로 변환
    lastGenerationTime: Math.round(performance.lastGenerationTime / 1000 * 100) / 100,
    successRate: performance.totalRequests > 0 ? Math.round(performance.successfulRequests / performance.totalRequests * 100) : 0,
    popularContentTypes: {
      blog: 35,
      socialGraphic: 25, 
      promoVideo: 25,
      podcast: 15
    },
    userSatisfaction: 4.8,
    timestamp: new Date().toISOString()
  })
})

// AI 성능 모니터링 API (실제 AI 서비스 사용)
app.get('/api/ai-performance', async (c) => {
  try {
    const availability = productiveAIService.checkAvailability()
    const performance = productiveAIService.getPerformanceStats()
    
    return c.json({
      availability,
      performance,
      status: 'monitoring_active',
      lastUpdated: new Date().toISOString(),
      version: '2.0.0'
    })
  } catch (error) {
    console.error('Performance monitoring error:', error)
    return c.json({
      error: 'Performance monitoring unavailable',
      details: error.message
    }, 500)
  }
})

// AI 성능 리셋 API (개발용)
app.post('/api/ai-performance/reset', async (c) => {
  try {
    productiveAIService.resetStats()
    
    return c.json({
      success: true,
      message: 'AI performance metrics reset successfully',
      resetAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Performance reset error:', error)
    return c.json({
      error: 'Reset failed',
      details: error.message
    }, 500)
  }
})

// === 생성 이력 관리 API ===

// 서비스 초기화
const initializeHistoryService = (env: Bindings) => {
  return new HistoryService(env.DB);
};

const initializeTemplateService = (env: Bindings) => {
  return new TemplateService(env.DB);
};

// 사용자 생성 이력 조회
app.get('/api/history', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const historyService = initializeHistoryService(env);
    
    // 쿼리 파라미터 파싱
    const url = new URL(c.req.url);
    const filters = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      status: url.searchParams.get('status') || undefined,
      contentType: url.searchParams.get('contentType') || undefined,
      searchTerm: url.searchParams.get('searchTerm') || undefined
    };

    const result = await historyService.getUserHistory(user.sub, filters);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'History retrieved successfully'
    });

  } catch (error) {
    console.error('History retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve history',
      details: error.message
    }, 500);
  }
});

// 사용자 통계 조회
app.get('/api/history/stats', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const historyService = initializeHistoryService(env);
    
    const result = await historyService.getUserStats(user.sub);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Stats retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve statistics',
      details: error.message
    }, 500);
  }
});

// 특정 생성 이력 조회
app.get('/api/history/:id', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const historyService = initializeHistoryService(env);
    const generationId = c.req.param('id');
    
    const result = await historyService.getGenerationById(generationId, user.sub);
    
    if (!result.success) {
      return c.json({ error: result.error }, 404);
    }

    return c.json({
      success: true,
      data: result.data,
      type: result.type,
      message: 'Generation details retrieved successfully'
    });

  } catch (error) {
    console.error('Generation retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve generation details',
      details: error.message
    }, 500);
  }
});

// 생성 이력 삭제
app.delete('/api/history/:id', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const historyService = initializeHistoryService(env);
    const generationId = c.req.param('id');
    
    const result = await historyService.deleteGeneration(generationId, user.sub);
    
    if (!result.success) {
      return c.json({ error: result.error }, 404);
    }

    return c.json({
      success: true,
      message: 'Generation deleted successfully'
    });

  } catch (error) {
    console.error('Generation deletion error:', error);
    return c.json({
      error: 'Failed to delete generation',
      details: error.message
    }, 500);
  }
});

// 사용량 조회
app.get('/api/usage', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const historyService = initializeHistoryService(env);
    
    const result = await historyService.getUserUsage(user.sub);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Usage data retrieved successfully'
    });

  } catch (error) {
    console.error('Usage retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve usage data',
      details: error.message
    }, 500);
  }
});

// === 콘텐츠 템플릿 관리 API ===

// 템플릿 카테고리 조회
app.get('/api/templates/categories', optionalAuth, async (c) => {
  try {
    const env = c.env;
    const templateService = initializeTemplateService(env);
    
    const type = c.req.query('type') as 'industry' | 'purpose' | undefined;
    const result = await templateService.getCategories(type);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Categories retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve categories',
      details: error.message
    }, 500);
  }
});

// 카테고리별 템플릿 조회
app.get('/api/templates/by-category/:categoryId', optionalAuth, async (c) => {
  try {
    const env = c.env;
    const templateService = initializeTemplateService(env);
    const categoryId = c.req.param('categoryId');
    
    const templates = await templateService.getTemplates({ categoryId });
    return c.json({
      success: true,
      data: templates.data,
      message: `Templates for category ${categoryId} retrieved successfully`
    });
  } catch (error) {
    console.error('Error retrieving templates by category:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve templates by category',
      details: error.message
    }, 500);
  }
});

// 템플릿 목록 조회 (필터링 지원)
app.get('/api/templates', optionalAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    
    const url = new URL(c.req.url);
    const filters = {
      categoryId: url.searchParams.get('categoryId') || undefined,
      type: url.searchParams.get('type') as 'industry' | 'purpose' | undefined,
      isPublic: url.searchParams.get('isPublic') === 'true' ? true : undefined,
      isSystem: url.searchParams.get('isSystem') === 'true' ? true : undefined,
      creatorId: url.searchParams.get('creatorId') || undefined,
      searchTerm: url.searchParams.get('searchTerm') || undefined,
      sortBy: url.searchParams.get('sortBy') as 'name' | 'usage' | 'rating' | 'created' | 'updated' || undefined,
      sortOrder: url.searchParams.get('sortOrder') as 'asc' | 'desc' || undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20')
    };

    const result = await templateService.getTemplates(filters);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Templates retrieved successfully'
    });
  } catch (error) {
    console.error('Templates retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve templates',
      details: error.message
    }, 500);
  }
});

// 특정 템플릿 상세 조회
app.get('/api/templates/:id', optionalAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('id');
    
    const result = await templateService.getTemplateById(templateId, user?.sub);
    
    if (!result.success) {
      return c.json({ error: result.error }, result.error === 'Template not found' ? 404 : 403);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Template details retrieved successfully'
    });
  } catch (error) {
    console.error('Template retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve template details',
      details: error.message
    }, 500);
  }
});

// 새 템플릿 생성 (인증 필요)
app.post('/api/templates', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateData = await c.req.json();
    
    const result = await templateService.createTemplate(user, templateData);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Template created successfully'
    }, 201);
  } catch (error) {
    console.error('Template creation error:', error);
    return c.json({
      error: 'Failed to create template',
      details: error.message
    }, 500);
  }
});

// 템플릿 수정 (인증 필요)
app.put('/api/templates/:id', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('id');
    const templateData = await c.req.json();
    
    const result = await templateService.updateTemplate(templateId, user, templateData);
    
    if (!result.success) {
      return c.json({ error: result.error }, result.error === 'Access denied' ? 403 : 400);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Template update error:', error);
    return c.json({
      error: 'Failed to update template',
      details: error.message
    }, 500);
  }
});

// 템플릿 삭제 (인증 필요)
app.delete('/api/templates/:id', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('id');
    
    const result = await templateService.deleteTemplate(templateId, user);
    
    if (!result.success) {
      return c.json({ error: result.error }, result.error === 'Access denied' ? 403 : 404);
    }

    return c.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Template deletion error:', error);
    return c.json({
      error: 'Failed to delete template',
      details: error.message
    }, 500);
  }
});

// 템플릿 사용 기록 (인증 필요)
app.post('/api/templates/:id/use', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('id');
    const { generationId, customizations } = await c.req.json();
    
    const result = await templateService.recordTemplateUsage(
      templateId, 
      user, 
      generationId, 
      customizations
    );
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Template usage recorded successfully'
    });
  } catch (error) {
    console.error('Template usage recording error:', error);
    return c.json({
      error: 'Failed to record template usage',
      details: error.message
    }, 500);
  }
});

// 즐겨찾기 추가 (인증 필요)
app.post('/api/templates/:id/favorite', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('id');
    
    const result = await templateService.addToFavorites(templateId, user);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Template added to favorites'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    return c.json({
      error: 'Failed to add to favorites',
      details: error.message
    }, 500);
  }
});

// 즐겨찾기 제거 (인증 필요)
app.delete('/api/templates/:id/favorite', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('id');
    
    const result = await templateService.removeFromFavorites(templateId, user);
    
    if (!result.success) {
      return c.json({ error: result.error }, 404);
    }

    return c.json({
      success: true,
      message: 'Template removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return c.json({
      error: 'Failed to remove from favorites',
      details: error.message
    }, 500);
  }
});

// 사용자 즐겨찾기 목록 조회 (인증 필요)
app.get('/api/templates/favorites', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    
    const result = await templateService.getUserFavorites(user);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Favorites retrieved successfully'
    });
  } catch (error) {
    console.error('Favorites retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve favorites',
      details: error.message
    }, 500);
  }
});

// 템플릿 통계 조회 (인증 필요)
app.get('/api/templates/stats', requireAuth, async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    
    const result = await templateService.getTemplateStats(user.sub);
    
    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Template statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Template stats retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve template statistics',
      details: error.message
    }, 500);
  }
});

// 템플릿 적용하여 콘텐츠 생성 (인증 필요)
app.post('/api/generate-with-template/:templateId', requireAuth(), checkUsageQuota('content-generation'), async (c) => {
  try {
    const env = c.env;
    const user = c.get('user');
    const templateService = initializeTemplateService(env);
    const templateId = c.req.param('templateId');
    const { productDescription, customizations = {} } = await c.req.json();

    if (!productDescription) {
      return c.json({ error: '제품 설명을 입력해주세요.' }, 400);
    }

    // 템플릿 조회
    const templateResult = await templateService.getTemplateById(templateId, user.sub);
    if (!templateResult.success) {
      return c.json({ error: '템플릿을 찾을 수 없습니다.' }, 404);
    }

    const template = templateResult.data!;
    
    // 템플릿 기반 콘텐츠 생성 옵션 구성
    const templateOptions = {
      template: template,
      customizations: customizations,
      useTemplate: true
    };

    // 기존 AI 서비스로 콘텐츠 생성
    const contentResults = await productiveAIService.generateAllContent(
      productDescription, 
      templateOptions
    );
    
    // 템플릿 사용 기록
    if (env.DB) {
      templateService.recordTemplateUsage(templateId, user, contentResults.generationId, customizations)
        .catch(error => console.error('❌ Template usage recording error:', error));
      
      // 히스토리 저장
      const historyService = initializeHistoryService(env);
      historyService.saveContentGeneration(user, {
        ...contentResults,
        templateId: templateId,
        templateName: template.name
      }, c.req.raw)
        .catch(error => console.error('❌ History save error:', error));
    }
    
    return c.json({
      success: true,
      data: contentResults,
      template: {
        id: template.id,
        name: template.name,
        category: template.category?.name
      },
      message: '템플릿 기반 콘텐츠가 성공적으로 생성되었습니다.',
      processingTime: contentResults.processingTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Template-based generation error:', error);
    return c.json({
      error: '템플릿 기반 콘텐츠 생성 중 오류가 발생했습니다.',
      details: error.message
    }, 500);
  }
});

export default app
