// 인증 시스템 JavaScript
// JWT 토큰 관리, 로그인/회원가입 UI, 세션 관리

class AuthManager {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.setupAuthUI();
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    // 토큰 저장
    setTokens(accessToken, refreshToken, user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        this.updateUI();
    }

    // 토큰 제거
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        this.updateUI();
    }

    // 인증 상태 확인
    isAuthenticated() {
        return !!this.accessToken && !!this.user;
    }

    // 인증된 API 요청을 위한 헤더
    getAuthHeaders() {
        return this.accessToken ? {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    // 인증 상태 체크
    async checkAuthStatus() {
        if (!this.accessToken) return false;

        try {
            const response = await axios.get('/api/auth/me', {
                headers: this.getAuthHeaders()
            });

            if (response.data.success) {
                this.user = response.data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.updateUI();
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            if (error.response?.status === 401) {
                // 토큰 만료, 리프레시 시도
                return await this.refreshAccessToken();
            }
            this.clearTokens();
            return false;
        }
    }

    // 토큰 갱신
    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await axios.post('/api/auth/refresh', {
                refreshToken: this.refreshToken
            });

            if (response.data.success) {
                this.accessToken = response.data.accessToken;
                localStorage.setItem('accessToken', this.accessToken);
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            return false;
        }
    }

    // 회원가입
    async signup(formData) {
        try {
            this.showLoading('회원가입 중...');
            
            const response = await axios.post('/api/auth/signup', formData);

            if (response.data.success) {
                this.setTokens(
                    response.data.accessToken, 
                    response.data.refreshToken, 
                    response.data.user
                );
                
                this.hideAuthModal();
                this.showAlert('회원가입이 완료되었습니다!', 'success');
                return true;
            } else {
                this.showAlert(response.data.error || '회원가입에 실패했습니다.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Signup error:', error);
            
            if (error.response?.status === 429) {
                this.showAlert('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 'warning');
            } else {
                this.showAlert(
                    error.response?.data?.error || '회원가입 중 오류가 발생했습니다.', 
                    'error'
                );
            }
            return false;
        } finally {
            this.hideLoading();
        }
    }

    // 로그인
    async login(email, password) {
        try {
            this.showLoading('로그인 중...');
            
            const response = await axios.post('/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                this.setTokens(
                    response.data.accessToken, 
                    response.data.refreshToken, 
                    response.data.user
                );
                
                this.hideAuthModal();
                this.showAlert(`${response.data.user.name}님, 환영합니다!`, 'success');
                return true;
            } else {
                this.showAlert(response.data.error || '로그인에 실패했습니다.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response?.status === 429) {
                this.showAlert('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.', 'warning');
            } else {
                this.showAlert(
                    error.response?.data?.error || '로그인 중 오류가 발생했습니다.', 
                    'error'
                );
            }
            return false;
        } finally {
            this.hideLoading();
        }
    }

    // 로그아웃
    async logout() {
        try {
            if (this.refreshToken) {
                await axios.post('/api/auth/logout', {
                    refreshToken: this.refreshToken
                }, {
                    headers: this.getAuthHeaders()
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
            this.showAlert('로그아웃되었습니다.', 'info');
        }
    }

    // 인증된 API 요청
    async authenticatedRequest(url, options = {}) {
        const headers = {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
        };

        try {
            const response = await axios({
                url,
                ...options,
                headers
            });
            
            return response;
        } catch (error) {
            if (error.response?.status === 401) {
                // 토큰 만료, 갱신 시도
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // 갱신 성공, 요청 재시도
                    const newHeaders = {
                        ...this.getAuthHeaders(),
                        ...(options.headers || {})
                    };
                    
                    return await axios({
                        url,
                        ...options,
                        headers: newHeaders
                    });
                } else {
                    // 갱신 실패, 로그인 필요
                    this.showLoginModal();
                    throw new Error('인증이 필요합니다.');
                }
            }
            
            throw error;
        }
    }

    // UI 관련 메서드들
    setupAuthUI() {
        // 인증 모달 HTML 생성
        const authModalHTML = `
            <div id="authModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 id="authModalTitle" class="text-2xl font-bold text-gray-800">로그인</h2>
                            <button onclick="authManager.hideAuthModal()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <!-- 로그인 폼 -->
                        <form id="loginForm" class="space-y-4">
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                <input type="email" id="loginEmail" name="email" required
                                    data-validate="email"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                            </div>
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                                <input type="password" id="loginPassword" name="password" required
                                    data-validate="string"
                                    minlength="1"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                            </div>
                            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <i class="fas fa-sign-in-alt mr-2"></i>로그인
                            </button>
                        </form>

                        <!-- 회원가입 폼 -->
                        <form id="signupForm" class="space-y-4 hidden">
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                <input type="text" id="signupName" name="name" required
                                    data-validate="string"
                                    minlength="2" maxlength="100"
                                    pattern="^[가-힣a-zA-Z\s]+$"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="홍길동 또는 John Doe">
                            </div>
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                <input type="email" id="signupEmail" name="email" required
                                    data-validate="email"
                                    maxlength="255"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="example@company.com">
                            </div>
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                                <input type="password" id="signupPassword" name="password" required
                                    data-validate="password"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="8자 이상, 영문, 숫자, 특수문자 포함">
                            </div>
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">회사명 (선택)</label>
                                <input type="text" id="signupCompany" name="company"
                                    data-validate="string"
                                    maxlength="200"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="회사명을 입력하세요">
                            </div>
                            <div class="input-container">
                                <label class="block text-sm font-medium text-gray-700 mb-1">업종 (선택)</label>
                                <select id="signupIndustry" name="industry"
                                    data-validate="string"
                                    maxlength="100"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                    <option value="">선택해주세요</option>
                                    <option value="consulting">컨설팅</option>
                                    <option value="finance">금융</option>
                                    <option value="insurance">보험</option>
                                    <option value="technology">기술/IT</option>
                                    <option value="marketing">마케팅</option>
                                    <option value="retail">리테일</option>
                                    <option value="healthcare">헬스케어</option>
                                    <option value="education">교육</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>
                            <button type="submit" class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <i class="fas fa-user-plus mr-2"></i>회원가입
                            </button>
                        </form>

                        <!-- 폼 전환 버튼 -->
                        <div class="mt-4 text-center">
                            <button id="toggleAuthForm" onclick="authManager.toggleAuthForm()" class="text-blue-600 hover:text-blue-800">
                                계정이 없으신가요? 회원가입
                            </button>
                        </div>

                        <!-- 테스트 계정 안내 -->
                        <div class="mt-4 p-3 bg-gray-50 rounded-md">
                            <p class="text-sm text-gray-600 font-medium mb-2">테스트 계정:</p>
                            <div class="text-xs text-gray-500 space-y-1">
                                <div>• 관리자: admin@infrastructure-research.com / admin123!</div>
                                <div>• 프리미엄: premium@example.com / premium123!</div>
                                <div>• 일반: user@example.com / user123!</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 로딩 오버레이 -->
            <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-30 hidden z-60">
                <div class="flex items-center justify-center min-h-screen">
                    <div class="bg-white rounded-lg p-6 shadow-lg">
                        <div class="flex items-center space-x-3">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span id="loadingMessage" class="text-gray-700">처리 중...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', authModalHTML);
    }

    setupEventListeners() {
        // 로그인 폼 이벤트
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(email, password);
        });

        // 회원가입 폼 이벤트
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('signupName').value,
                email: document.getElementById('signupEmail').value,
                password: document.getElementById('signupPassword').value,
                company: document.getElementById('signupCompany').value,
                industry: document.getElementById('signupIndustry').value
            };
            await this.signup(formData);
        });
    }

    updateUI() {
        // 네비게이션 바 업데이트
        const navElement = document.querySelector('nav .max-w-6xl');
        if (!navElement) return;

        const authButtonsHTML = this.isAuthenticated() 
            ? `
                <div class="flex items-center space-x-4 text-sm">
                    <div class="flex items-center space-x-2">
                        <span class="text-blue-100">
                            <i class="fas fa-user mr-1"></i>
                            ${this.user.name}
                        </span>
                        <span class="px-2 py-1 text-xs rounded-full ${this.getPlanBadgeClass()}">${this.getPlanLabel()}</span>
                    </div>
                    <button onclick="authManager.logout()" class="text-blue-100 hover:text-white">
                        <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                    </button>
                </div>
            `
            : `
                <div class="flex items-center space-x-2 text-sm">
                    <button onclick="authManager.showLoginModal()" class="text-blue-100 hover:text-white">
                        <i class="fas fa-sign-in-alt mr-1"></i>로그인
                    </button>
                    <button onclick="authManager.showSignupModal()" class="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50">
                        <i class="fas fa-user-plus mr-1"></i>회원가입
                    </button>
                </div>
            `;

        // 기존 인증 버튼 제거 후 새로 추가
        const existingAuth = navElement.querySelector('.auth-buttons');
        if (existingAuth) {
            existingAuth.remove();
        }

        const authDiv = document.createElement('div');
        authDiv.className = 'auth-buttons';
        authDiv.innerHTML = authButtonsHTML;
        navElement.appendChild(authDiv);
    }

    getPlanBadgeClass() {
        const classes = {
            free: 'bg-gray-500 text-white',
            basic: 'bg-blue-500 text-white',
            premium: 'bg-purple-500 text-white',
            enterprise: 'bg-gold-500 text-white'
        };
        return classes[this.user?.plan] || classes.free;
    }

    getPlanLabel() {
        const labels = {
            free: 'FREE',
            basic: 'BASIC',
            premium: 'PREMIUM',
            enterprise: 'ENTERPRISE'
        };
        return labels[this.user?.plan] || 'FREE';
    }

    // 모달 관련 메서드들
    showLoginModal() {
        this.resetAuthModal();
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('authModalTitle').textContent = '로그인';
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('toggleAuthForm').textContent = '계정이 없으신가요? 회원가입';
    }

    showSignupModal() {
        this.resetAuthModal();
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('authModalTitle').textContent = '회원가입';
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
        document.getElementById('toggleAuthForm').textContent = '이미 계정이 있으신가요? 로그인';
    }

    hideAuthModal() {
        document.getElementById('authModal').classList.add('hidden');
        this.resetAuthModal();
    }

    toggleAuthForm() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const title = document.getElementById('authModalTitle');
        const toggle = document.getElementById('toggleAuthForm');

        if (loginForm.classList.contains('hidden')) {
            // 회원가입 → 로그인
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            title.textContent = '로그인';
            toggle.textContent = '계정이 없으신가요? 회원가입';
        } else {
            // 로그인 → 회원가입
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            title.textContent = '회원가입';
            toggle.textContent = '이미 계정이 있으신가요? 로그인';
        }
    }

    resetAuthModal() {
        // 폼 초기화
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
    }

    showLoading(message = '처리 중...') {
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showAlert(message, type = 'info') {
        // 기존 알림 제거
        const existingAlert = document.querySelector('.auth-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 새 알림 생성
        const alert = document.createElement('div');
        alert.className = `auth-alert fixed top-4 right-4 px-4 py-3 rounded-md shadow-lg z-50 ${this.getAlertClass(type)}`;
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${this.getAlertIcon(type)} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-lg">&times;</button>
            </div>
        `;

        document.body.appendChild(alert);

        // 5초 후 자동 제거
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    getAlertClass(type) {
        const classes = {
            success: 'bg-green-100 border border-green-400 text-green-700',
            error: 'bg-red-100 border border-red-400 text-red-700',
            warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border border-blue-400 text-blue-700'
        };
        return classes[type] || classes.info;
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }
}

// 전역 AuthManager 인스턴스 생성
const authManager = new AuthManager();

// 인증된 fetch 래퍼 함수
async function authenticatedFetch(url, options = {}) {
    // 기본 옵션 설정
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // 인증 헤더 추가
    if (authManager.isAuthenticated()) {
        defaultOptions.headers.Authorization = `Bearer ${authManager.accessToken}`;
    }

    // 옵션 병합
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, mergedOptions);
        
        // 401 에러 시 토큰 갱신 시도
        if (response.status === 401 && authManager.refreshToken) {
            const refreshResult = await authManager.refreshAccessToken();
            if (refreshResult.success) {
                // 토큰 갱신 후 재요청
                mergedOptions.headers.Authorization = `Bearer ${authManager.accessToken}`;
                const retryResponse = await fetch(url, mergedOptions);
                return retryResponse;
            } else {
                // 토큰 갱신 실패 시 로그아웃
                authManager.logout();
                throw new Error('Authentication failed');
            }
        }

        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
}

// 전역 함수로 내보내기
window.authenticatedFetch = authenticatedFetch;