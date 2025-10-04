// 사용자 계정 및 인증 시스템
// JWT 기반 인증 with Role-based Access Control (RBAC)

import { sign, verify } from 'hono/jwt'

// 사용자 역할 정의
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

// 사용자 모델
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  metadata?: {
    company?: string;
    industry?: string;
    preferredLanguage?: 'ko' | 'en' | 'ja';
    timezone?: string;
  };
}

// 인증 토큰 페이로드
export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: UserRole;
  plan: string;
  iat: number;
  exp: number;
  [key: string]: any; // JWT 호환성을 위한 인덱스 시그니처
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 회원가입 요청
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
  industry?: string;
}

// 인증 응답
export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  message?: string;
  error?: string;
}

export class AuthService {
  private jwtSecret: string;
  private accessTokenExpiry = '1h'; // 1시간
  private refreshTokenExpiry = '7d'; // 7일
  
  // 임시 사용자 저장소 (실제 환경에서는 D1 데이터베이스 사용)
  private users: Map<string, User & { passwordHash: string }> = new Map();
  private refreshTokens: Set<string> = new Set();
  
  // 로그인 시도 제한 (브루트포스 방지)
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15분

  constructor(jwtSecret?: string) {
    // 환경변수 시스템에서 JWT 시크릿 로드
    this.jwtSecret = jwtSecret || 'temporary-key-will-be-replaced-by-env-system';
    
    console.log('🔐 AuthService initialized');
    
    // 테스트 사용자 생성 (환경변수에서 로드)
    this.createTestUsers();
  }
  
  /**
   * 환경변수 시스템에서 JWT 시크릿 업데이트
   */
  public updateJwtSecret(jwtSecret: string): void {
    this.jwtSecret = jwtSecret;
    console.log('🔑 JWT secret updated from environment system');
  }

  // 테스트 사용자 생성 (환경변수 기반)
  private async createTestUsers() {
    try {
      // 환경변수에서 안전하게 테스트 계정 정보 로드
      const testUsers = [
        {
          email: process.env.TEST_ADMIN_EMAIL || 'admin@infrastructure-research.com',
          password: process.env.TEST_ADMIN_PASSWORD || 'DefaultAdmin2024!SecurePassword',
          name: '관리자',
          role: UserRole.ADMIN,
          plan: 'enterprise' as const,
          company: '한국인프라연구원(주)'
        },
        {
          email: process.env.TEST_PREMIUM_EMAIL || 'premium@infrastructure-research.com',
          password: process.env.TEST_PREMIUM_PASSWORD || 'DefaultPremium2024!SecurePassword',
          name: '프리미엄 사용자',
          role: UserRole.PREMIUM,
          plan: 'premium' as const,
          company: '프리미엄 컨설팅'
        },
        {
          email: process.env.TEST_USER_EMAIL || 'user@infrastructure-research.com',
          password: process.env.TEST_USER_PASSWORD || 'DefaultUser2024!SecurePassword',
          name: '일반 사용자',
          role: UserRole.USER,
          plan: 'free' as const
        }
      ];
      
      // 환경변수 로딩 상태 확인
      const hasCustomCredentials = !!(
        process.env.TEST_ADMIN_EMAIL && 
        process.env.TEST_ADMIN_PASSWORD &&
        !process.env.TEST_ADMIN_PASSWORD.includes('Default')
      );
      
      if (!hasCustomCredentials && process.env.NODE_ENV === 'development') {
        console.warn('⚠️  [개발 환경] 기본 테스트 계정을 사용 중입니다. .env 파일에서 TEST_*_EMAIL, TEST_*_PASSWORD를 설정하세요.');
      }

      for (const userData of testUsers) {
        const passwordHash = await this.hashPassword(userData.password);
        const user: User & { passwordHash: string } = {
          id: this.generateUserId(),
          email: userData.email,
          name: userData.name,
          role: userData.role,
          plan: userData.plan,
          createdAt: new Date().toISOString(),
          isActive: true,
          passwordHash,
          metadata: {
            company: userData.company,
            preferredLanguage: 'ko',
            timezone: 'Asia/Seoul'
          }
        };
        
        this.users.set(userData.email, user);
      }
      
      console.log(`✅ Created ${testUsers.length} test users`);
    } catch (error) {
      console.error('❌ Failed to create test users:', error);
      throw error;
    }
  }

  // 사용자 ID 생성
  private generateUserId(): string {
    return 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 비밀번호 해시 (간단한 구현, 실제로는 bcrypt 사용)
  private async hashPassword(password: string): Promise<string> {
    // 실제 환경에서는 bcrypt를 사용해야 함
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 비밀번호 검증
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

  // JWT 토큰 생성
  private async generateAccessToken(user: User): Promise<string> {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1시간
    };

    return await sign(payload, this.jwtSecret);
  }

  // 리프레시 토큰 생성
  private generateRefreshToken(): string {
    const token = 'rt_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
    this.refreshTokens.add(token);
    return token;
  }

  // 로그인 시도 제한 확인
  private checkLoginAttempts(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return true;

    const now = Date.now();
    if (now - attempts.lastAttempt > this.LOCKOUT_DURATION) {
      this.loginAttempts.delete(email);
      return true;
    }

    return attempts.count < this.MAX_LOGIN_ATTEMPTS;
  }

  // 로그인 시도 기록
  private recordLoginAttempt(email: string, success: boolean) {
    if (success) {
      this.loginAttempts.delete(email);
      return;
    }

    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(email, attempts);
  }

  // 사용자 등록
  public async signup(request: SignupRequest): Promise<AuthResponse> {
    try {
      // 이메일 중복 확인
      if (this.users.has(request.email)) {
        return {
          success: false,
          error: '이미 가입된 이메일 주소입니다.'
        };
      }

      // 비밀번호 복잡성 검증
      if (!this.validatePassword(request.password)) {
        return {
          success: false,
          error: '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.'
        };
      }

      // 이메일 형식 검증
      if (!this.validateEmail(request.email)) {
        return {
          success: false,
          error: '올바른 이메일 주소 형식이 아닙니다.'
        };
      }

      // 새 사용자 생성
      const passwordHash = await this.hashPassword(request.password);
      const newUser: User & { passwordHash: string } = {
        id: this.generateUserId(),
        email: request.email,
        name: request.name,
        role: UserRole.USER,
        plan: 'free',
        createdAt: new Date().toISOString(),
        isActive: true,
        passwordHash,
        metadata: {
          company: request.company,
          industry: request.industry,
          preferredLanguage: 'ko',
          timezone: 'Asia/Seoul'
        }
      };

      this.users.set(request.email, newUser);

      // 토큰 생성
      const accessToken = await this.generateAccessToken(newUser);
      const refreshToken = this.generateRefreshToken();

      const { passwordHash: _, ...userWithoutPassword } = newUser;

      console.log(`✅ New user registered: ${request.email}`);

      return {
        success: true,
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: 3600,
        message: '회원가입이 완료되었습니다.'
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: '회원가입 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 로그인
  public async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // 로그인 시도 제한 확인
      if (!this.checkLoginAttempts(request.email)) {
        return {
          success: false,
          error: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
        };
      }

      // 사용자 확인
      const user = this.users.get(request.email);
      if (!user) {
        this.recordLoginAttempt(request.email, false);
        return {
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.'
        };
      }

      // 계정 활성화 상태 확인
      if (!user.isActive) {
        return {
          success: false,
          error: '비활성화된 계정입니다. 관리자에게 문의하세요.'
        };
      }

      // 비밀번호 확인
      const isValidPassword = await this.verifyPassword(request.password, user.passwordHash);
      if (!isValidPassword) {
        this.recordLoginAttempt(request.email, false);
        return {
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.'
        };
      }

      // 로그인 성공 처리
      this.recordLoginAttempt(request.email, true);
      
      // 최근 로그인 시간 업데이트
      user.lastLoginAt = new Date().toISOString();

      // 토큰 생성
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();

      const { passwordHash: _, ...userWithoutPassword } = user;

      console.log(`✅ User logged in: ${request.email} (${user.role})`);

      return {
        success: true,
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: 3600,
        message: '로그인되었습니다.'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: '로그인 중 오류가 발생했습니다.'
      };
    }
  }

  // 토큰 검증
  public async verifyToken(token: string): Promise<{ valid: boolean; payload?: AuthTokenPayload; error?: string }> {
    try {
      const jwtPayload = await verify(token, this.jwtSecret);
      const payload = jwtPayload as AuthTokenPayload;
      
      // 사용자 존재 및 활성화 확인
      const user = Array.from(this.users.values()).find(u => u.id === payload.sub);
      if (!user || !user.isActive) {
        return { valid: false, error: 'User not found or inactive' };
      }

      return { valid: true, payload };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false, error: 'Invalid or expired token' };
    }
  }

  // 토큰 갱신
  public async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // 리프레시 토큰 유효성 확인
      if (!this.refreshTokens.has(refreshToken)) {
        return {
          success: false,
          error: '유효하지 않은 리프레시 토큰입니다.'
        };
      }

      // 실제로는 리프레시 토큰에서 사용자 ID를 추출해야 함
      // 여기서는 간단히 구현
      const user = Array.from(this.users.values())[0]; // 임시
      
      const accessToken = await this.generateAccessToken(user);
      
      return {
        success: true,
        accessToken,
        expiresIn: 3600,
        message: '토큰이 갱신되었습니다.'
      };

    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: '토큰 갱신 중 오류가 발생했습니다.'
      };
    }
  }

  // 로그아웃
  public async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    try {
      this.refreshTokens.delete(refreshToken);
      return {
        success: true,
        message: '로그아웃되었습니다.'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: '로그아웃 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 목록 조회 (관리자만)
  public async getUsers(requesterRole: UserRole): Promise<{ success: boolean; users?: User[]; error?: string }> {
    if (requesterRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: '권한이 없습니다.'
      };
    }

    const users = Array.from(this.users.values()).map(({ passwordHash, ...user }) => user);
    return {
      success: true,
      users
    };
  }

  // 사용자 역할/플랜 업데이트 (관리자만)
  public async updateUserRole(userId: string, newRole: UserRole, newPlan: string, requesterRole: UserRole): Promise<{ success: boolean; message?: string; error?: string }> {
    if (requesterRole !== UserRole.ADMIN) {
      return {
        success: false,
        error: '권한이 없습니다.'
      };
    }

    const user = Array.from(this.users.values()).find(u => u.id === userId);
    if (!user) {
      return {
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      };
    }

    user.role = newRole;
    user.plan = newPlan as any;

    return {
      success: true,
      message: '사용자 권한이 업데이트되었습니다.'
    };
  }

  // 유틸리티 메서드들
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): boolean {
    // 최소 8자, 영문, 숫자, 특수문자 포함
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // 권한 확인 헬퍼
  public hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.GUEST]: 0,
      [UserRole.USER]: 1,
      [UserRole.PREMIUM]: 2,
      [UserRole.ADMIN]: 3
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // 통계 조회
  public getStats(): any {
    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.isActive).length,
      usersByRole: {
        admin: Array.from(this.users.values()).filter(u => u.role === UserRole.ADMIN).length,
        premium: Array.from(this.users.values()).filter(u => u.role === UserRole.PREMIUM).length,
        user: Array.from(this.users.values()).filter(u => u.role === UserRole.USER).length
      },
      usersByPlan: {
        enterprise: Array.from(this.users.values()).filter(u => u.plan === 'enterprise').length,
        premium: Array.from(this.users.values()).filter(u => u.plan === 'premium').length,
        basic: Array.from(this.users.values()).filter(u => u.plan === 'basic').length,
        free: Array.from(this.users.values()).filter(u => u.plan === 'free').length
      }
    };
  }
}

export const authService = new AuthService();