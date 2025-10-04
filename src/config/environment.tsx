// 환경변수 관리 시스템
// 타입 안전한 환경변수 로딩, 검증, 관리

/**
 * 환경변수 스키마 정의
 */
export interface EnvironmentConfig {
  // 기본 환경 설정
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  DEBUG: boolean;
  ANALYTICS_ENABLED: boolean;

  // 보안 설정 (필수)
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;

  // 테스트 계정 설정 (개발환경 필수)
  TEST_ADMIN_EMAIL?: string;
  TEST_ADMIN_PASSWORD?: string;
  TEST_PREMIUM_EMAIL?: string;
  TEST_PREMIUM_PASSWORD?: string;
  TEST_USER_EMAIL?: string;
  TEST_USER_PASSWORD?: string;

  // Cloudflare 설정 (배포시 필수)
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;

  // AI 서비스 설정 (선택사항)
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;

  // 데이터베이스 설정
  DATABASE_URL?: string;
  D1_DATABASE_ID?: string;
  
  // 외부 서비스 설정
  REDIS_URL?: string;
  SENTRY_DSN?: string;
  
  // 이메일 서비스 설정
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
}

/**
 * 환경별 필수 변수 정의
 */
export const REQUIRED_VARS = {
  development: [
    'NODE_ENV', 'PORT', 'JWT_SECRET', 'ENCRYPTION_KEY'
  ],
  staging: [
    'NODE_ENV', 'PORT', 'JWT_SECRET', 'ENCRYPTION_KEY', 
    'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'
  ],
  production: [
    'NODE_ENV', 'PORT', 'JWT_SECRET', 'ENCRYPTION_KEY',
    'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'
  ]
} as const;

/**
 * 환경변수 기본값 (보안적이지 않은 항목만)
 */
export const DEFAULT_VALUES = {
  NODE_ENV: 'development',
  PORT: 3000,
  DEBUG: false,
  ANALYTICS_ENABLED: false
} as const;

/**
 * 환경변수 검증 규칙
 */
export const VALIDATION_RULES = {
  JWT_SECRET: {
    minLength: 32,
    pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:'".,<>?~`]+$/,
    errorMessage: 'JWT_SECRET은 최소 32자 이상의 영숫자+특수문자 조합이어야 합니다.'
  },
  ENCRYPTION_KEY: {
    minLength: 32,
    pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:'".,<>?~`]+$/,
    errorMessage: 'ENCRYPTION_KEY는 최소 32자 이상의 영숫자+특수문자 조합이어야 합니다.'
  },
  PORT: {
    min: 1000,
    max: 65535,
    errorMessage: 'PORT는 1000-65535 범위의 숫자여야 합니다.'
  }
} as const;

/**
 * 환경변수 로딩 및 검증 결과
 */
export interface ConfigValidationResult {
  success: boolean;
  config?: EnvironmentConfig;
  errors: string[];
  warnings: string[];
}

/**
 * 환경변수 관리 클래스
 */
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig | null = null;
  private isLoaded = false;

  private constructor() {}

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * 환경변수 로딩 및 검증
   */
  public loadAndValidate(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. 환경변수 원시 로딩
      const rawConfig = this.loadRawEnvironmentVariables();
      
      // 2. 타입 변환
      const typedConfig = this.convertTypes(rawConfig);
      
      // 3. 필수 변수 검증
      const requiredErrors = this.validateRequiredVariables(typedConfig);
      errors.push(...requiredErrors);
      
      // 4. 값 검증
      const valueErrors = this.validateValues(typedConfig);
      errors.push(...valueErrors);
      
      // 5. 보안 검사
      const securityWarnings = this.performSecurityChecks(typedConfig);
      warnings.push(...securityWarnings);
      
      if (errors.length === 0) {
        this.config = typedConfig;
        this.isLoaded = true;
        
        console.log('✅ Environment configuration loaded successfully');
        if (warnings.length > 0) {
          console.warn('⚠️  Configuration warnings:', warnings);
        }
        
        return {
          success: true,
          config: typedConfig,
          errors: [],
          warnings
        };
      } else {
        console.error('❌ Environment configuration validation failed:', errors);
        return {
          success: false,
          errors,
          warnings
        };
      }
      
    } catch (error) {
      const errorMessage = `Environment loading failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);
      
      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * 설정 값 가져오기
   */
  public getConfig(): EnvironmentConfig {
    if (!this.isLoaded || !this.config) {
      throw new Error('Environment not loaded. Call loadAndValidate() first.');
    }
    return this.config;
  }

  /**
   * 특정 설정 값 가져오기
   */
  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    const config = this.getConfig();
    return config[key];
  }

  /**
   * 환경 타입 확인
   */
  public isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  public isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  public isStaging(): boolean {
    return this.get('NODE_ENV') === 'staging';
  }

  /**
   * 원시 환경변수 로딩
   */
  private loadRawEnvironmentVariables(): Record<string, string | undefined> {
    // Cloudflare Workers 환경에서는 process.env 사용
    // 실제 환경에 따라 다른 방식으로 로딩할 수 있음
    return {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DEBUG: process.env.DEBUG,
      ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED,
      
      JWT_SECRET: process.env.JWT_SECRET,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
      
      TEST_ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD,
      TEST_PREMIUM_EMAIL: process.env.TEST_PREMIUM_EMAIL,
      TEST_PREMIUM_PASSWORD: process.env.TEST_PREMIUM_PASSWORD,
      TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
      
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
      
      DATABASE_URL: process.env.DATABASE_URL,
      D1_DATABASE_ID: process.env.D1_DATABASE_ID,
      
      REDIS_URL: process.env.REDIS_URL,
      SENTRY_DSN: process.env.SENTRY_DSN,
      
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD
    };
  }

  /**
   * 타입 변환
   */
  private convertTypes(raw: Record<string, string | undefined>): EnvironmentConfig {
    return {
      NODE_ENV: (raw.NODE_ENV as any) || DEFAULT_VALUES.NODE_ENV,
      PORT: raw.PORT ? parseInt(raw.PORT, 10) : DEFAULT_VALUES.PORT,
      DEBUG: raw.DEBUG ? raw.DEBUG.toLowerCase() === 'true' : DEFAULT_VALUES.DEBUG,
      ANALYTICS_ENABLED: raw.ANALYTICS_ENABLED ? raw.ANALYTICS_ENABLED.toLowerCase() === 'true' : DEFAULT_VALUES.ANALYTICS_ENABLED,
      
      JWT_SECRET: raw.JWT_SECRET || '',
      ENCRYPTION_KEY: raw.ENCRYPTION_KEY || '',
      
      TEST_ADMIN_EMAIL: raw.TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD: raw.TEST_ADMIN_PASSWORD,
      TEST_PREMIUM_EMAIL: raw.TEST_PREMIUM_EMAIL,
      TEST_PREMIUM_PASSWORD: raw.TEST_PREMIUM_PASSWORD,
      TEST_USER_EMAIL: raw.TEST_USER_EMAIL,
      TEST_USER_PASSWORD: raw.TEST_USER_PASSWORD,
      
      CLOUDFLARE_ACCOUNT_ID: raw.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: raw.CLOUDFLARE_API_TOKEN,
      
      OPENAI_API_KEY: raw.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: raw.ANTHROPIC_API_KEY,
      GOOGLE_AI_API_KEY: raw.GOOGLE_AI_API_KEY,
      
      DATABASE_URL: raw.DATABASE_URL,
      D1_DATABASE_ID: raw.D1_DATABASE_ID,
      
      REDIS_URL: raw.REDIS_URL,
      SENTRY_DSN: raw.SENTRY_DSN,
      
      SMTP_HOST: raw.SMTP_HOST,
      SMTP_PORT: raw.SMTP_PORT ? parseInt(raw.SMTP_PORT, 10) : undefined,
      SMTP_USER: raw.SMTP_USER,
      SMTP_PASSWORD: raw.SMTP_PASSWORD
    };
  }

  /**
   * 필수 변수 검증
   */
  private validateRequiredVariables(config: EnvironmentConfig): string[] {
    const errors: string[] = [];
    const required = REQUIRED_VARS[config.NODE_ENV] || REQUIRED_VARS.development;
    
    for (const key of required) {
      const value = config[key as keyof EnvironmentConfig];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Required environment variable ${key} is missing or empty`);
      }
    }
    
    return errors;
  }

  /**
   * 값 검증
   */
  private validateValues(config: EnvironmentConfig): string[] {
    const errors: string[] = [];
    
    // JWT_SECRET 검증
    if (config.JWT_SECRET) {
      const rule = VALIDATION_RULES.JWT_SECRET;
      if (config.JWT_SECRET.length < rule.minLength || !rule.pattern.test(config.JWT_SECRET)) {
        errors.push(rule.errorMessage);
      }
    }
    
    // ENCRYPTION_KEY 검증
    if (config.ENCRYPTION_KEY) {
      const rule = VALIDATION_RULES.ENCRYPTION_KEY;
      if (config.ENCRYPTION_KEY.length < rule.minLength || !rule.pattern.test(config.ENCRYPTION_KEY)) {
        errors.push(rule.errorMessage);
      }
    }
    
    // PORT 검증
    if (config.PORT) {
      const rule = VALIDATION_RULES.PORT;
      if (config.PORT < rule.min || config.PORT > rule.max) {
        errors.push(rule.errorMessage);
      }
    }
    
    // NODE_ENV 검증
    if (!['development', 'staging', 'production'].includes(config.NODE_ENV)) {
      errors.push('NODE_ENV must be one of: development, staging, production');
    }
    
    return errors;
  }

  /**
   * 보안 검사
   */
  private performSecurityChecks(config: EnvironmentConfig): string[] {
    const warnings: string[] = [];
    
    // 프로덕션 환경 보안 검사
    if (config.NODE_ENV === 'production') {
      if (config.DEBUG) {
        warnings.push('DEBUG mode is enabled in production environment');
      }
      
      if (!config.SENTRY_DSN) {
        warnings.push('SENTRY_DSN is not configured for production monitoring');
      }
      
      // 기본값 사용 경고
      if (config.JWT_SECRET.includes('change-in-production')) {
        warnings.push('JWT_SECRET appears to be using default value in production');
      }
    }
    
    // 테스트 계정 검사
    if (config.NODE_ENV === 'development') {
      if (!config.TEST_ADMIN_EMAIL || !config.TEST_ADMIN_PASSWORD) {
        warnings.push('Test account credentials are not configured for development');
      }
    }
    
    return warnings;
  }
}

/**
 * 전역 환경변수 인스턴스
 */
export const env = EnvironmentManager.getInstance();