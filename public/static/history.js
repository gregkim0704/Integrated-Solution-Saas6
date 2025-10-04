// 생성 이력 관리 JavaScript

class HistoryManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            startDate: '',
            endDate: '',
            status: '',
            contentType: '',
            searchTerm: ''
        };
        this.init();
    }

    init() {
        this.renderHistoryUI();
        this.setupEventListeners();
        this.loadHistory();
        this.loadStats();
    }

    renderHistoryUI() {
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer) return;

        historyContainer.innerHTML = `
            <div class="history-manager">
                <!-- 헤더 -->
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-history mr-3 text-blue-600"></i>
                        생성 이력 관리
                    </h2>
                    <div class="flex space-x-2">
                        <button id="refreshHistoryBtn" class="btn-secondary">
                            <i class="fas fa-sync-alt mr-2"></i>
                            새로고침
                        </button>
                        <button id="exportHistoryBtn" class="btn-secondary">
                            <i class="fas fa-download mr-2"></i>
                            내보내기
                        </button>
                    </div>
                </div>

                <!-- 통계 대시보드 -->
                <div class="stats-dashboard mb-8">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-chart-bar mr-2"></i>
                        사용 통계
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="statsCards">
                        <!-- 통계 카드들이 여기에 동적으로 삽입됩니다 -->
                    </div>
                </div>

                <!-- 필터 섹션 -->
                <div class="filters-section mb-6">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="text-lg font-medium text-gray-800 mb-3">
                            <i class="fas fa-filter mr-2"></i>
                            필터 및 검색
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <input 
                                type="text" 
                                id="searchTerm" 
                                placeholder="제품명 검색..." 
                                class="form-input"
                            >
                            <select id="statusFilter" class="form-select">
                                <option value="">모든 상태</option>
                                <option value="completed">완료됨</option>
                                <option value="failed">실패</option>
                                <option value="pending">대기중</option>
                            </select>
                            <select id="contentTypeFilter" class="form-select">
                                <option value="">모든 타입</option>
                                <option value="blog">블로그</option>
                                <option value="image">이미지</option>
                                <option value="video">비디오</option>
                                <option value="podcast">팟캐스트</option>
                            </select>
                            <input type="date" id="startDate" class="form-input" placeholder="시작일">
                            <input type="date" id="endDate" class="form-input" placeholder="종료일">
                        </div>
                        <div class="flex justify-end mt-3 space-x-2">
                            <button id="clearFiltersBtn" class="btn-secondary-sm">초기화</button>
                            <button id="applyFiltersBtn" class="btn-primary-sm">필터 적용</button>
                        </div>
                    </div>
                </div>

                <!-- 이력 목록 -->
                <div class="history-list">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div class="px-4 py-3 border-b border-gray-200">
                            <h4 class="text-lg font-medium text-gray-800">생성 이력</h4>
                        </div>
                        <div id="historyTableContainer">
                            <!-- 이력 테이블이 여기에 동적으로 삽입됩니다 -->
                        </div>
                    </div>
                </div>

                <!-- 페이지네이션 -->
                <div class="pagination-container mt-6" id="paginationContainer">
                    <!-- 페이지네이션이 여기에 동적으로 삽입됩니다 -->
                </div>
            </div>

            <!-- 상세 보기 모달 -->
            <div id="historyDetailModal" class="modal hidden">
                <div class="modal-overlay">
                    <div class="modal-content max-w-4xl">
                        <div class="modal-header">
                            <h3 class="text-xl font-semibold">생성 이력 상세</h3>
                            <button id="closeDetailModal" class="modal-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="historyDetailContent">
                            <!-- 상세 내용이 여기에 동적으로 삽입됩니다 -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // 새로고침 버튼
        document.getElementById('refreshHistoryBtn')?.addEventListener('click', () => {
            this.loadHistory();
            this.loadStats();
        });

        // 필터 적용 버튼
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // 필터 초기화 버튼
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // 내보내기 버튼
        document.getElementById('exportHistoryBtn')?.addEventListener('click', () => {
            this.exportHistory();
        });

        // 모달 닫기
        document.getElementById('closeDetailModal')?.addEventListener('click', () => {
            this.hideDetailModal();
        });

        // 엔터키로 검색
        document.getElementById('searchTerm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });
    }

    async loadStats() {
        try {
            const response = await authenticatedFetch('/api/history/stats');
            
            if (!response.ok) {
                throw new Error('통계 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.renderStats(result.data);
            } else {
                throw new Error(result.error || '통계 로드 실패');
            }
        } catch (error) {
            console.error('Stats load error:', error);
            showNotification('통계 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    renderStats(stats) {
        const container = document.getElementById('statsCards');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-card">
                <div class="stats-icon bg-blue-100 text-blue-600">
                    <i class="fas fa-layer-group"></i>
                </div>
                <div class="stats-content">
                    <div class="stats-number">${stats.totalGenerations}</div>
                    <div class="stats-label">총 생성</div>
                </div>
            </div>
            
            <div class="stats-card">
                <div class="stats-icon bg-green-100 text-green-600">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stats-content">
                    <div class="stats-number">${stats.thisMonthGenerations}</div>
                    <div class="stats-label">이번 달</div>
                </div>
            </div>
            
            <div class="stats-card">
                <div class="stats-icon bg-yellow-100 text-yellow-600">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stats-content">
                    <div class="stats-number">${(stats.averageProcessingTime / 1000).toFixed(1)}s</div>
                    <div class="stats-label">평균 처리 시간</div>
                </div>
            </div>
            
            <div class="stats-card">
                <div class="stats-icon bg-purple-100 text-purple-600">
                    <i class="fas fa-percentage"></i>
                </div>
                <div class="stats-content">
                    <div class="stats-number">${stats.successRate}%</div>
                    <div class="stats-label">성공률</div>
                </div>
            </div>
        `;

        // 콘텐츠 타입별 분석 차트 추가
        if (stats.contentTypeBreakdown && Object.keys(stats.contentTypeBreakdown).length > 0) {
            this.renderContentTypeChart(stats.contentTypeBreakdown);
        }
    }

    renderContentTypeChart(breakdown) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'mt-6 bg-white p-4 rounded-lg shadow-sm border';
        chartContainer.innerHTML = `
            <h4 class="text-lg font-medium text-gray-800 mb-4">
                <i class="fas fa-pie-chart mr-2"></i>
                콘텐츠 타입별 생성 현황
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                ${Object.entries(breakdown).map(([type, count]) => `
                    <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <div class="text-2xl font-bold text-gray-800">${count}</div>
                        <div class="text-sm text-gray-600">${this.getContentTypeLabel(type)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.querySelector('.stats-dashboard').appendChild(chartContainer);
    }

    getContentTypeLabel(type) {
        const labels = {
            blog: '블로그',
            image: '이미지',
            video: '비디오',
            podcast: '팟캐스트'
        };
        return labels[type] || type;
    }

    async loadHistory() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                ...this.filters
            });

            // 빈 값 제거
            for (const [key, value] of params.entries()) {
                if (!value) {
                    params.delete(key);
                }
            }

            const response = await authenticatedFetch(`/api/history?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('이력 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.renderHistoryTable(result.data);
                this.renderPagination(result.data);
            } else {
                throw new Error(result.error || '이력 로드 실패');
            }
        } catch (error) {
            console.error('History load error:', error);
            showNotification('이력 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    renderHistoryTable(data) {
        const container = document.getElementById('historyTableContainer');
        if (!container) return;

        const { contentGenerations, individualGenerations, totalCount } = data;
        const allGenerations = [
            ...contentGenerations.map(item => ({ ...item, type: 'content' })),
            ...individualGenerations.map(item => ({ ...item, type: 'individual' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (allGenerations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>생성 이력이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                제품 설명
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                타입
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                상태
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                처리 시간
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                생성 일시
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                작업
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${allGenerations.map(item => this.renderHistoryRow(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderHistoryRow(item) {
        const statusClass = {
            completed: 'status-success',
            failed: 'status-error',
            pending: 'status-warning',
            processing: 'status-info'
        }[item.status] || 'status-default';

        const statusText = {
            completed: '완료',
            failed: '실패',
            pending: '대기중',
            processing: '처리중'
        }[item.status] || item.status;

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900 truncate max-w-xs">
                        ${item.productDescription || '제품 설명 없음'}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getTypeClass(item.type, item.contentType)}">
                        ${this.getTypeLabel(item.type, item.contentType)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${item.processingTime ? (item.processingTime / 1000).toFixed(1) + 's' : '-'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    ${this.formatDate(item.createdAt)}
                </td>
                <td class="px-6 py-4 text-sm font-medium space-x-2">
                    <button 
                        onclick="historyManager.viewDetail('${item.id}')" 
                        class="text-blue-600 hover:text-blue-900"
                        title="상세 보기"
                    >
                        <i class="fas fa-eye"></i>
                    </button>
                    <button 
                        onclick="historyManager.deleteItem('${item.id}')" 
                        class="text-red-600 hover:text-red-900"
                        title="삭제"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    getTypeClass(type, contentType) {
        if (type === 'content') {
            return 'bg-blue-100 text-blue-800';
        }
        
        const classes = {
            blog: 'bg-green-100 text-green-800',
            image: 'bg-purple-100 text-purple-800',
            video: 'bg-red-100 text-red-800',
            podcast: 'bg-yellow-100 text-yellow-800'
        };
        
        return classes[contentType] || 'bg-gray-100 text-gray-800';
    }

    getTypeLabel(type, contentType) {
        if (type === 'content') {
            return '통합 생성';
        }
        
        return this.getContentTypeLabel(contentType);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderPagination(data) {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        const { totalPages, currentPage } = data;
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const prevDisabled = currentPage <= 1;
        const nextDisabled = currentPage >= totalPages;
        
        let paginationHtml = `
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-700">
                    총 ${data.totalCount}개 중 ${((currentPage - 1) * this.pageSize) + 1}-${Math.min(currentPage * this.pageSize, data.totalCount)}개 표시
                </div>
                <div class="flex space-x-1">
        `;

        // 이전 버튼
        paginationHtml += `
            <button 
                onclick="historyManager.goToPage(${currentPage - 1})" 
                ${prevDisabled ? 'disabled' : ''}
                class="pagination-btn ${prevDisabled ? 'pagination-btn-disabled' : ''}"
            >
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 페이지 번호들
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHtml += `<button onclick="historyManager.goToPage(1)" class="pagination-btn">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button 
                    onclick="historyManager.goToPage(${i})" 
                    class="pagination-btn ${i === currentPage ? 'pagination-btn-active' : ''}"
                >
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHtml += `<button onclick="historyManager.goToPage(${totalPages})" class="pagination-btn">${totalPages}</button>`;
        }

        // 다음 버튼
        paginationHtml += `
            <button 
                onclick="historyManager.goToPage(${currentPage + 1})" 
                ${nextDisabled ? 'disabled' : ''}
                class="pagination-btn ${nextDisabled ? 'pagination-btn-disabled' : ''}"
            >
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationHtml += `
                </div>
            </div>
        `;

        container.innerHTML = paginationHtml;
    }

    goToPage(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadHistory();
    }

    applyFilters() {
        this.filters = {
            searchTerm: document.getElementById('searchTerm')?.value || '',
            status: document.getElementById('statusFilter')?.value || '',
            contentType: document.getElementById('contentTypeFilter')?.value || '',
            startDate: document.getElementById('startDate')?.value || '',
            endDate: document.getElementById('endDate')?.value || ''
        };
        
        this.currentPage = 1; // 필터 적용 시 첫 페이지로
        this.loadHistory();
    }

    clearFilters() {
        document.getElementById('searchTerm').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('contentTypeFilter').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        
        this.filters = {
            searchTerm: '',
            status: '',
            contentType: '',
            startDate: '',
            endDate: ''
        };
        
        this.currentPage = 1;
        this.loadHistory();
    }

    async viewDetail(generationId) {
        try {
            const response = await authenticatedFetch(`/api/history/${generationId}`);
            
            if (!response.ok) {
                throw new Error('상세 정보 로드 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                this.showDetailModal(result.data, result.type);
            } else {
                throw new Error(result.error || '상세 정보 로드 실패');
            }
        } catch (error) {
            console.error('Detail load error:', error);
            showNotification('상세 정보 로드 중 오류가 발생했습니다.', 'error');
        }
    }

    showDetailModal(data, type) {
        const modal = document.getElementById('historyDetailModal');
        const content = document.getElementById('historyDetailContent');
        
        if (!modal || !content) return;

        content.innerHTML = this.renderDetailContent(data, type);
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    renderDetailContent(data, type) {
        let contentHtml = `
            <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-2">기본 정보</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm font-medium text-gray-600">ID</label>
                            <p class="text-sm text-gray-900">${data.id}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">생성 일시</label>
                            <p class="text-sm text-gray-900">${this.formatDate(data.createdAt)}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">처리 시간</label>
                            <p class="text-sm text-gray-900">${data.processingTime ? (data.processingTime / 1000).toFixed(1) + 's' : '정보 없음'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">상태</label>
                            <p class="text-sm text-gray-900">${data.status}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">제품 설명</h4>
                    <p class="text-gray-700 bg-gray-50 p-3 rounded-lg">${data.productDescription}</p>
                </div>
        `;

        if (type === 'content') {
            // 통합 생성 상세
            contentHtml += this.renderContentGenerationDetails(data);
        } else {
            // 개별 생성 상세
            contentHtml += this.renderIndividualGenerationDetails(data);
        }

        contentHtml += `
            </div>
        `;

        return contentHtml;
    }

    renderContentGenerationDetails(data) {
        let html = `<div class="space-y-4">`;

        // 블로그 콘텐츠
        if (data.blogTitle) {
            html += `
                <div class="border rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-blog mr-2 text-green-600"></i>
                        블로그 콘텐츠
                    </h5>
                    <div class="space-y-2">
                        <div>
                            <label class="text-sm font-medium text-gray-600">제목</label>
                            <p class="text-sm text-gray-900">${data.blogTitle}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">태그</label>
                            <p class="text-sm text-gray-900">${data.blogTags ? data.blogTags.join(', ') : '없음'}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-600">예상 읽기 시간</label>
                            <p class="text-sm text-gray-900">${data.blogReadingTime || 0}분</p>
                        </div>
                        ${data.blogContent ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">내용 미리보기</label>
                                <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                                    ${data.blogContent.substring(0, 200)}...
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // 소셜 그래픽
        if (data.socialGraphicUrl) {
            html += `
                <div class="border rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-image mr-2 text-purple-600"></i>
                        소셜 그래픽
                    </h5>
                    <div class="space-y-2">
                        <div>
                            <label class="text-sm font-medium text-gray-600">이미지 URL</label>
                            <a href="${data.socialGraphicUrl}" target="_blank" class="text-sm text-blue-600 hover:underline break-all">
                                ${data.socialGraphicUrl}
                            </a>
                        </div>
                        ${data.socialGraphicDescription ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">설명</label>
                                <p class="text-sm text-gray-900">${data.socialGraphicDescription}</p>
                            </div>
                        ` : ''}
                        ${data.socialGraphicDimensions ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">크기</label>
                                <p class="text-sm text-gray-900">${data.socialGraphicDimensions}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // 프로모션 비디오
        if (data.promoVideoUrl) {
            html += `
                <div class="border rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-video mr-2 text-red-600"></i>
                        프로모션 비디오
                    </h5>
                    <div class="space-y-2">
                        <div>
                            <label class="text-sm font-medium text-gray-600">비디오 URL</label>
                            <a href="${data.promoVideoUrl}" target="_blank" class="text-sm text-blue-600 hover:underline break-all">
                                ${data.promoVideoUrl}
                            </a>
                        </div>
                        ${data.promoVideoDuration ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">길이</label>
                                <p class="text-sm text-gray-900">${data.promoVideoDuration}초</p>
                            </div>
                        ` : ''}
                        ${data.promoVideoDescription ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">설명</label>
                                <p class="text-sm text-gray-900">${data.promoVideoDescription}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // 팟캐스트
        if (data.podcastAudioUrl || data.podcastScript) {
            html += `
                <div class="border rounded-lg p-4">
                    <h5 class="font-semibold text-gray-800 mb-2">
                        <i class="fas fa-podcast mr-2 text-yellow-600"></i>
                        팟캐스트
                    </h5>
                    <div class="space-y-2">
                        ${data.podcastAudioUrl ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">오디오 URL</label>
                                <a href="${data.podcastAudioUrl}" target="_blank" class="text-sm text-blue-600 hover:underline break-all">
                                    ${data.podcastAudioUrl}
                                </a>
                            </div>
                        ` : ''}
                        ${data.podcastDuration ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">길이</label>
                                <p class="text-sm text-gray-900">${data.podcastDuration}초</p>
                            </div>
                        ` : ''}
                        ${data.podcastScript ? `
                            <div>
                                <label class="text-sm font-medium text-gray-600">스크립트 미리보기</label>
                                <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                                    ${data.podcastScript.substring(0, 200)}...
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        return html;
    }

    renderIndividualGenerationDetails(data) {
        return `
            <div class="border rounded-lg p-4">
                <h5 class="font-semibold text-gray-800 mb-2">
                    <i class="fas fa-file-alt mr-2 text-blue-600"></i>
                    ${this.getContentTypeLabel(data.contentType)} 생성 결과
                </h5>
                <div class="space-y-2">
                    <div>
                        <label class="text-sm font-medium text-gray-600">콘텐츠 타입</label>
                        <p class="text-sm text-gray-900">${this.getContentTypeLabel(data.contentType)}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-600">실제 AI 사용</label>
                        <p class="text-sm text-gray-900">${data.realAiUsed ? '예' : '아니오'}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-600">생성 옵션</label>
                        <pre class="text-sm text-gray-700 bg-gray-50 p-2 rounded overflow-auto">${JSON.stringify(data.generationOptions, null, 2)}</pre>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-600">생성 데이터</label>
                        <pre class="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-40 overflow-auto">${JSON.stringify(data.contentData, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    hideDetailModal() {
        const modal = document.getElementById('historyDetailModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    }

    async deleteItem(generationId) {
        if (!confirm('정말로 이 생성 이력을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await authenticatedFetch(`/api/history/${generationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('삭제 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                showNotification('생성 이력이 삭제되었습니다.', 'success');
                this.loadHistory();
                this.loadStats();
            } else {
                throw new Error(result.error || '삭제 실패');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('삭제 중 오류가 발생했습니다.', 'error');
        }
    }

    async exportHistory() {
        try {
            showNotification('히스토리 내보내기를 준비 중입니다...', 'info');
            
            // 모든 데이터 가져오기 (페이지네이션 무시)
            const response = await authenticatedFetch('/api/history?limit=1000');
            
            if (!response.ok) {
                throw new Error('데이터 가져오기 실패');
            }

            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                
                // CSV 형태로 변환
                const csvData = this.convertToCSV([
                    ...data.contentGenerations.map(item => ({ ...item, type: 'content' })),
                    ...data.individualGenerations.map(item => ({ ...item, type: 'individual' }))
                ]);
                
                // 파일 다운로드
                this.downloadCSV(csvData, `generation_history_${new Date().toISOString().split('T')[0]}.csv`);
                
                showNotification('히스토리가 성공적으로 내보내졌습니다.', 'success');
            } else {
                throw new Error(result.error || '데이터 내보내기 실패');
            }
        } catch (error) {
            console.error('Export error:', error);
            showNotification('내보내기 중 오류가 발생했습니다.', 'error');
        }
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = ['ID', '타입', '제품설명', '상태', '처리시간(초)', '생성일시'];
        const rows = data.map(item => [
            item.id,
            item.type === 'content' ? '통합생성' : this.getContentTypeLabel(item.contentType),
            item.productDescription?.replace(/"/g, '""') || '',
            item.status,
            item.processingTime ? (item.processingTime / 1000).toFixed(1) : '',
            this.formatDate(item.createdAt)
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 전역 인스턴스 생성
let historyManager;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 히스토리 컨테이너가 있는 경우에만 초기화
    if (document.getElementById('historyContainer')) {
        historyManager = new HistoryManager();
    }
});