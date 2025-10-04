// 콘텐츠 템플릿 관리 JavaScript

class TemplateManager {
    constructor() {
        this.currentTemplates = [];
        this.categories = [];
        this.selectedTemplate = null;
        this.filters = {
            categoryId: '',
            type: '',
            searchTerm: '',
            sortBy: 'updated',
            sortOrder: 'desc'
        };
        this.init();
    }

    init() {
        this.renderTemplateUI();
        this.setupEventListeners();
        this.loadCategories();
        this.loadTemplates();
    }

    renderTemplateUI() {
        const templateContainer = document.getElementById('templateContainer');
        if (!templateContainer) return;

        templateContainer.innerHTML = `
            <div class="template-manager">
                <!-- 헤더 -->
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-layer-group mr-3 text-purple-600"></i>
                        콘텐츠 템플릿
                    </h2>
                    <div class="flex space-x-2">
                        <button id="createTemplateBtn" class="btn-primary">
                            <i class="fas fa-plus mr-2"></i>
                            새 템플릿
                        </button>
                        <button id="myTemplatesBtn" class="btn-secondary">
                            <i class="fas fa-user mr-2"></i>
                            내 템플릿
                        </button>
                        <button id="favoritesBtn" class="btn-secondary">
                            <i class="fas fa-heart mr-2"></i>
                            즐겨찾기
                        </button>
                    </div>
                </div>

                <!-- 템플릿 통계 -->
                <div class="template-stats mb-8" id="templateStats">
                    <!-- 통계가 동적으로 삽입됩니다 -->
                </div>

                <!-- 카테고리 및 필터 -->
                <div class="template-filters mb-6">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-filter mr-2"></i>
                            템플릿 탐색
                        </h3>
                        
                        <!-- 카테고리 탭 -->
                        <div class="category-tabs mb-4" id="categoryTabs">
                            <!-- 카테고리 탭들이 동적으로 삽입됩니다 -->
                        </div>
                        
                        <!-- 필터 옵션 -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <input 
                                    type="text" 
                                    id="templateSearch" 
                                    placeholder="템플릿 검색..." 
                                    class="form-input w-full"
                                >
                            </div>
                            <div>
                                <select id="sortBy" class="form-select w-full">
                                    <option value="updated">최근 업데이트</option>
                                    <option value="created">최근 생성</option>
                                    <option value="usage">인기순</option>
                                    <option value="rating">평점순</option>
                                    <option value="name">이름순</option>
                                </select>
                            </div>
                            <div>
                                <select id="sortOrder" class="form-select w-full">
                                    <option value="desc">내림차순</option>
                                    <option value="asc">오름차순</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 템플릿 그리드 -->
                <div class="template-grid" id="templateGrid">
                    <!-- 템플릿 카드들이 동적으로 삽입됩니다 -->
                </div>

                <!-- 로딩 상태 -->
                <div id="templateLoading" class="text-center py-8 hidden">
                    <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">템플릿을 불러오는 중...</p>
                </div>

                <!-- 빈 상태 -->
                <div id="templateEmpty" class="text-center py-12 hidden">
                    <i class="fas fa-layer-group text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">템플릿이 없습니다</h3>
                    <p class="text-gray-500 mb-6">새로운 템플릿을 만들어보세요.</p>
                    <button onclick="templateManager.showCreateModal()" class="btn-primary">
                        <i class="fas fa-plus mr-2"></i>
                        첫 번째 템플릿 만들기
                    </button>
                </div>
            </div>

            <!-- 템플릿 상세 모달 -->
            <div id="templateDetailModal" class="modal hidden">
                <div class="modal-overlay">
                    <div class="modal-content max-w-4xl">
                        <div class="modal-header">
                            <h3 class="text-xl font-semibold">템플릿 상세</h3>
                            <button id="closeTemplateDetailModal" class="modal-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="templateDetailContent">
                            <!-- 상세 내용이 동적으로 삽입됩니다 -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 템플릿 선택 모달 (콘텐츠 생성용) -->
            <div id="templateSelectModal" class="modal hidden">
                <div class="modal-overlay">
                    <div class="modal-content max-w-6xl">
                        <div class="modal-header">
                            <h3 class="text-xl font-semibold">
                                <i class="fas fa-layer-group mr-2"></i>
                                템플릿 선택
                            </h3>
                            <button id="closeTemplateSelectModal" class="modal-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="templateSelectContent">
                            <!-- 템플릿 선택 UI가 동적으로 삽입됩니다 -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // 새 템플릿 생성
        document.getElementById('createTemplateBtn')?.addEventListener('click', () => {
            this.showCreateModal();
        });

        // 내 템플릿 보기
        document.getElementById('myTemplatesBtn')?.addEventListener('click', () => {
            this.showMyTemplates();
        });

        // 즐겨찾기 보기
        document.getElementById('favoritesBtn')?.addEventListener('click', () => {
            this.showFavorites();
        });

        // 검색
        document.getElementById('templateSearch')?.addEventListener('input', (e) => {
            this.filters.searchTerm = e.target.value;
            this.debounce(() => this.loadTemplates(), 300)();
        });

        // 정렬 변경
        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.loadTemplates();
        });

        document.getElementById('sortOrder')?.addEventListener('change', (e) => {
            this.filters.sortOrder = e.target.value;
            this.loadTemplates();
        });

        // 모달 닫기
        document.getElementById('closeTemplateDetailModal')?.addEventListener('click', () => {
            this.hideDetailModal();
        });

        document.getElementById('closeTemplateSelectModal')?.addEventListener('click', () => {
            this.hideSelectModal();
        });
    }

    async loadCategories() {
        try {
            const response = await authenticatedFetch('/api/templates/categories');
            
            if (!response.ok) {
                throw new Error('카테고리 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.categories = result.data;
                this.renderCategoryTabs();
            } else {
                throw new Error(result.error || '카테고리 로드 실패');
            }
        } catch (error) {
            console.error('Categories load error:', error);
            showNotification('카테고리 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    renderCategoryTabs() {
        const container = document.getElementById('categoryTabs');
        if (!container || !this.categories.length) return;

        const industryCategories = this.categories.filter(cat => cat.type === 'industry');
        const purposeCategories = this.categories.filter(cat => cat.type === 'purpose');

        container.innerHTML = `
            <div class="space-y-4">
                <!-- 업계별 카테고리 -->
                <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">업계별</h4>
                    <div class="flex flex-wrap gap-2">
                        <button 
                            onclick="templateManager.filterByCategory('')" 
                            class="category-tab ${!this.filters.categoryId ? 'active' : ''}"
                        >
                            전체
                        </button>
                        ${industryCategories.map(cat => `
                            <button 
                                onclick="templateManager.filterByCategory('${cat.id}')" 
                                class="category-tab ${this.filters.categoryId === cat.id ? 'active' : ''}"
                                style="--category-color: ${this.getCategoryColor(cat.color)}"
                            >
                                <i class="${cat.icon} mr-1"></i>
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 목적별 카테고리 -->
                <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">목적별</h4>
                    <div class="flex flex-wrap gap-2">
                        ${purposeCategories.map(cat => `
                            <button 
                                onclick="templateManager.filterByCategory('${cat.id}')" 
                                class="category-tab ${this.filters.categoryId === cat.id ? 'active' : ''}"
                                style="--category-color: ${this.getCategoryColor(cat.color)}"
                            >
                                <i class="${cat.icon} mr-1"></i>
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryColor(colorName) {
        const colors = {
            blue: '#3b82f6',
            pink: '#ec4899',
            green: '#10b981',
            indigo: '#6366f1',
            orange: '#f59e0b',
            purple: '#8b5cf6',
            red: '#ef4444',
            yellow: '#eab308',
            teal: '#14b8a6',
            cyan: '#06b6d4',
            amber: '#f59e0b'
        };
        return colors[colorName] || colors.blue;
    }

    async loadTemplates() {
        try {
            this.showLoading();

            const params = new URLSearchParams({
                ...this.filters
            });

            // 빈 값 제거
            for (const [key, value] of params.entries()) {
                if (!value) {
                    params.delete(key);
                }
            }

            const response = await authenticatedFetch(`/api/templates?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('템플릿 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.currentTemplates = result.data.templates;
                this.renderTemplateGrid();
                this.loadStats();
            } else {
                throw new Error(result.error || '템플릿 로드 실패');
            }
        } catch (error) {
            console.error('Templates load error:', error);
            showNotification('템플릿 로드 중 오류가 발생했습니다.', 'error');
            this.showEmpty();
        } finally {
            this.hideLoading();
        }
    }

    async loadStats() {
        try {
            if (!isAuthenticated()) return;

            const response = await authenticatedFetch('/api/templates/stats');
            
            if (!response.ok) return; // 통계는 선택사항

            const result = await response.json();
            
            if (result.success) {
                this.renderStats(result.data);
            }
        } catch (error) {
            console.error('Template stats load error:', error);
            // 통계 로드 실패는 무시
        }
    }

    renderStats(stats) {
        const container = document.getElementById('templateStats');
        if (!container || !isAuthenticated()) return;

        container.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar mr-2"></i>
                    나의 템플릿 현황
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="stats-card">
                        <div class="stats-icon bg-purple-100 text-purple-600">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.totalTemplates}</div>
                            <div class="stats-label">전체 템플릿</div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-icon bg-blue-100 text-blue-600">
                            <i class="fas fa-user-edit"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.userTemplates}</div>
                            <div class="stats-label">내가 만든 템플릿</div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-icon bg-red-100 text-red-600">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.favoriteTemplates}</div>
                            <div class="stats-label">즐겨찾기</div>
                        </div>
                    </div>
                    
                    <div class="stats-card">
                        <div class="stats-icon bg-yellow-100 text-yellow-600">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stats-content">
                            <div class="stats-number">${stats.usageThisMonth}</div>
                            <div class="stats-label">이번 달 사용</div>
                        </div>
                    </div>
                </div>

                ${stats.mostUsedTemplate ? `
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600">
                            <i class="fas fa-trophy text-yellow-500 mr-1"></i>
                            가장 많이 사용한 템플릿: <strong>${stats.mostUsedTemplate.name}</strong> (${stats.mostUsedTemplate.usageCount}회)
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderTemplateGrid() {
        const container = document.getElementById('templateGrid');
        if (!container) return;

        if (this.currentTemplates.length === 0) {
            this.showEmpty();
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.currentTemplates.map(template => this.renderTemplateCard(template)).join('')}
            </div>
        `;
    }

    renderTemplateCard(template) {
        const categoryColor = template.category ? this.getCategoryColor(template.category.color) : '#6b7280';
        
        return `
            <div class="template-card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div class="p-6">
                    <!-- 헤더 -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h4 class="text-lg font-semibold text-gray-800 mb-1">${template.name}</h4>
                            ${template.description ? `
                                <p class="text-sm text-gray-600 line-clamp-2">${template.description}</p>
                            ` : ''}
                        </div>
                        <div class="flex space-x-1 ml-3">
                            <button 
                                onclick="templateManager.toggleFavorite('${template.id}')"
                                class="text-gray-400 hover:text-red-500 transition-colors"
                                title="즐겨찾기"
                            >
                                <i class="fas fa-heart"></i>
                            </button>
                            <button 
                                onclick="templateManager.viewTemplate('${template.id}')"
                                class="text-gray-400 hover:text-blue-500 transition-colors"
                                title="상세보기"
                            >
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 카테고리 -->
                    ${template.category ? `
                        <div class="mb-3">
                            <span 
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                style="background-color: ${categoryColor}"
                            >
                                <i class="${template.category.icon} mr-1"></i>
                                ${template.category.name}
                            </span>
                        </div>
                    ` : ''}

                    <!-- 메타 정보 -->
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div class="flex items-center space-x-3">
                            <span title="사용 횟수">
                                <i class="fas fa-chart-line mr-1"></i>
                                ${template.usageCount}
                            </span>
                            ${template.rating > 0 ? `
                                <span title="평점">
                                    <i class="fas fa-star text-yellow-500 mr-1"></i>
                                    ${template.rating.toFixed(1)}
                                </span>
                            ` : ''}
                            ${template.isSystem ? `
                                <span class="text-blue-600" title="시스템 템플릿">
                                    <i class="fas fa-certificate mr-1"></i>
                                    공식
                                </span>
                            ` : ''}
                        </div>
                    </div>

                    <!-- 템플릿 구성 표시 -->
                    <div class="flex flex-wrap gap-1 mb-4">
                        ${template.blogTemplate ? '<span class="template-type-badge blog">블로그</span>' : ''}
                        ${template.imageTemplate ? '<span class="template-type-badge image">이미지</span>' : ''}
                        ${template.videoTemplate ? '<span class="template-type-badge video">비디오</span>' : ''}
                        ${template.podcastTemplate ? '<span class="template-type-badge podcast">팟캐스트</span>' : ''}
                    </div>

                    <!-- 액션 버튼 -->
                    <div class="flex space-x-2">
                        <button 
                            onclick="templateManager.useTemplate('${template.id}')"
                            class="btn-primary-sm flex-1"
                        >
                            <i class="fas fa-magic mr-2"></i>
                            사용하기
                        </button>
                        <button 
                            onclick="templateManager.viewTemplate('${template.id}')"
                            class="btn-secondary-sm"
                        >
                            <i class="fas fa-eye mr-2"></i>
                            상세보기
                        </button>
                    </div>
                </div>

                <!-- 생성자 정보 (사용자 템플릿인 경우) -->
                ${template.creator && !template.isSystem ? `
                    <div class="px-6 py-3 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
                        <i class="fas fa-user mr-1"></i>
                        ${template.creator.name}
                    </div>
                ` : ''}
            </div>
        `;
    }

    filterByCategory(categoryId) {
        this.filters.categoryId = categoryId;
        this.loadTemplates();
        this.renderCategoryTabs(); // 활성 상태 업데이트
    }

    showMyTemplates() {
        if (!isAuthenticated()) {
            showNotification('로그인이 필요한 기능입니다.', 'warning');
            showAuthModal();
            return;
        }

        const user = getCurrentUser();
        this.filters.creatorId = user.sub;
        this.loadTemplates();
        showNotification('내가 만든 템플릿을 표시합니다.', 'info');
    }

    async showFavorites() {
        if (!isAuthenticated()) {
            showNotification('로그인이 필요한 기능입니다.', 'warning');
            showAuthModal();
            return;
        }

        try {
            const response = await authenticatedFetch('/api/templates/favorites');
            
            if (!response.ok) {
                throw new Error('즐겨찾기 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.currentTemplates = result.data;
                this.renderTemplateGrid();
                showNotification('즐겨찾기 템플릿을 표시합니다.', 'info');
            } else {
                throw new Error(result.error || '즐겨찾기 로드 실패');
            }
        } catch (error) {
            console.error('Favorites load error:', error);
            showNotification('즐겨찾기 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    async viewTemplate(templateId) {
        try {
            const response = await authenticatedFetch(`/api/templates/${templateId}`);
            
            if (!response.ok) {
                throw new Error('템플릿 상세 정보 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.showDetailModal(result.data);
            } else {
                throw new Error(result.error || '템플릿 상세 정보 로드 실패');
            }
        } catch (error) {
            console.error('Template detail load error:', error);
            showNotification('템플릿 상세 정보 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    showDetailModal(template) {
        const modal = document.getElementById('templateDetailModal');
        const content = document.getElementById('templateDetailContent');
        
        if (!modal || !content) return;

        content.innerHTML = this.renderTemplateDetail(template);
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    renderTemplateDetail(template) {
        return `
            <div class="space-y-6">
                <!-- 기본 정보 -->
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-3">${template.name}</h4>
                    ${template.description ? `<p class="text-gray-700 mb-3">${template.description}</p>` : ''}
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label class="font-medium text-gray-600">카테고리</label>
                            <p class="text-gray-900">${template.category?.name || '없음'}</p>
                        </div>
                        <div>
                            <label class="font-medium text-gray-600">사용 횟수</label>
                            <p class="text-gray-900">${template.usageCount}회</p>
                        </div>
                        <div>
                            <label class="font-medium text-gray-600">평점</label>
                            <p class="text-gray-900">${template.rating > 0 ? template.rating.toFixed(1) + '/5.0' : '평가 없음'}</p>
                        </div>
                        <div>
                            <label class="font-medium text-gray-600">생성일</label>
                            <p class="text-gray-900">${this.formatDate(template.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <!-- 템플릿 구성 -->
                <div>
                    <h4 class="font-semibold text-gray-800 mb-3">템플릿 구성</h4>
                    <div class="space-y-4">
                        ${template.blogTemplate ? this.renderTemplateSection('블로그', 'fas fa-blog', template.blogTemplate) : ''}
                        ${template.imageTemplate ? this.renderTemplateSection('이미지', 'fas fa-image', template.imageTemplate) : ''}
                        ${template.videoTemplate ? this.renderTemplateSection('비디오', 'fas fa-video', template.videoTemplate) : ''}
                        ${template.podcastTemplate ? this.renderTemplateSection('팟캐스트', 'fas fa-podcast', template.podcastTemplate) : ''}
                    </div>
                </div>

                <!-- 태그 -->
                ${template.tags && template.tags.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-3">태그</h4>
                        <div class="flex flex-wrap gap-2">
                            ${template.tags.map(tag => `
                                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- 액션 버튼 -->
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button onclick="templateManager.hideDetailModal()" class="btn-secondary">
                        닫기
                    </button>
                    <button onclick="templateManager.useTemplate('${template.id}')" class="btn-primary">
                        <i class="fas fa-magic mr-2"></i>
                        이 템플릿 사용하기
                    </button>
                </div>
            </div>
        `;
    }

    renderTemplateSection(title, icon, templateData) {
        return `
            <div class="border rounded-lg p-4">
                <h5 class="font-medium text-gray-800 mb-2">
                    <i class="${icon} mr-2"></i>
                    ${title} 템플릿
                </h5>
                <div class="text-sm text-gray-600 space-y-1">
                    ${templateData.titleFormat ? `<div><strong>제목 형식:</strong> ${templateData.titleFormat}</div>` : ''}
                    ${templateData.style ? `<div><strong>스타일:</strong> ${templateData.style}</div>` : ''}
                    ${templateData.styleGuide?.tone ? `<div><strong>톤앤매너:</strong> ${templateData.styleGuide.tone}</div>` : ''}
                    ${templateData.duration ? `<div><strong>길이:</strong> ${templateData.duration}초</div>` : ''}
                </div>
            </div>
        `;
    }

    useTemplate(templateId) {
        this.selectedTemplate = templateId;
        
        // 콘텐츠 생성 탭으로 이동하고 템플릿 선택
        if (window.tabManager) {
            window.tabManager.switchTab('generator');
        }
        
        // 콘텐츠 생성기에 템플릿 ID 전달
        if (window.contentGenerator) {
            window.contentGenerator.setSelectedTemplate(templateId);
            showNotification('템플릿이 선택되었습니다. 제품 설명을 입력하여 생성을 시작하세요.', 'success');
        }
        
        this.hideDetailModal();
    }

    async toggleFavorite(templateId) {
        if (!isAuthenticated()) {
            showNotification('로그인이 필요한 기능입니다.', 'warning');
            showAuthModal();
            return;
        }

        try {
            // 현재 즐겨찾기 상태 확인 (구현 필요)
            const isFavorite = false; // TODO: 실제 상태 확인
            
            const method = isFavorite ? 'DELETE' : 'POST';
            const response = await authenticatedFetch(`/api/templates/${templateId}/favorite`, {
                method: method
            });

            if (!response.ok) {
                throw new Error('즐겨찾기 변경 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                const message = isFavorite ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.';
                showNotification(message, 'success');
                this.loadStats(); // 통계 업데이트
            } else {
                throw new Error(result.error || '즐겨찾기 변경 실패');
            }
        } catch (error) {
            console.error('Favorite toggle error:', error);
            showNotification('즐겨찾기 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    showCreateModal() {
        showNotification('템플릿 생성 기능은 개발 중입니다.', 'info');
    }

    showLoading() {
        document.getElementById('templateGrid')?.classList.add('hidden');
        document.getElementById('templateEmpty')?.classList.add('hidden');
        document.getElementById('templateLoading')?.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('templateLoading')?.classList.add('hidden');
        document.getElementById('templateGrid')?.classList.remove('hidden');
    }

    showEmpty() {
        document.getElementById('templateGrid')?.classList.add('hidden');
        document.getElementById('templateLoading')?.classList.add('hidden');
        document.getElementById('templateEmpty')?.classList.remove('hidden');
    }

    hideDetailModal() {
        const modal = document.getElementById('templateDetailModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    }

    hideSelectModal() {
        const modal = document.getElementById('templateSelectModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 전역 인스턴스 생성
let templateManager;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 템플릿 컨테이너가 있는 경우에만 초기화
    if (document.getElementById('templateContainer')) {
        templateManager = new TemplateManager();
    }
});