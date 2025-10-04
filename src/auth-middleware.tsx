// 인증 미들웨어
// JWT 토큰 검증 및 사용자 권한 확인

import type { Context, Next } from 'hono'
import { authService, UserRole, type AuthTokenPayload } from './auth-service'

// 컨텍스트에 사용자 정보 추가
declare module 'hono' {
  interface ContextVariableMap {
    user?: AuthTokenPayload
  }
}

// 인증 필요한 라우트를 위한 미들웨어
export const requireAuth = (requiredRole: UserRole = UserRole.USER) => {
  return async (c: Context, next: Next) => {
    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ 
          error: '인증 토큰이 필요합니다.',
          code: 'MISSING_TOKEN' 
        }, 401);
      }

      const token = authHeader.substring(7); // 'Bearer ' 제거

      // 토큰 검증
      const verificationResult = await authService.verifyToken(token);
      if (!verificationResult.valid) {
        return c.json({ 
          error: '유효하지 않은 토큰입니다.',
          code: 'INVALID_TOKEN',
          details: verificationResult.error 
        }, 401);
      }

      const payload = verificationResult.payload!;

      // 권한 확인
      if (!authService.hasPermission(payload.role as UserRole, requiredRole)) {
        return c.json({ 
          error: '접근 권한이 없습니다.',
          code: 'INSUFFICIENT_PERMISSION',
          required: requiredRole,
          current: payload.role
        }, 403);
      }

      // 사용자 정보를 컨텍스트에 저장
      c.set('user', payload);
      
      console.log(`✅ Authenticated request: ${payload.email} (${payload.role})`);
      
      await next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return c.json({ 
        error: '인증 처리 중 오류가 발생했습니다.',
        code: 'AUTH_ERROR' 
      }, 500);
    }
  };
};

// 선택적 인증 미들웨어 (토큰이 있으면 사용자 정보 설정, 없어도 계속 진행)
export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verificationResult = await authService.verifyToken(token);
      
      if (verificationResult.valid) {
        c.set('user', verificationResult.payload!);
        console.log(`✅ Optional auth: ${verificationResult.payload!.email}`);
      }
    }
    
    await next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // 에러가 있어도 계속 진행
    await next();
  }
};

// CORS 및 보안 헤더 미들웨어
export const securityHeaders = async (c: Context, next: Next) => {
  // 보안 헤더 설정
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // API 요청에 대한 CORS 설정
  if (c.req.path.startsWith('/api/')) {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (c.req.method === 'OPTIONS') {
      return c.text('', 200);
    }
  }
  
  await next();
};

// 사용량 제한 미들웨어 (간단한 구현)
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15분
  ) {}

  middleware = (customLimit?: number) => {
    return async (c: Context, next: Next) => {
      const ip = c.req.header('CF-Connecting-IP') || 
               c.req.header('X-Forwarded-For') || 
               'unknown';
      
      const now = Date.now();
      const limit = customLimit || this.maxRequests;
      
      const record = this.requests.get(ip);
      
      if (!record || now > record.resetTime) {
        // 새로운 윈도우 시작
        this.requests.set(ip, {
          count: 1,
          resetTime: now + this.windowMs
        });
        await next();
        return;
      }
      
      if (record.count >= limit) {
        const resetIn = Math.ceil((record.resetTime - now) / 1000);
        return c.json({
          error: '요청 한도를 초과했습니다.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetIn
        }, 429);
      }
      
      record.count++;
      await next();
    };
  };
}

export const rateLimiter = new RateLimiter();

// 프리미엄 기능 접근 제한
export const requirePremium = async (c: Context, next: Next) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({
      error: '인증이 필요합니다.',
      code: 'AUTH_REQUIRED'
    }, 401);
  }

  if (user.plan === 'free') {
    return c.json({
      error: '프리미엄 플랜이 필요한 기능입니다.',
      code: 'PREMIUM_REQUIRED',
      currentPlan: user.plan,
      upgradeUrl: '/pricing'
    }, 402); // Payment Required
  }

  await next();
};

// 사용량 쿼터 체크 (플랜별 제한)
export const checkUsageQuota = (feature: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        error: '인증이 필요합니다.',
        code: 'AUTH_REQUIRED'
      }, 401);
    }

    // 플랜별 쿼터 설정
    const quotas = {
      free: { 
        'content-generation': 5,    // 월 5회
        'image-generation': 3,      // 월 3회
        'video-generation': 1,      // 월 1회
        'audio-generation': 3       // 월 3회
      },
      basic: {
        'content-generation': 50,   // 월 50회
        'image-generation': 25,     // 월 25회
        'video-generation': 10,     // 월 10회
        'audio-generation': 25      // 월 25회
      },
      premium: {
        'content-generation': 200,  // 월 200회
        'image-generation': 100,    // 월 100회
        'video-generation': 50,     // 월 50회
        'audio-generation': 100     // 월 100회
      },
      enterprise: {
        'content-generation': -1,   // 무제한
        'image-generation': -1,     // 무제한
        'video-generation': -1,     // 무제한
        'audio-generation': -1      // 무제한
      }
    };

    const userQuota = quotas[user.plan as keyof typeof quotas]?.[feature as keyof typeof quotas.free];
    
    if (userQuota === undefined) {
      return c.json({
        error: '지원하지 않는 기능입니다.',
        code: 'FEATURE_NOT_SUPPORTED'
      }, 400);
    }

    if (userQuota === -1) {
      // 무제한 플랜
      await next();
      return;
    }

    // 실제로는 데이터베이스에서 사용량을 확인해야 함
    // 여기서는 간단히 구현
    const currentUsage = 0; // TODO: 실제 사용량 조회
    
    if (currentUsage >= userQuota) {
      return c.json({
        error: `${feature} 월 사용량을 초과했습니다.`,
        code: 'QUOTA_EXCEEDED',
        currentPlan: user.plan,
        currentUsage,
        maxUsage: userQuota,
        upgradeUrl: '/pricing'
      }, 402);
    }

    await next();
  };
};

// 로깅 미들웨어
export const apiLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const user = c.get('user');
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  const userInfo = user ? `${user.email} (${user.role})` : 'anonymous';
  
  console.log(`📊 API: ${method} ${path} - ${status} (${duration}ms) - User: ${userInfo}`);
};