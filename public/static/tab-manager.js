// 탭 관리 JavaScript

class TabManager {
    constructor() {
        this.currentTab = 'generator';
        this.init();
    }

    init() {
        // URL 해시를 기반으로 초기 탭 설정
        const hash = window.location.hash.substring(1);
        if (hash && ['generator', 'history', 'templates', 'account'].includes(hash)) {
            this.currentTab = hash;
        }

        // 초기 탭 표시
        this.showTab(this.currentTab);

        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', (event) => {
            const hash = window.location.hash.substring(1);
            if (hash && ['generator', 'history', 'templates', 'account'].includes(hash)) {
                this.showTab(hash, false); // URL 업데이트 없이 탭만 변경
            }
        });

        // 키보드 단축키 (Ctrl+1, Ctrl+2, Ctrl+3)
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch(event.key) {
                    case '1':
                        event.preventDefault();
                        this.switchTab('generator');
                        break;
                    case '2':
                        event.preventDefault();
                        this.switchTab('history');
                        break;
                    case '3':
                        event.preventDefault();
                        this.switchTab('templates');
                        break;
                    case '4':
                        event.preventDefault();
                        this.switchTab('account');
                        break;
                }
            }
        });
    }

    switchTab(tabName, updateURL = true) {
        if (tabName === this.currentTab) return;

        // 인증이 필요한 탭 체크 (템플릿은 인증 없이도 조회 가능)
        if ((tabName === 'history' || tabName === 'account') && !isAuthenticated()) {
            showNotification('로그인이 필요한 기능입니다.', 'warning');
            showAuthModal();
            return;
        }

        this.showTab(tabName, updateURL);
    }

    showTab(tabName, updateURL = true) {
        // 모든 탭 버튼과 콘텐츠 숨기기
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // 선택된 탭 표시
        const selectedButton = document.getElementById(`${tabName}Tab`);
        const selectedContent = document.getElementById(`${tabName}Content`);

        if (selectedButton) {
            selectedButton.classList.add('active');
        }

        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }

        // 탭별 초기화 로직
        this.initializeTab(tabName);

        // 현재 탭 업데이트
        this.currentTab = tabName;

        // URL 업데이트
        if (updateURL) {
            window.history.pushState({ tab: tabName }, '', `#${tabName}`);
        }

        console.log(`Switched to ${tabName} tab`);
    }

    initializeTab(tabName) {
        switch(tabName) {
            case 'generator':
                // 콘텐츠 생성기 초기화 (이미 app.js에서 처리됨)
                break;
                
            case 'history':
                // 히스토리 매니저 초기화
                if (!window.historyManager) {
                    window.historyManager = new HistoryManager();
                }
                break;
                
            case 'templates':
                // 템플릿 매니저 초기화
                if (!window.templateManager) {
                    window.templateManager = new TemplateManager();
                }
                break;
                
            case 'account':
                // 계정 관리 UI 초기화
                this.initializeAccountTab();
                break;
        }
    }

    initializeAccountTab() {
        const accountContainer = document.getElementById('accountContainer');
        if (!accountContainer) return;

        // 인증되지 않은 경우
        if (!isAuthenticated()) {
            accountContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-sign-in-alt text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">로그인이 필요합니다</h3>
                    <p class="text-gray-600 mb-6">계정 관리를 위해 로그인해주세요.</p>
                    <button onclick="showAuthModal()" class="btn-primary">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        로그인
                    </button>
                </div>
            `;
            return;
        }

        // 사용자 정보 표시
        const user = getCurrentUser();
        if (!user) return;

        accountContainer.innerHTML = `
            <div class="account-manager">
                <h2 class="text-3xl font-bold text-gray-800 mb-6">
                    <i class="fas fa-user mr-3 text-blue-600"></i>
                    계정 관리
                </h2>

                <!-- 사용자 정보 카드 -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-id-card mr-2"></i>
                        프로필 정보
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-1">사용자 ID</label>
                            <p class="text-gray-900 font-mono text-sm">${user.sub}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-1">이메일</label>
                            <p class="text-gray-900">${user.email}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-1">사용자명</label>
                            <p class="text-gray-900">${user.name || '설정되지 않음'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-1">역할</label>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getRoleClass(user.role)}">
                                ${this.getRoleLabel(user.role)}
                            </span>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-1">플랜</label>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPlanClass(user.plan)}">
                                ${this.getPlanLabel(user.plan)}
                            </span>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-1">가입일</label>
                            <p class="text-gray-900">${this.formatDate(user.iat * 1000)}</p>
                        </div>
                    </div>
                </div>

                <!-- 사용량 정보 -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-chart-line mr-2"></i>
                        사용량 현황
                    </h3>
                    <div id="usageInfo">
                        <div class="text-center py-4">
                            <i class="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                            <p class="text-gray-600 mt-2">사용량 정보를 불러오는 중...</p>
                        </div>
                    </div>
                </div>

                <!-- 계정 작업 -->
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-cog mr-2"></i>
                        계정 작업
                    </h3>
                    <div class="space-y-3">
                        <button onclick="refreshToken()" class="btn-secondary w-full md:w-auto">
                            <i class="fas fa-sync-alt mr-2"></i>
                            토큰 새로고침
                        </button>
                        <button onclick="exportAccountData()" class="btn-secondary w-full md:w-auto">
                            <i class="fas fa-download mr-2"></i>
                            데이터 내보내기
                        </button>
                        <button onclick="logout()" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors w-full md:w-auto">
                            <i class="fas fa-sign-out-alt mr-2"></i>
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 사용량 정보 로드
        this.loadUsageInfo();
    }

    async loadUsageInfo() {
        try {
            const response = await authenticatedFetch('/api/usage');
            
            if (!response.ok) {
                throw new Error('사용량 정보 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.renderUsageInfo(result.data);
            } else {
                throw new Error(result.error || '사용량 정보 로드 실패');
            }
        } catch (error) {
            console.error('Usage load error:', error);
            document.getElementById('usageInfo').innerHTML = `
                <div class="text-center py-4 text-red-600">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>사용량 정보를 불러올 수 없습니다.</p>
                </div>
            `;
        }
    }

    renderUsageInfo(usageData) {
        const container = document.getElementById('usageInfo');
        if (!container) return;

        if (usageData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-chart-bar text-4xl mb-2"></i>
                    <p>사용 내역이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${usageData.map(usage => `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-800 mb-2">${this.getFeatureLabel(usage.feature)}</h4>
                        <div class="flex items-center justify-between">
                            <span class="text-2xl font-bold text-blue-600">${usage.usageCount}</span>
                            <span class="text-sm text-gray-600">
                                ${usage.quotaLimit > 0 ? `/ ${usage.quotaLimit}` : ''}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${this.formatDate(usage.resetDate)} 기준
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getRoleClass(role) {
        const classes = {
            admin: 'bg-red-100 text-red-800',
            premium: 'bg-purple-100 text-purple-800',
            user: 'bg-green-100 text-green-800'
        };
        return classes[role] || 'bg-gray-100 text-gray-800';
    }

    getRoleLabel(role) {
        const labels = {
            admin: '관리자',
            premium: '프리미엄',
            user: '일반 사용자'
        };
        return labels[role] || role;
    }

    getPlanClass(plan) {
        const classes = {
            premium: 'bg-yellow-100 text-yellow-800',
            basic: 'bg-blue-100 text-blue-800',
            free: 'bg-gray-100 text-gray-800'
        };
        return classes[plan] || 'bg-gray-100 text-gray-800';
    }

    getPlanLabel(plan) {
        const labels = {
            premium: '프리미엄',
            basic: '베이직',
            free: '무료'
        };
        return labels[plan] || plan;
    }

    getFeatureLabel(feature) {
        const labels = {
            'content-generation': '통합 콘텐츠 생성',
            'blog-generation': '블로그 생성',
            'image-generation': '이미지 생성',
            'video-generation': '비디오 생성',
            'podcast-generation': '팟캐스트 생성'
        };
        return labels[feature] || feature;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCurrentTab() {
        return this.currentTab;
    }
}

// 전역 함수들
function switchTab(tabName) {
    if (window.tabManager) {
        window.tabManager.switchTab(tabName);
    }
}

function exportAccountData() {
    // 계정 데이터 내보내기 구현
    showNotification('계정 데이터 내보내기 기능은 개발 중입니다.', 'info');
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.tabManager = new TabManager();
    
    console.log('🎯 Tab Manager initialized');
});