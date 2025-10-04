import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { renderer } from './renderer'
import { AIContentGenerator } from './content-ai'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())
app.use(renderer)

// API Routes
app.post('/api/generate-content', async (c) => {
  const body = await c.req.json()
  const { productDescription, options = {} } = body

  if (!productDescription) {
    return c.json({ error: '제품 설명을 입력해주세요.' }, 400)
  }

  try {
    // AI 콘텐츠 생성기 인스턴스 생성
    const aiGenerator = new AIContentGenerator()
    
    // 통합 콘텐츠 생성 실행
    const contentResults = await aiGenerator.generateAllContent(productDescription, options)
    
    return c.json({
      success: true,
      data: contentResults,
      message: '모든 콘텐츠가 성공적으로 생성되었습니다.',
      processingTime: contentResults.processingTime
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return c.json({ 
      error: '콘텐츠 생성 중 오류가 발생했습니다.',
      details: error.message 
    }, 500)
  }
})

// 개별 콘텐츠 타입별 API
app.post('/api/generate-blog', async (c) => {
  const { productDescription } = await c.req.json()
  try {
    const aiGenerator = new AIContentGenerator()
    const analysis = await aiGenerator['analyzeProduct'](productDescription)
    const blogContent = await aiGenerator['generateBlogPost'](productDescription, analysis, {})
    return c.json({ success: true, content: blogContent })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/generate-image', async (c) => {
  const { productDescription, style = 'modern' } = await c.req.json()
  try {
    const aiGenerator = new AIContentGenerator()
    const analysis = await aiGenerator['analyzeProduct'](productDescription)
    const imageResult = await aiGenerator['generateSocialGraphic'](productDescription, analysis, { imageStyle: style })
    return c.json({ success: true, ...imageResult })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/generate-video', async (c) => {
  const { productDescription, duration = 30 } = await c.req.json()
  try {
    const aiGenerator = new AIContentGenerator()
    const analysis = await aiGenerator['analyzeProduct'](productDescription)
    const videoResult = await aiGenerator['generatePromoVideo'](productDescription, analysis, { videoDuration: duration })
    return c.json({ success: true, ...videoResult })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/generate-podcast', async (c) => {
  const { productDescription, voice = 'professional' } = await c.req.json()
  try {
    const aiGenerator = new AIContentGenerator()
    const analysis = await aiGenerator['analyzeProduct'](productDescription)
    const podcastResult = await aiGenerator['generatePodcastContent'](productDescription, analysis, { voice })
    return c.json({ success: true, ...podcastResult })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// 메인 페이지
app.get('/', (c) => {
  return c.render(
    <div id="app">
      {/* JavaScript가 UI를 렌더링합니다 */}
    </div>
  )
})

// 상태 확인 API
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      blog: 'active',
      image: 'active', 
      video: 'active',
      podcast: 'active'
    }
  })
})

// 통계 및 분석 API
app.get('/api/stats', (c) => {
  return c.json({
    totalGenerated: 1250,
    todayGenerated: 45,
    averageProcessingTime: 2.3, // 초
    popularContentTypes: {
      blog: 35,
      socialGraphic: 25, 
      promoVideo: 25,
      podcast: 15
    },
    userSatisfaction: 4.8
  })
})

// AI 성능 모니터링 API
app.get('/api/ai-performance', async (c) => {
  try {
    const { checkAIToolsAvailability, AIPerformanceMonitor } = await import('./real-ai-integration');
    
    const availability = checkAIToolsAvailability();
    const performance = AIPerformanceMonitor.getStats();
    
    return c.json({
      availability,
      performance,
      status: 'monitoring_active',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Performance monitoring unavailable',
      details: error.message
    }, 500);
  }
})

// AI 성능 리셋 API (개발용)
app.post('/api/ai-performance/reset', async (c) => {
  try {
    const { AIPerformanceMonitor } = await import('./real-ai-integration');
    AIPerformanceMonitor.reset();
    
    return c.json({
      success: true,
      message: 'AI performance metrics reset',
      resetAt: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: 'Reset failed',
      details: error.message
    }, 500);
  }
})

export default app
