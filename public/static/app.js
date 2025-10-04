// 통합 콘텐츠 생성기 JavaScript

class ContentGenerator {
    constructor() {
        this.currentWorkflow = null;
        this.results = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderUI();
    }

    setupEventListeners() {
        // DOM이 로드된 후 실행
        document.addEventListener('DOMContentLoaded', () => {
            const generateBtn = document.getElementById('generateBtn');
            const generateAllBtn = document.getElementById('generateAllBtn');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.generateSingleContent());
            }
            
            if (generateAllBtn) {
                generateAllBtn.addEventListener('click', () => this.generateAllContent());
            }
        });
    }

    renderUI() {
        // 메인 UI 렌더링
        const mainContent = `
            <div class="content-card">
                <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">
                    <i class="fas fa-rocket mr-3 text-blue-600"></i>
                    AI 기반 통합 콘텐츠 생성기
                </h2>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold text-blue-800 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>
                        혁신적인 마케팅 자동화
                    </h3>
                    <p class="text-blue-700">
                        하나의 제품 설명만으로 <strong>블로그 글, 소셜 그래픽, 프로모션 비디오, 팟캐스트</strong>를 동시에 생성합니다.
                    </p>
                </div>

                <!-- 제품 설명 입력 -->
                <div class="mb-6">
                    <label class="block text-sm font-bold text-gray-700 mb-2">
                        <i class="fas fa-edit mr-2"></i>
                        제품 설명 입력
                    </label>
                    <textarea 
                        id="productDescription" 
                        class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows="4"
                        placeholder="예: 스마트 워치 - 건강 모니터링과 피트니스 추적을 위한 차세대 웨어러블 디바이스입니다. 심박수, 수면 패턴, 활동량을 실시간으로 추적하고 개인 맞춤형 건강 인사이트를 제공합니다..."
                    ></textarea>
                </div>

                <!-- 생성 옵션 -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">
                        <i class="fas fa-cog mr-2"></i>
                        생성 옵션
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">이미지 스타일</label>
                            <select id="imageStyle" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                <option value="modern">모던</option>
                                <option value="minimal">미니멀</option>
                                <option value="vibrant">비브런트</option>
                                <option value="professional">프로페셔널</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">비디오 길이</label>
                            <select id="videoDuration" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                <option value="15">15초</option>
                                <option value="30" selected>30초</option>
                                <option value="60">60초</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">음성 타입</label>
                            <select id="voiceType" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                <option value="professional">프로페셔널</option>
                                <option value="friendly">친근한</option>
                                <option value="energetic">에너지틱</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">언어</label>
                            <select id="language" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                                <option value="ko">한국어</option>
                                <option value="en">English</option>
                                <option value="ja">日本語</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 액션 버튼 -->
                <div class="flex flex-col sm:flex-row gap-4 mb-8">
                    <button 
                        id="generateAllBtn" 
                        class="btn-primary flex-1 flex items-center justify-center"
                    >
                        <i class="fas fa-magic mr-2"></i>
                        전체 콘텐츠 생성 (추천)
                    </button>
                    <div class="flex gap-2 flex-wrap">
                        <button onclick="contentGenerator.generateSingle('blog')" class="btn-secondary">
                            <i class="fas fa-blog mr-1"></i> 블로그만
                        </button>
                        <button onclick="contentGenerator.generateSingle('image')" class="btn-secondary">
                            <i class="fas fa-image mr-1"></i> 이미지만
                        </button>
                        <button onclick="contentGenerator.generateSingle('video')" class="btn-secondary">
                            <i class="fas fa-video mr-1"></i> 비디오만
                        </button>
                        <button onclick="contentGenerator.generateSingle('podcast')" class="btn-secondary">
                            <i class="fas fa-podcast mr-1"></i> 팟캐스트만
                        </button>
                    </div>
                </div>

                <!-- 진행 상태 -->
                <div id="progressSection" class="hidden mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">
                        <i class="fas fa-tasks mr-2"></i>
                        생성 진행 상태
                    </h3>
                    <div class="space-y-3">
                        <div class="workflow-status" id="status-blog">
                            <i class="fas fa-circle text-gray-400"></i>
                            <span>블로그 글 생성</span>
                            <div class="ml-auto">
                                <span class="text-sm text-gray-500">대기 중...</span>
                            </div>
                        </div>
                        <div class="workflow-status" id="status-image">
                            <i class="fas fa-circle text-gray-400"></i>
                            <span>소셜 그래픽 생성</span>
                            <div class="ml-auto">
                                <span class="text-sm text-gray-500">대기 중...</span>
                            </div>
                        </div>
                        <div class="workflow-status" id="status-video">
                            <i class="fas fa-circle text-gray-400"></i>
                            <span>프로모션 비디오 생성</span>
                            <div class="ml-auto">
                                <span class="text-sm text-gray-500">대기 중...</span>
                            </div>
                        </div>
                        <div class="workflow-status" id="status-podcast">
                            <i class="fas fa-circle text-gray-400"></i>
                            <span>팟캐스트 콘텐츠 생성</span>
                            <div class="ml-auto">
                                <span class="text-sm text-gray-500">대기 중...</span>
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar mt-4">
                        <div id="progressFill" class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>

                <!-- 결과 섹션 -->
                <div id="resultsSection" class="hidden">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                        생성 결과
                    </h3>
                    <div id="resultsContainer" class="content-grid">
                        <!-- 결과가 동적으로 여기에 추가됩니다 -->
                    </div>
                </div>
            </div>
        `;

        // 메인 컨테이너에 UI 삽입
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = mainContent;
        }
    }

    async generateAllContent() {
        // 인증 확인
        if (!authManager.isAuthenticated()) {
            authManager.showLoginModal();
            return;
        }

        const productDescription = document.getElementById('productDescription').value.trim();
        
        if (!productDescription) {
            this.showAlert('제품 설명을 입력해주세요.', 'error');
            return;
        }

        const options = {
            imageStyle: document.getElementById('imageStyle').value,
            videoDuration: parseInt(document.getElementById('videoDuration').value),
            voice: document.getElementById('voiceType').value,
            language: document.getElementById('language').value
        };

        this.showProgress(true);
        this.resetStatus();

        try {
            // 진행 상태 업데이트 시뮬레이션
            this.updateStatus('blog', 'processing', '생성 중...');
            this.updateProgress(25);

            this.updateStatus('image', 'processing', '생성 중...');
            this.updateProgress(50);

            this.updateStatus('video', 'processing', '생성 중...');
            this.updateProgress(75);

            this.updateStatus('podcast', 'processing', '생성 중...');

            const response = await authManager.authenticatedRequest('/api/generate-content', {
                method: 'POST',
                data: {
                    productDescription,
                    options
                }
            });

            if (response.data.success) {
                this.results = response.data.data;
                this.updateAllStatus('completed', '완료');
                this.updateProgress(100);
                this.displayResults(this.results);
                
                // 처리 시간 표시
                const processingTime = Math.round(response.data.processingTime / 1000 * 100) / 100;
                this.showAlert(`모든 콘텐츠가 성공적으로 생성되었습니다! (처리 시간: ${processingTime}초)`, 'success');
            } else {
                throw new Error(response.data.error);
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.updateAllStatus('error', '실패');
            
            if (error.response?.status === 402) {
                this.showAlert('프리미엄 플랜이 필요한 기능입니다. 업그레이드를 고려해보세요.', 'warning');
            } else if (error.response?.status === 429) {
                this.showAlert('사용량 한도를 초과했습니다. 잠시 후 다시 시도하거나 플랜을 업그레이드하세요.', 'warning');
            } else if (error.response?.status === 403) {
                this.showAlert('접근 권한이 없습니다.', 'error');
            } else {
                this.showAlert('콘텐츠 생성 중 오류가 발생했습니다: ' + (error.response?.data?.error || error.message), 'error');
            }
        }
    }

    async generateSingle(type) {
        // 인증 확인
        if (!authManager.isAuthenticated()) {
            authManager.showLoginModal();
            return;
        }

        const productDescription = document.getElementById('productDescription').value.trim();
        
        if (!productDescription) {
            this.showAlert('제품 설명을 입력해주세요.', 'error');
            return;
        }

        try {
            let endpoint = '';
            let data = { productDescription };

            // 모든 옵션을 포함하도록 업데이트
            const options = {
                imageStyle: document.getElementById('imageStyle').value,
                videoDuration: parseInt(document.getElementById('videoDuration').value),
                voice: document.getElementById('voiceType').value,
                language: document.getElementById('language').value
            };

            switch (type) {
                case 'blog':
                    endpoint = '/api/generate-blog';
                    data.options = options;
                    break;
                case 'image':
                    endpoint = '/api/generate-image';
                    data.style = options.imageStyle;
                    data.options = options;
                    break;
                case 'video':
                    endpoint = '/api/generate-video';
                    data.duration = options.videoDuration;
                    data.options = options;
                    break;
                case 'podcast':
                    endpoint = '/api/generate-podcast';
                    data.voice = options.voice;
                    data.options = options;
                    break;
            }

            const response = await authManager.authenticatedRequest(endpoint, {
                method: 'POST',
                data: data
            });
            
            if (response.data.success) {
                this.showAlert(`${this.getTypeName(type)} 생성이 완료되었습니다!`, 'success');
                this.displaySingleResult(type, response.data);
            }
        } catch (error) {
            if (error.response?.status === 402) {
                this.showAlert(`${this.getTypeName(type)} 생성은 프리미엄 기능입니다. 업그레이드가 필요합니다.`, 'warning');
            } else if (error.response?.status === 429) {
                this.showAlert(`${this.getTypeName(type)} 월 사용량을 초과했습니다.`, 'warning');
            } else {
                this.showAlert(`${this.getTypeName(type)} 생성 중 오류가 발생했습니다: ` + (error.response?.data?.error || error.message), 'error');
            }
        }
    }

    showProgress(show) {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.classList.toggle('hidden', !show);
        }
    }

    resetStatus() {
        ['blog', 'image', 'video', 'podcast'].forEach(type => {
            this.updateStatus(type, 'pending', '대기 중...');
        });
        this.updateProgress(0);
    }

    updateStatus(type, status, message) {
        const statusElement = document.getElementById(`status-${type}`);
        if (statusElement) {
            statusElement.className = `workflow-status ${status}`;
            
            const icon = statusElement.querySelector('i');
            const messageSpan = statusElement.querySelector('span:last-child');
            
            if (icon) {
                icon.className = this.getStatusIcon(status);
            }
            
            if (messageSpan) {
                messageSpan.textContent = message;
            }
        }
    }

    updateAllStatus(status, message) {
        ['blog', 'image', 'video', 'podcast'].forEach(type => {
            this.updateStatus(type, status, message);
        });
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    getStatusIcon(status) {
        const icons = {
            pending: 'fas fa-circle text-gray-400',
            processing: 'fas fa-spinner fa-spin text-blue-600',
            completed: 'fas fa-check-circle text-green-600',
            error: 'fas fa-exclamation-circle text-red-600'
        };
        return icons[status] || icons.pending;
    }

    getTypeName(type) {
        const names = {
            blog: '블로그 글',
            image: '소셜 그래픽',
            video: '프로모션 비디오',
            podcast: '팟캐스트'
        };
        return names[type] || type;
    }

    displayResults(results) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (!resultsContainer) return;

        resultsSection.classList.remove('hidden');
        
        const resultHTML = `
            <!-- 블로그 결과 -->
            <div class="content-card fade-in">
                <h4 class="text-xl font-bold text-gray-800 mb-3">
                    <i class="fas fa-blog text-blue-600 mr-2"></i>
                    블로그 글
                </h4>
                <div class="mb-3">
                    <h5 class="font-semibold text-gray-700">제목:</h5>
                    <p class="text-gray-600">${results.blog.title}</p>
                </div>
                <div class="mb-3">
                    <h5 class="font-semibold text-gray-700">내용 미리보기:</h5>
                    <div class="text-preview">
                        ${results.blog.content.substring(0, 200)}...
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mb-3">
                    ${results.blog.tags.map(tag => `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">#${tag}</span>`).join('')}
                </div>
                <button onclick="contentGenerator.downloadContent('blog')" class="btn-secondary">
                    <i class="fas fa-download mr-1"></i> 다운로드
                </button>
            </div>

            <!-- 이미지 결과 -->
            <div class="content-card fade-in">
                <h4 class="text-xl font-bold text-gray-800 mb-3">
                    <i class="fas fa-image text-green-600 mr-2"></i>
                    소셜 그래픽
                </h4>
                <div class="media-preview loaded">
                    <img src="${results.socialGraphic.imageUrl}" alt="소셜 그래픽" class="media-thumbnail mx-auto" />
                </div>
                <p class="text-gray-600 mt-2">${results.socialGraphic.description}</p>
                <button onclick="contentGenerator.downloadContent('image')" class="btn-secondary mt-3">
                    <i class="fas fa-download mr-1"></i> 다운로드
                </button>
            </div>

            <!-- 비디오 결과 -->
            <div class="content-card fade-in">
                <h4 class="text-xl font-bold text-gray-800 mb-3">
                    <i class="fas fa-video text-red-600 mr-2"></i>
                    프로모션 비디오
                </h4>
                <div class="media-preview loaded">
                    <video controls class="video-player">
                        <source src="${results.promoVideo.videoUrl}" type="video/mp4">
                        비디오를 재생할 수 없습니다.
                    </video>
                </div>
                <p class="text-gray-600 mt-2">길이: ${results.promoVideo.duration}초</p>
                <button onclick="contentGenerator.downloadContent('video')" class="btn-secondary mt-3">
                    <i class="fas fa-download mr-1"></i> 다운로드
                </button>
            </div>

            <!-- 팟캐스트 결과 -->
            <div class="content-card fade-in">
                <h4 class="text-xl font-bold text-gray-800 mb-3">
                    <i class="fas fa-podcast text-purple-600 mr-2"></i>
                    팟캐스트
                </h4>
                <div class="mb-3">
                    <h5 class="font-semibold text-gray-700">스크립트 미리보기:</h5>
                    <div class="text-preview">
                        ${results.podcast.scriptText.substring(0, 200)}...
                    </div>
                </div>
                <div class="media-preview loaded">
                    <audio controls class="audio-player">
                        <source src="${results.podcast.audioUrl}" type="audio/mpeg">
                        오디오를 재생할 수 없습니다.
                    </audio>
                </div>
                <p class="text-gray-600 mt-2">길이: ${Math.floor(results.podcast.duration / 60)}분 ${results.podcast.duration % 60}초</p>
                <button onclick="contentGenerator.downloadContent('podcast')" class="btn-secondary mt-3">
                    <i class="fas fa-download mr-1"></i> 다운로드
                </button>
            </div>
        `;

        resultsContainer.innerHTML = resultHTML;
    }

    displaySingleResult(type, data) {
        // 단일 결과 표시 로직
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
        
        // 기존 결과 유지하면서 새 결과 추가/업데이트
        this.showAlert(`${this.getTypeName(type)} 결과가 표시되었습니다.`, 'info');
    }

    downloadContent(type) {
        // 다운로드 로직
        if (!this.results) {
            this.showAlert('다운로드할 콘텐츠가 없습니다.', 'error');
            return;
        }

        const data = this.results[type === 'image' ? 'socialGraphic' : 
                                  type === 'video' ? 'promoVideo' : 
                                  type === 'podcast' ? 'podcast' : 'blog'];

        if (data) {
            this.showAlert(`${this.getTypeName(type)} 다운로드가 시작됩니다.`, 'info');
            // 실제 다운로드 로직 구현
        }
    }

    showAlert(message, type = 'info') {
        // 기존 알림 제거
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 새 알림 생성
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                   type === 'error' ? 'exclamation-circle' : 
                                   'info-circle'} mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-lg">&times;</button>
            </div>
        `;

        // 첫 번째 content-card 앞에 삽입
        const firstCard = document.querySelector('.content-card');
        if (firstCard) {
            firstCard.parentNode.insertBefore(alert, firstCard);
        }

        // 5초 후 자동 제거
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// 전역 인스턴스 생성
const contentGenerator = new ContentGenerator();