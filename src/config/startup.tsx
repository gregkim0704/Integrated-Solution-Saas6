// 애플리케이션 시작 시 환경변수 검증 및 초기화

import { env, type ConfigValidationResult } from './environment';
import { AuthService } from '../auth-service';

/**
 * 시작 검사 결과
 */
export interface StartupCheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  config?: any;
}

/**
 * 애플리케이션 시작 시 검증 클래스
 */
export class StartupValidator {
  
  /**
   * 전체 시작 검증 실행
   */
  static async validateAndInitialize(): Promise<StartupCheckResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('🚀 Starting application validation...');
    
    try {
      // 1. 환경변수 검증
      const envResult = await StartupValidator.validateEnvironment();
      if (!envResult.success) {
        errors.push(...envResult.errors);
        warnings.push(...envResult.warnings);
        
        return {
          success: false,
          errors,
          warnings
        };
      }
      warnings.push(...envResult.warnings);
      
      // 2. 보안 설정 검증
      const securityResult = await StartupValidator.validateSecurity();
      if (!securityResult.success) {
        errors.push(...securityResult.errors);
      }
      warnings.push(...securityResult.warnings);
      
      // 3. 서비스 초기화
      const serviceResult = await StartupValidator.initializeServices();
      if (!serviceResult.success) {
        errors.push(...serviceResult.errors);
      }
      warnings.push(...serviceResult.warnings);
      
      // 4. 건강 상태 체크
      const healthResult = await StartupValidator.performHealthCheck();
      warnings.push(...healthResult.warnings);
      
      if (errors.length === 0) {
        console.log('✅ Application validation completed successfully');
        if (warnings.length > 0) {
          console.warn(`⚠️  ${warnings.length} warnings found:`, warnings);
        }
        
        return {
          success: true,
          errors: [],
          warnings,
          config: env.getConfig()
        };
      } else {
        console.error(`❌ Application validation failed with ${errors.length} errors:`, errors);
        return {
          success: false,
          errors,
          warnings
        };
      }
      
    } catch (error) {
      const errorMessage = `Startup validation failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('❌ Critical startup error:', error);
      
      return {
        success: false,
        errors: [errorMessage],
        warnings
      };
    }
  }

  /**
   * 환경변수 검증
   */
  private static async validateEnvironment(): Promise<StartupCheckResult> {
    console.log('🔍 Validating environment variables...');
    
    const result = env.loadAndValidate();
    
    if (result.success) {
      console.log(`✅ Environment validation passed (${result.warnings.length} warnings)`);
      
      // 환경 정보 출력 (민감정보 제외)
      const config = env.getConfig();
      console.log('📊 Environment Summary:', {
        NODE_ENV: config.NODE_ENV,
        PORT: config.PORT,
        DEBUG: config.DEBUG,
        ANALYTICS_ENABLED: config.ANALYTICS_ENABLED,
        hasJwtSecret: !!config.JWT_SECRET,
        hasEncryptionKey: !!config.ENCRYPTION_KEY,
        hasTestAccounts: !!(config.TEST_ADMIN_EMAIL && config.TEST_ADMIN_PASSWORD),
        hasCloudflareConfig: !!(config.CLOUDFLARE_ACCOUNT_ID && config.CLOUDFLARE_API_TOKEN)
      });
      
      return {
        success: true,
        errors: [],
        warnings: result.warnings
      };
    } else {
      console.error('❌ Environment validation failed:', result.errors);
      return {
        success: false,
        errors: result.errors,
        warnings: result.warnings
      };
    }
  }

  /**
   * 보안 설정 검증
   */
  private static async validateSecurity(): Promise<StartupCheckResult> {
    console.log('🔒 Validating security configuration...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const config = env.getConfig();
    
    try {
      // JWT 시크릿 강도 검사
      if (config.JWT_SECRET) {
        const strength = StartupValidator.checkPasswordStrength(config.JWT_SECRET);
        if (strength.score < 3) {
          warnings.push(`JWT_SECRET strength is low (${strength.score}/5): ${strength.feedback.join(', ')}`);
        }
      }
      
      // 암호화 키 강도 검사
      if (config.ENCRYPTION_KEY) {
        const strength = StartupValidator.checkPasswordStrength(config.ENCRYPTION_KEY);
        if (strength.score < 3) {
          warnings.push(`ENCRYPTION_KEY strength is low (${strength.score}/5): ${strength.feedback.join(', ')}`);
        }
      }
      
      // 프로덕션 환경 특별 검사
      if (env.isProduction()) {
        if (!config.SENTRY_DSN) {
          warnings.push('Production environment should have SENTRY_DSN configured for error monitoring');
        }
        
        if (config.DEBUG) {
          warnings.push('DEBUG mode should be disabled in production');
        }
        
        // 테스트 계정이 프로덕션에 있으면 경고
        if (config.TEST_ADMIN_PASSWORD) {
          warnings.push('Test accounts should not be configured in production environment');
        }
      }
      
      console.log('✅ Security validation completed');
      
      return {
        success: true,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorMessage = `Security validation failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);
      
      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * 서비스 초기화
   */
  private static async initializeServices(): Promise<StartupCheckResult> {
    console.log('⚙️  Initializing services...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const config = env.getConfig();
      
      // AuthService 초기화 (JWT 시크릿 전달)
      const authService = new AuthService(config.JWT_SECRET);
      console.log('✅ AuthService initialized');
      
      // 필요에 따라 다른 서비스들도 초기화
      // 예: DatabaseService, CacheService, MonitoringService 등
      
      return {
        success: true,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorMessage = `Service initialization failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);
      
      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * 건강 상태 체크
   */
  private static async performHealthCheck(): Promise<StartupCheckResult> {
    console.log('💗 Performing health check...');
    
    const warnings: string[] = [];
    
    try {
      // 메모리 사용량 체크
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memory = process.memoryUsage();
        const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024);
        
        if (heapUsedMB > 100) {
          warnings.push(`High memory usage detected: ${heapUsedMB}MB`);
        }
        
        console.log(`📊 Memory usage: ${heapUsedMB}MB heap used`);
      }
      
      // 시스템 정보 로깅
      console.log('🖥️  System info:', {
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
        platform: typeof process !== 'undefined' ? process.platform : 'cloudflare-workers',
        uptime: typeof process !== 'undefined' ? Math.round(process.uptime()) : 'n/a'
      });
      
      console.log('✅ Health check completed');
      
      return {
        success: true,
        errors: [],
        warnings
      };
      
    } catch (error) {
      // 건강 체크 실패는 경고로 처리 (앱 시작을 막지 않음)
      warnings.push(`Health check warning: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: true,
        errors: [],
        warnings
      };
    }
  }

  /**
   * 비밀번호/시크릿 강도 검사
   */
  private static checkPasswordStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;
    
    // 길이 체크
    if (password.length >= 32) score++;
    else feedback.push('Should be at least 32 characters');
    
    // 대문자 포함
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Should include uppercase letters');
    
    // 소문자 포함
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Should include lowercase letters');
    
    // 숫자 포함
    if (/\d/.test(password)) score++;
    else feedback.push('Should include numbers');
    
    // 특수문자 포함
    if (/[!@#$%^&*()_+\-=\[\]{}|;:'".,<>?~`]/.test(password)) score++;
    else feedback.push('Should include special characters');
    
    return { score, feedback };
  }

  /**
   * 애플리케이션 종료 시 정리 작업
   */
  static async cleanup(): Promise<void> {
    console.log('🧹 Performing cleanup...');
    
    try {
      // 필요한 정리 작업 수행
      // 예: 데이터베이스 연결 종료, 임시 파일 정리 등
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

/**
 * 프로세스 신호 핸들러 설정
 */
export function setupProcessHandlers(): void {
  if (typeof process !== 'undefined') {
    // 종료 신호 처리
    process.on('SIGTERM', async () => {
      console.log('📦 Received SIGTERM, shutting down gracefully...');
      await StartupValidator.cleanup();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📦 Received SIGINT, shutting down gracefully...');
      await StartupValidator.cleanup();
      process.exit(0);
    });

    // 처리되지 않은 에러 처리
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}