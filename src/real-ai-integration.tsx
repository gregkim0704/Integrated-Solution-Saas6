// 실제 AI 생성 도구 통합 모듈
// 이 모듈은 현재 환경의 실제 AI 생성 함수들을 직접 호출합니다.

/**
 * 실제 이미지 생성 - 현재 환경의 image_generation 도구 사용
 */
export async function realImageGeneration(params: {
  query: string;
  model?: string;
  aspect_ratio?: string;
  task_summary: string;
}): Promise<{imageUrl: string; processingTime: number}> {
  
  const startTime = Date.now();
  
  try {
    console.log('🎨 Starting real image generation with advanced AI...');
    
    // 실제 image_generation 함수 호출
    const result = await image_generation({
      query: params.query,
      model: params.model || 'flux-pro/ultra',
      aspect_ratio: params.aspect_ratio || '16:9', 
      image_urls: [],
      task_summary: params.task_summary
    });
    
    const processingTime = Date.now() - startTime;
    
    return {
      imageUrl: result.image_url || result.url || result.imageUrl,
      processingTime
    };
    
  } catch (error) {
    console.error('Real image generation failed:', error);
    throw error;
  }
}

/**
 * 실제 비디오 생성 - 현재 환경의 video_generation 도구 사용
 */
export async function realVideoGeneration(params: {
  query: string;
  model?: string;
  aspect_ratio?: string;
  duration?: number;
  task_summary: string;
}): Promise<{videoUrl: string; thumbnail?: string; processingTime: number}> {
  
  const startTime = Date.now();
  
  try {
    console.log('🎬 Starting real video generation with advanced AI...');
    
    // 실제 video_generation 함수 호출
    const result = await video_generation({
      query: params.query,
      model: params.model || 'kling/v2.5-turbo/pro',
      aspect_ratio: params.aspect_ratio || '16:9',
      duration: params.duration || 30,
      image_urls: [],
      task_summary: params.task_summary
    });
    
    const processingTime = Date.now() - startTime;
    
    return {
      videoUrl: result.video_url || result.url || result.videoUrl,
      thumbnail: result.thumbnail,
      processingTime
    };
    
  } catch (error) {
    console.error('Real video generation failed:', error);
    throw error;
  }
}

/**
 * 실제 오디오 생성 - 현재 환경의 audio_generation 도구 사용
 */
export async function realAudioGeneration(params: {
  query: string;
  model?: string;
  requirements?: string;
  task_summary: string;
}): Promise<{audioUrl: string; duration: number; processingTime: number}> {
  
  const startTime = Date.now();
  
  try {
    console.log('🎵 Starting real audio generation with advanced AI...');
    
    // 실제 audio_generation 함수 호출
    const result = await audio_generation({
      model: params.model || 'fal-ai/minimax/speech-02-hd',
      query: params.query,
      requirements: params.requirements || 'Professional Korean voice, clear pronunciation',
      task_summary: params.task_summary
    });
    
    const processingTime = Date.now() - startTime;
    
    return {
      audioUrl: result.audio_url || result.url || result.audioUrl,
      duration: result.duration || estimateAudioDuration(params.query),
      processingTime
    };
    
  } catch (error) {
    console.error('Real audio generation failed:', error);
    throw error;
  }
}

/**
 * 텍스트 기반 오디오 길이 예측
 */
function estimateAudioDuration(text: string): number {
  // 한국어: 분당 약 120-150단어, 영어: 분당 약 150-180단어
  const wordCount = text.split(/\s+/).length;
  const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  const wordsPerMinute = isKorean ? 135 : 165;
  
  return Math.ceil((wordCount / wordsPerMinute) * 60); // 초 단위 반환
}

/**
 * 실제 AI 도구 가용성 체크
 */
export function checkAIToolsAvailability(): {
  imageGeneration: boolean;
  videoGeneration: boolean;
  audioGeneration: boolean;
} {
  return {
    imageGeneration: typeof image_generation === 'function',
    videoGeneration: typeof video_generation === 'function', 
    audioGeneration: typeof audio_generation === 'function'
  };
}

/**
 * AI 생성 상태 및 성능 모니터링
 */
export class AIPerformanceMonitor {
  private static metrics: {
    imageGeneration: { calls: number; totalTime: number; errors: number; };
    videoGeneration: { calls: number; totalTime: number; errors: number; };
    audioGeneration: { calls: number; totalTime: number; errors: number; };
  } = {
    imageGeneration: { calls: 0, totalTime: 0, errors: 0 },
    videoGeneration: { calls: 0, totalTime: 0, errors: 0 },
    audioGeneration: { calls: 0, totalTime: 0, errors: 0 }
  };

  static recordCall(type: keyof typeof this.metrics, processingTime: number, success: boolean) {
    const metric = this.metrics[type];
    metric.calls++;
    metric.totalTime += processingTime;
    if (!success) metric.errors++;
  }

  static getStats() {
    const stats = {};
    
    Object.entries(this.metrics).forEach(([type, metric]) => {
      stats[type] = {
        totalCalls: metric.calls,
        averageTime: metric.calls > 0 ? Math.round(metric.totalTime / metric.calls) : 0,
        errorRate: metric.calls > 0 ? Math.round((metric.errors / metric.calls) * 100) : 0,
        successRate: metric.calls > 0 ? Math.round(((metric.calls - metric.errors) / metric.calls) * 100) : 0
      };
    });
    
    return stats;
  }

  static reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = { calls: 0, totalTime: 0, errors: 0 };
    });
  }
}

// 글로벌 타입 선언 (현재 환경의 AI 함수들)
declare global {
  function image_generation(params: {
    query: string;
    model: string;
    aspect_ratio: string;
    image_urls: string[];
    task_summary: string;
  }): Promise<any>;

  function video_generation(params: {
    query: string;
    model: string;
    aspect_ratio: string;
    duration: number;
    image_urls: string[];
    task_summary: string;
  }): Promise<any>;

  function audio_generation(params: {
    model: string;
    query: string;
    requirements: string;
    task_summary: string;
  }): Promise<any>;
}