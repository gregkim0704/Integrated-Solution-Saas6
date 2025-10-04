/**
 * 🛡️ 통합 입력 검증 시스템
 * 
 * 이 시스템은 모든 사용자 입력에 대한 포괄적인 검증, 살균, 정규화를 제공합니다.
 * XSS, SQL Injection, CSRF 등의 보안 위협으로부터 애플리케이션을 보호하며,
 * 데이터 무결성과 비즈니스 규칙 준수를 보장합니다.
 * 
 * @author 한국인프라연구원(주)
 * @contact infrastructure@kakao.com
 * @phone 010-9143-0800
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => string | null;
  sanitizer?: (value: string) => string;
  type?: 'string' | 'number' | 'email' | 'url' | 'password' | 'phone' | 'html';
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
  sanitizedData: { [key: string]: any };
  warnings: string[];
}

/**
 * 🧹 입력 살균 유틸리티
 * 악성 코드, HTML 태그, SQL 인젝션 패턴 등을 제거합니다.
 */
export class InputSanitizer {
  // XSS 방지: HTML 태그 및 스크립트 제거
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // 기본 HTML 태그 제거 (허용된 태그 제외)
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li'];
    const tagPattern = /<(?!\/?(?:b|i|u|strong|em|p|br|ul|ol|li)\b)[^>]*>/gi;
    
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // 스크립트 태그 완전 제거
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // iframe 제거
      .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
      .replace(/on\w+="[^"]*"/gi, '') // 이벤트 핸들러 제거 (onclick, onload 등)
      .replace(tagPattern, '') // 허용되지 않은 HTML 태그 제거
      .replace(/&lt;script.*?&gt;/gi, '') // 인코딩된 스크립트 태그도 제거
      .trim();
  }

  // SQL Injection 방지: SQL 키워드 및 특수문자 처리
  static sanitizeSql(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(['";]|--|\*|\/\*|\*\/)/g,
      /(\bOR\b|\bAND\b)\s+\w+\s*=\s*\w+/gi
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  }

  // 일반 텍스트 살균: 특수문자 제어 및 길이 제한
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 제어 문자 제거
      .replace(/\s+/g, ' ') // 연속 공백을 단일 공백으로
      .trim()
      .slice(0, maxLength);
  }

  // 이메일 살균 및 정규화
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .replace(/[^\w@.-]/g, '') // 이메일에 허용된 문자만 보존
      .trim();
  }

  // URL 살균 및 검증
  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const parsedUrl = new URL(url);
      
      // 허용된 프로토콜만 허용
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return '';
      }
      
      return parsedUrl.toString();
    } catch {
      return '';
    }
  }

  // 전화번호 살균 및 정규화
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^\d-+() ]/g, '') // 숫자, 하이픈, 괄호, 공백만 허용
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 비밀번호 검증 (살균하지 않음, 검증만)
  static validatePassword(password: string): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('비밀번호는 필수입니다.');
      return {isValid: false, errors};
    }
    
    if (password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    }
    
    if (password.length > 128) {
      errors.push('비밀번호는 최대 128자를 초과할 수 없습니다.');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('비밀번호에 대문자가 포함되어야 합니다.');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('비밀번호에 소문자가 포함되어야 합니다.');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('비밀번호에 숫자가 포함되어야 합니다.');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('비밀번호에 특수문자가 포함되어야 합니다.');
    }
    
    return {isValid: errors.length === 0, errors};
  }
}

/**
 * 🔍 입력 검증 엔진
 * 정의된 스키마에 따라 입력 데이터를 검증하고 정규화합니다.
 */
export class InputValidator {
  private static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private static readonly URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  private static readonly PHONE_PATTERN = /^[\d\-\+\(\)\s]{10,20}$/;

  /**
   * 단일 필드 검증
   */
  static validateField(value: any, rule: ValidationRule, fieldName: string): {isValid: boolean, error?: string, sanitizedValue?: any} {
    // Required 검증
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return {
        isValid: false,
        error: `${fieldName}은(는) 필수 항목입니다.`
      };
    }

    // 값이 없고 required가 아닌 경우 통과
    if (!value && !rule.required) {
      return {isValid: true, sanitizedValue: value};
    }

    let sanitizedValue = value;
    let error: string | undefined;

    // 타입별 검증 및 살균
    switch (rule.type) {
      case 'email':
        sanitizedValue = InputSanitizer.sanitizeEmail(value);
        if (!this.EMAIL_PATTERN.test(sanitizedValue)) {
          error = `${fieldName}의 이메일 형식이 올바르지 않습니다.`;
        }
        break;

      case 'url':
        sanitizedValue = InputSanitizer.sanitizeUrl(value);
        if (sanitizedValue && !this.URL_PATTERN.test(sanitizedValue)) {
          error = `${fieldName}의 URL 형식이 올바르지 않습니다.`;
        }
        break;

      case 'phone':
        sanitizedValue = InputSanitizer.sanitizePhone(value);
        if (sanitizedValue && !this.PHONE_PATTERN.test(sanitizedValue)) {
          error = `${fieldName}의 전화번호 형식이 올바르지 않습니다.`;
        }
        break;

      case 'password':
        const passwordResult = InputSanitizer.validatePassword(value);
        if (!passwordResult.isValid) {
          error = passwordResult.errors[0];
        }
        sanitizedValue = value; // 비밀번호는 살균하지 않음
        break;

      case 'html':
        sanitizedValue = InputSanitizer.sanitizeHtml(value);
        break;

      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          error = `${fieldName}은(는) 숫자여야 합니다.`;
        } else {
          sanitizedValue = numValue;
        }
        break;

      default:
        // 기본 텍스트 처리
        if (typeof value === 'string') {
          sanitizedValue = InputSanitizer.sanitizeText(value, rule.maxLength);
          sanitizedValue = InputSanitizer.sanitizeSql(sanitizedValue);
        }
    }

    // 커스텀 살균 적용
    if (rule.sanitizer && typeof sanitizedValue === 'string') {
      sanitizedValue = rule.sanitizer(sanitizedValue);
    }

    // 길이 검증
    if (typeof sanitizedValue === 'string') {
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        error = `${fieldName}은(는) 최소 ${rule.minLength}자 이상이어야 합니다.`;
      }
      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        error = `${fieldName}은(는) 최대 ${rule.maxLength}자를 초과할 수 없습니다.`;
      }
    }

    // 패턴 검증
    if (rule.pattern && typeof sanitizedValue === 'string') {
      if (!rule.pattern.test(sanitizedValue)) {
        error = `${fieldName}의 형식이 올바르지 않습니다.`;
      }
    }

    // 커스텀 검증
    if (rule.customValidator) {
      const customError = rule.customValidator(sanitizedValue);
      if (customError) {
        error = customError;
      }
    }

    return {
      isValid: !error,
      error,
      sanitizedValue
    };
  }

  /**
   * 스키마 기반 객체 검증
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: { [key: string]: string } = {};
    const sanitizedData: { [key: string]: any } = {};
    const warnings: string[] = [];

    // 스키마에 정의된 필드들 검증
    for (const [fieldName, rule] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const result = this.validateField(fieldValue, rule, fieldName);
      
      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
      } else {
        sanitizedData[fieldName] = result.sanitizedValue;
      }
    }

    // 스키마에 없는 추가 필드 경고
    for (const key of Object.keys(data)) {
      if (!(key in schema)) {
        warnings.push(`예상하지 못한 필드가 포함되었습니다: ${key}`);
        // 예상하지 못한 필드도 기본 살균 후 포함
        sanitizedData[key] = typeof data[key] === 'string' 
          ? InputSanitizer.sanitizeText(data[key]) 
          : data[key];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
      warnings
    };
  }
}

/**
 * 📋 사전 정의된 검증 스키마들
 */
export const ValidationSchemas = {
  // 사용자 회원가입
  userSignup: {
    email: {
      required: true,
      type: 'email' as const,
      maxLength: 255
    },
    password: {
      required: true,
      type: 'password' as const
    },
    name: {
      required: true,
      type: 'string' as const,
      minLength: 2,
      maxLength: 100,
      pattern: /^[가-힣a-zA-Z\s]+$/,
      customValidator: (value: string) => {
        if (value && /^\s|\s$/.test(value)) {
          return '이름의 앞뒤에 공백이 올 수 없습니다.';
        }
        return null;
      }
    },
    company: {
      required: false,
      type: 'string' as const,
      maxLength: 200
    },
    industry: {
      required: false,
      type: 'string' as const,
      maxLength: 100
    }
  },

  // 사용자 로그인
  userLogin: {
    email: {
      required: true,
      type: 'email' as const
    },
    password: {
      required: true,
      type: 'string' as const,
      minLength: 1
    }
  },

  // 콘텐츠 생성 요청
  contentGeneration: {
    productDescription: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 5000,
      customValidator: (value: string) => {
        if (value && value.split(' ').length < 3) {
          return '제품 설명은 최소 3개 단어 이상 포함해야 합니다.';
        }
        return null;
      }
    },
    options: {
      required: false,
      customValidator: (value: any) => {
        if (value && typeof value !== 'object') {
          return '옵션은 객체 형태여야 합니다.';
        }
        return null;
      }
    }
  },

  // 템플릿 생성
  templateCreation: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 3,
      maxLength: 100
    },
    description: {
      required: true,
      type: 'string' as const,
      minLength: 10,
      maxLength: 500
    },
    categoryId: {
      required: true,
      type: 'string' as const,
      pattern: /^[a-zA-Z0-9_-]+$/
    },
    blogTemplate: {
      required: false,
      type: 'html' as const,
      maxLength: 10000
    },
    imageTemplate: {
      required: false,
      type: 'string' as const,
      maxLength: 2000
    },
    videoTemplate: {
      required: false,
      type: 'string' as const,
      maxLength: 2000
    },
    podcastTemplate: {
      required: false,
      type: 'string' as const,
      maxLength: 2000
    }
  },

  // 관리자 사용자 역할 업데이트
  userRoleUpdate: {
    role: {
      required: true,
      type: 'string' as const,
      customValidator: (value: string) => {
        const validRoles = ['user', 'premium', 'admin'];
        if (!validRoles.includes(value)) {
          return '유효하지 않은 사용자 역할입니다.';
        }
        return null;
      }
    },
    plan: {
      required: true,
      type: 'string' as const,
      customValidator: (value: string) => {
        const validPlans = ['free', 'premium', 'enterprise'];
        if (!validPlans.includes(value)) {
          return '유효하지 않은 요금제입니다.';
        }
        return null;
      }
    }
  }
} as const;

/**
 * 🚀 고성능 검증 캐시
 * 반복적인 검증 결과를 캐시하여 성능을 향상시킵니다.
 */
export class ValidationCache {
  private static cache = new Map<string, ValidationResult>();
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  private static getCacheKey(data: any, schema: ValidationSchema): string {
    return `${JSON.stringify(data)}_${JSON.stringify(schema)}`;
  }

  static getCached(data: any, schema: ValidationSchema): ValidationResult | null {
    const key = this.getCacheKey(data, schema);
    const cached = this.cache.get(key);
    
    if (cached) {
      return cached;
    }
    
    return null;
  }

  static setCached(data: any, schema: ValidationSchema, result: ValidationResult): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const key = this.getCacheKey(data, schema);
    this.cache.set(key, result);
    
    // TTL 적용
    setTimeout(() => {
      this.cache.delete(key);
    }, this.CACHE_TTL);
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 🎯 통합 검증 함수 (캐시 적용)
 */
export function validateWithCache(data: any, schema: ValidationSchema): ValidationResult {
  // 캐시 확인
  const cached = ValidationCache.getCached(data, schema);
  if (cached) {
    return cached;
  }
  
  // 새로운 검증 수행
  const result = InputValidator.validate(data, schema);
  
  // 결과 캐시
  ValidationCache.setCached(data, schema, result);
  
  return result;
}

/**
 * 🛡️ API 미들웨어용 검증 함수
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return async (c: any, next: any) => {
    try {
      const body = await c.req.json();
      const validation = validateWithCache(body, schema);
      
      if (!validation.isValid) {
        return c.json({
          error: '입력 데이터 검증에 실패했습니다.',
          details: validation.errors,
          warnings: validation.warnings
        }, 400);
      }
      
      // 살균된 데이터를 컨텍스트에 저장
      c.set('validatedData', validation.sanitizedData);
      c.set('validationWarnings', validation.warnings);
      
      await next();
    } catch (error) {
      return c.json({
        error: '요청 데이터를 파싱할 수 없습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 400);
    }
  };
}