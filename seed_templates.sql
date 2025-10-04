-- 템플릿 시스템 초기 데이터
-- 업계별, 목적별 카테고리 및 사전 정의 템플릿

-- 카테고리 데이터
INSERT OR REPLACE INTO template_categories (id, name, description, icon, color, type, sort_order, active) VALUES
-- 업계별 카테고리
('cat_tech', '기술/IT', 'IT 서비스, 소프트웨어, 하드웨어 관련 템플릿', 'fas fa-microchip', 'blue', 'industry', 1, TRUE),
('cat_beauty', '뷰티/화장품', '화장품, 스킨케어, 뷰티 디바이스 관련 템플릿', 'fas fa-heart', 'pink', 'industry', 2, TRUE),
('cat_health', '건강/의료', '건강 관리, 의료기기, 피트니스 관련 템플릿', 'fas fa-heartbeat', 'green', 'industry', 3, TRUE),
('cat_edu', '교육/학습', '교육 서비스, 학습 도구, 온라인 강의 관련 템플릿', 'fas fa-graduation-cap', 'indigo', 'industry', 4, TRUE),
('cat_food', '식품/음료', '식품, 음료, 건강식품 관련 템플릿', 'fas fa-utensils', 'orange', 'industry', 5, TRUE),
('cat_fashion', '패션/라이프스타일', '패션, 생활용품, 라이프스타일 관련 템플릿', 'fas fa-tshirt', 'purple', 'industry', 6, TRUE),

-- 목적별 카테고리  
('cat_launch', '제품 출시', '신제품 런칭, 제품 소개용 템플릿', 'fas fa-rocket', 'red', 'purpose', 1, TRUE),
('cat_event', '이벤트/프로모션', '할인 행사, 이벤트 홍보용 템플릿', 'fas fa-calendar-star', 'yellow', 'purpose', 2, TRUE),
('cat_brand', '브랜딩', '브랜드 스토리, 기업 소개용 템플릿', 'fas fa-building', 'teal', 'purpose', 3, TRUE),
('cat_tutorial', '튜토리얼/가이드', '사용법 설명, 교육용 콘텐츠 템플릿', 'fas fa-chalkboard-teacher', 'cyan', 'purpose', 4, TRUE),
('cat_review', '리뷰/후기', '제품 리뷰, 사용후기용 템플릿', 'fas fa-star', 'amber', 'purpose', 5, TRUE);

-- 기술/IT 템플릿들
INSERT OR REPLACE INTO content_templates (
    id, name, description, category_id, is_system, is_public, creator_id,
    blog_template, image_template, video_template, podcast_template,
    tags, usage_count, rating, rating_count
) VALUES 
(
    'tpl_tech_saas', 'SaaS 제품 소개', 'SaaS/클라우드 서비스 제품 소개용 템플릿', 'cat_tech', TRUE, TRUE, NULL,
    '{"titleFormat": "{{productName}} - 혁신적인 {{serviceType}} 솔루션", "contentStructure": {"introduction": "현대 비즈니스의 디지털 전환을 위한 혁신적인 {{productName}}을(를) 소개합니다.", "sections": [{"heading": "핵심 기능", "contentTemplate": "{{productName}}의 주요 기능들: {{features}}"}, {"heading": "비즈니스 혜택", "contentTemplate": "도입 효과: {{benefits}}"}, {"heading": "보안 및 안정성", "contentTemplate": "엔터프라이즈급 보안과 99.9% 가동률 보장"}], "conclusion": "{{productName}}로 디지털 혁신을 시작하세요."}, "seoSettings": {"keywordDensity": 2.5, "metaDescription": "{{productName}} SaaS 솔루션으로 비즈니스 효율성 향상", "tags": ["SaaS", "클라우드", "비즈니스솔루션"]}, "styleGuide": {"tone": "professional", "length": "medium", "language": "ko"}}',
    '{"style": "professional tech", "dimensions": "1024x1024", "colorScheme": ["#2563eb", "#1e40af", "#f8fafc"], "composition": {"layout": "split", "textPlacement": "side", "textStyle": "modern sans-serif"}, "promptTemplate": "Professional {{productType}} dashboard interface in modern blue theme, clean UI/UX design, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "top-left", "brandColors": true}}',
    '{"duration": 60, "format": "16:9", "style": "professional", "scriptStructure": {"hook": "비즈니스 혁신의 시작, {{productName}}", "introduction": "{{productName}} 소개", "mainContent": "핵심 기능 데모 및 사용 사례", "callToAction": "무료 체험 시작하기"}, "visualElements": {"transitions": ["fade", "slide"], "effects": ["zoom-in", "highlight"], "musicStyle": "corporate"}, "promptTemplate": "Professional software demonstration video, {{productType}} interface tour, modern business style"}',
    '{"duration": 180, "scriptStructure": {"intro": "SaaS 혁신 소식을 전해드리는 테크 인사이트입니다.", "segments": [{"title": "제품 소개", "contentTemplate": "{{productName}}의 혁신적인 특징", "duration": 60}, {"title": "업계 동향", "contentTemplate": "{{industry}} 트렌드 분석", "duration": 90}, {"title": "성공 사례", "contentTemplate": "고객 성공 스토리", "duration": 30}], "outro": "더 많은 정보는 공식 웹사이트에서 확인하세요."}, "voiceSettings": {"style": "professional", "pace": "normal", "language": "ko"}, "promptTemplate": "Professional tech podcast about {{productType}}, business insights style"}',
    '["SaaS", "클라우드", "B2B", "비즈니스솔루션", "기술"]', 0, 0.0, 0
),
(
    'tpl_tech_app', '모바일 앱 런칭', '모바일 애플리케이션 출시용 템플릿', 'cat_tech', TRUE, TRUE, NULL,
    '{"titleFormat": "새로운 모바일 경험, {{appName}} 앱 출시!", "contentStructure": {"introduction": "혁신적인 모바일 앱 {{appName}}이(가) 드디어 출시되었습니다.", "sections": [{"heading": "앱 주요 기능", "contentTemplate": "{{appName}}의 핵심 기능: {{features}}"}, {"heading": "사용자 경험", "contentTemplate": "직관적인 UI/UX로 누구나 쉽게 사용 가능"}, {"heading": "다운로드 및 설치", "contentTemplate": "App Store와 Google Play에서 무료 다운로드"}], "conclusion": "지금 바로 {{appName}}을(를) 다운로드하여 새로운 경험을 시작하세요!"}, "seoSettings": {"keywordDensity": 2.0, "metaDescription": "{{appName}} 모바일 앱 출시, 혁신적인 모바일 경험", "tags": ["모바일앱", "앱출시", "스마트폰"]}, "styleGuide": {"tone": "friendly", "length": "medium", "language": "ko"}}',
    '{"style": "modern mobile", "dimensions": "1080x1080", "colorScheme": ["#8b5cf6", "#a855f7", "#f3f4f6"], "composition": {"layout": "centered", "textPlacement": "bottom", "textStyle": "bold modern"}, "promptTemplate": "Smartphone mockup showing {{appName}} interface, modern gradient background, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "center", "brandColors": true}}',
    '{"duration": 30, "format": "9:16", "style": "dynamic", "scriptStructure": {"hook": "새로운 앱 경험의 시작!", "introduction": "{{appName}} 앱 소개", "mainContent": "주요 기능 시연", "callToAction": "지금 다운로드!"}, "visualElements": {"transitions": ["swipe", "bounce"], "effects": ["pulse", "glow"], "musicStyle": "upbeat"}, "promptTemplate": "Mobile app showcase video, {{appName}} features demonstration, energetic style"}',
    '{"duration": 120, "scriptStructure": {"intro": "모바일 트렌드를 전해드리는 앱 리뷰 시간입니다.", "segments": [{"title": "앱 소개", "contentTemplate": "{{appName}}의 특별한 점", "duration": 45}, {"title": "사용법 가이드", "contentTemplate": "실제 사용 팁과 노하우", "duration": 60}, {"title": "추천 이유", "contentTemplate": "왜 이 앱을 써야 하는가", "duration": 15}], "outro": "앱 스토어에서 다운로드하세요!"}, "voiceSettings": {"style": "friendly", "pace": "normal", "language": "ko"}, "promptTemplate": "Mobile app review podcast, user experience focused, conversational style"}',
    '["모바일앱", "앱출시", "스마트폰", "사용자경험", "다운로드"]', 0, 0.0, 0
);

-- 뷰티/화장품 템플릿들
INSERT OR REPLACE INTO content_templates (
    id, name, description, category_id, is_system, is_public, creator_id,
    blog_template, image_template, video_template, podcast_template,
    tags, usage_count, rating, rating_count
) VALUES 
(
    'tpl_beauty_skincare', '스킨케어 제품', '스킨케어 화장품 마케팅용 템플릿', 'cat_beauty', TRUE, TRUE, NULL,
    '{"titleFormat": "{{season}} 필수템! {{productName}}으로 완벽한 {{skinType}} 케어", "contentStructure": {"introduction": "{{season}}에 특별히 필요한 {{skinType}} 전용 {{productName}}을(를) 만나보세요.", "sections": [{"heading": "핵심 성분", "contentTemplate": "{{ingredients}} 성분의 놀라운 효과"}, {"heading": "사용법", "contentTemplate": "{{steps}}단계로 완성하는 완벽한 스킨케어 루틴"}, {"heading": "사용 후기", "contentTemplate": "실제 사용자들의 생생한 후기와 변화"}], "conclusion": "지금 바로 {{productName}}으로 건강하고 아름다운 피부를 경험해보세요."}, "seoSettings": {"keywordDensity": 3.0, "metaDescription": "{{productName}} 스킨케어로 {{skinType}} 완벽 관리", "tags": ["스킨케어", "화장품", "뷰티", "피부관리"]}, "styleGuide": {"tone": "friendly", "length": "medium", "language": "ko"}}',
    '{"style": "elegant beauty", "dimensions": "1024x1024", "colorScheme": ["#fdf2f8", "#f9a8d4", "#ec4899"], "composition": {"layout": "minimal", "textPlacement": "top", "textStyle": "elegant serif"}, "promptTemplate": "Luxury {{productType}} beauty shot, soft pink aesthetic, elegant composition, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "bottom-right", "brandColors": true}}',
    '{"duration": 45, "format": "9:16", "style": "aesthetic", "scriptStructure": {"hook": "완벽한 피부의 비밀", "introduction": "{{productName}} 소개", "mainContent": "사용법 및 효과", "callToAction": "지금 주문하기"}, "visualElements": {"transitions": ["gentle fade", "soft blur"], "effects": ["glow", "sparkle"], "musicStyle": "soft ambient"}, "promptTemplate": "Beauty skincare routine video, {{productType}} application demo, soft aesthetic style"}',
    '{"duration": 300, "scriptStructure": {"intro": "뷰티 인사이드와 함께하는 스킨케어 시간입니다.", "segments": [{"title": "제품 리뷰", "contentTemplate": "{{productName}}의 상세한 성분 분석", "duration": 120}, {"title": "사용법 가이드", "contentTemplate": "올바른 스킨케어 루틴 설명", "duration": 120}, {"title": "뷰티 팁", "contentTemplate": "{{season}} 시즌 스킨케어 노하우", "duration": 60}], "outro": "더 많은 뷰티 정보는 블로그에서 확인하세요."}, "voiceSettings": {"style": "friendly", "pace": "normal", "language": "ko"}, "promptTemplate": "Beauty and skincare podcast, product review and tips, friendly feminine style"}',
    '["스킨케어", "화장품", "뷰티", "피부관리", "K뷰티"]', 0, 0.0, 0
),
(
    'tpl_beauty_makeup', '메이크업 제품', '메이크업 화장품 홍보용 템플릿', 'cat_beauty', TRUE, TRUE, NULL,
    '{"titleFormat": "{{occasion}} 완벽 메이크업! {{productName}} 컬렉션", "contentStructure": {"introduction": "{{occasion}}를 위한 특별한 {{productName}} 컬렉션이 출시되었습니다.", "sections": [{"heading": "컬렉션 구성", "contentTemplate": "{{items}} 로 구성된 완벽한 메이크업 세트"}, {"heading": "컬러 팔레트", "contentTemplate": "{{colors}} 다양한 컬러로 나만의 스타일 연출"}, {"heading": "메이크업 튜토리얼", "contentTemplate": "{{steps}}단계로 완성하는 {{occasion}} 메이크업"}], "conclusion": "{{productName}}으로 특별한 날을 더욱 아름답게 만들어보세요."}, "seoSettings": {"keywordDensity": 2.8, "metaDescription": "{{productName}} 메이크업 컬렉션으로 {{occasion}} 완벽 준비", "tags": ["메이크업", "화장품", "컬러", "뷰티룩"]}, "styleGuide": {"tone": "energetic", "length": "medium", "language": "ko"}}',
    '{"style": "vibrant makeup", "dimensions": "1080x1080", "colorScheme": ["#fbbf24", "#f59e0b", "#1f2937"], "composition": {"layout": "overlay", "textPlacement": "center", "textStyle": "bold modern"}, "promptTemplate": "Colorful makeup {{productType}} flat lay, vibrant colors palette, professional beauty photography, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "top-center", "brandColors": true}}',
    '{"duration": 60, "format": "16:9", "style": "tutorial", "scriptStructure": {"hook": "메이크업 변신의 마법!", "introduction": "{{productName}} 소개", "mainContent": "스텝 바이 스텝 메이크업 튜토리얼", "callToAction": "제품 구매하기"}, "visualElements": {"transitions": ["zoom", "reveal"], "effects": ["shimmer", "highlight"], "musicStyle": "upbeat pop"}, "promptTemplate": "Makeup tutorial video, {{productType}} application steps, beauty transformation style"}',
    '{"duration": 240, "scriptStructure": {"intro": "메이크업 아티스트와 함께하는 뷰티 토크입니다.", "segments": [{"title": "트렌드 분석", "contentTemplate": "{{season}} 메이크업 트렌드 소개", "duration": 80}, {"title": "제품 리뷰", "contentTemplate": "{{productName}} 상세 리뷰", "duration": 100}, {"title": "메이크업 팁", "contentTemplate": "프로 아티스트의 메이크업 노하우", "duration": 60}], "outro": "다음 시간에도 더 많은 뷰티 정보로 찾아뵙겠습니다."}, "voiceSettings": {"style": "energetic", "pace": "normal", "language": "ko"}, "promptTemplate": "Makeup and beauty trends podcast, professional artist insights, energetic style"}',
    '["메이크업", "화장품", "컬러메이크업", "뷰티", "메이크업튜토리얼"]', 0, 0.0, 0
);

-- 건강/의료 템플릿들
INSERT OR REPLACE INTO content_templates (
    id, name, description, category_id, is_system, is_public, creator_id,
    blog_template, image_template, video_template, podcast_template,
    tags, usage_count, rating, rating_count
) VALUES 
(
    'tpl_health_fitness', '피트니스/운동', '피트니스 기기 및 운동 프로그램용 템플릿', 'cat_health', TRUE, TRUE, NULL,
    '{"titleFormat": "{{goalType}} 달성을 위한 {{productName}} 완벽 가이드", "contentStructure": {"introduction": "{{goalType}} 목표 달성을 위한 혁신적인 {{productName}}을(를) 소개합니다.", "sections": [{"heading": "운동 효과", "contentTemplate": "{{productName}}로 얻을 수 있는 {{benefits}} 효과"}, {"heading": "사용법 및 루틴", "contentTemplate": "{{duration}}분 {{frequency}} 루틴으로 최대 효과 달성"}, {"heading": "성공 사례", "contentTemplate": "실제 사용자들의 {{goalType}} 달성 스토리"}], "conclusion": "지금 시작하여 {{goalType}} 목표를 달성해보세요!"}, "seoSettings": {"keywordDensity": 2.5, "metaDescription": "{{productName}}으로 {{goalType}} 목표 달성하기", "tags": ["피트니스", "운동", "다이어트", "건강"]}, "styleGuide": {"tone": "energetic", "length": "medium", "language": "ko"}}',
    '{"style": "dynamic fitness", "dimensions": "1024x1024", "colorScheme": ["#10b981", "#059669", "#f3f4f6"], "composition": {"layout": "centered", "textPlacement": "bottom", "textStyle": "bold athletic"}, "promptTemplate": "{{productType}} fitness equipment in action, energetic workout scene, motivational style, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "top-left", "brandColors": true}}',
    '{"duration": 90, "format": "16:9", "style": "energetic", "scriptStructure": {"hook": "변화는 지금 시작됩니다!", "introduction": "{{productName}} 소개", "mainContent": "운동 데모 및 효과 설명", "callToAction": "지금 시작하기"}, "visualElements": {"transitions": ["dynamic cut", "energy burst"], "effects": ["motion blur", "impact"], "musicStyle": "energetic workout"}, "promptTemplate": "Fitness workout demonstration video, {{productType}} exercise routine, high energy motivational style"}',
    '{"duration": 360, "scriptStructure": {"intro": "건강한 라이프스타일을 위한 피트니스 가이드입니다.", "segments": [{"title": "제품 소개", "contentTemplate": "{{productName}}의 특징과 장점", "duration": 120}, {"title": "운동 루틴", "contentTemplate": "효과적인 {{goalType}} 운동법", "duration": 180}, {"title": "영양 및 관리", "contentTemplate": "운동 효과를 높이는 생활 습관", "duration": 60}], "outro": "건강한 변화, 지금 시작하세요!"}, "voiceSettings": {"style": "energetic", "pace": "normal", "language": "ko"}, "promptTemplate": "Health and fitness podcast, workout guidance and motivation, energetic coaching style"}',
    '["피트니스", "운동", "홈트레이닝", "건강관리", "다이어트"]', 0, 0.0, 0
);

-- 교육/학습 템플릿들  
INSERT OR REPLACE INTO content_templates (
    id, name, description, category_id, is_system, is_public, creator_id,
    blog_template, image_template, video_template, podcast_template,
    tags, usage_count, rating, rating_count
) VALUES 
(
    'tpl_edu_online', '온라인 교육', '온라인 강의 및 교육 서비스용 템플릿', 'cat_edu', TRUE, TRUE, NULL,
    '{"titleFormat": "{{skillType}} 마스터하기: {{courseName}} 완전정복", "contentStructure": {"introduction": "{{skillType}} 전문가가 되기 위한 체계적인 {{courseName}} 과정을 소개합니다.", "sections": [{"heading": "커리큘럼", "contentTemplate": "{{modules}}개 모듈로 구성된 단계별 학습 과정"}, {"heading": "학습 방법", "contentTemplate": "{{method}} 방식의 효과적인 학습 시스템"}, {"heading": "수강생 후기", "contentTemplate": "실제 수강생들의 {{skillType}} 마스터 성공 스토리"}], "conclusion": "지금 바로 {{courseName}}으로 {{skillType}} 전문가의 길을 시작하세요!"}, "seoSettings": {"keywordDensity": 2.3, "metaDescription": "{{courseName}} 온라인 강의로 {{skillType}} 완전 마스터", "tags": ["온라인교육", "강의", "스킬업", "학습"]}, "styleGuide": {"tone": "authoritative", "length": "long", "language": "ko"}}',
    '{"style": "educational clean", "dimensions": "1024x1024", "colorScheme": ["#3b82f6", "#1d4ed8", "#f8fafc"], "composition": {"layout": "split", "textPlacement": "side", "textStyle": "clean academic"}, "promptTemplate": "Online education platform interface, {{courseName}} course preview, clean academic design, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "top-center", "brandColors": true}}',
    '{"duration": 120, "format": "16:9", "style": "educational", "scriptStructure": {"hook": "새로운 스킬, 새로운 기회!", "introduction": "{{courseName}} 과정 소개", "mainContent": "강의 미리보기 및 학습 효과", "callToAction": "지금 수강 신청!"}, "visualElements": {"transitions": ["slide", "fade"], "effects": ["highlight", "zoom-in"], "musicStyle": "inspiring corporate"}, "promptTemplate": "Online course preview video, {{skillType}} learning content, professional educational style"}',
    '{"duration": 420, "scriptStructure": {"intro": "전문가와 함께하는 교육 인사이트 시간입니다.", "segments": [{"title": "과정 소개", "contentTemplate": "{{courseName}}의 특별한 점", "duration": 150}, {"title": "학습 가이드", "contentTemplate": "효과적인 {{skillType}} 학습법", "duration": 180}, {"title": "커리어 조언", "contentTemplate": "{{skillType}} 전문가로 성장하는 법", "duration": 90}], "outro": "더 많은 교육 정보는 웹사이트에서 확인하세요."}, "voiceSettings": {"style": "authoritative", "pace": "normal", "language": "ko"}, "promptTemplate": "Educational insights podcast, {{skillType}} learning guidance, professional teaching style"}',
    '["온라인교육", "강의", "이러닝", "스킬업", "자기계발"]', 0, 0.0, 0
);

-- 제품 출시용 템플릿
INSERT OR REPLACE INTO content_templates (
    id, name, description, category_id, is_system, is_public, creator_id,
    blog_template, image_template, video_template, podcast_template,
    tags, usage_count, rating, rating_count
) VALUES 
(
    'tpl_launch_new', '신제품 출시', '새로운 제품 런칭용 범용 템플릿', 'cat_launch', TRUE, TRUE, NULL,
    '{"titleFormat": "드디어 공개! {{productName}} 정식 출시", "contentStructure": {"introduction": "오랜 기다림 끝에 {{productName}}이(가) 드디어 정식 출시되었습니다.", "sections": [{"heading": "혁신적인 특징", "contentTemplate": "{{productName}}만의 독창적인 {{features}} 기능"}, {"heading": "출시 이벤트", "contentTemplate": "{{discount}}% 할인 및 {{bonus}} 특별 혜택"}, {"heading": "구매 방법", "contentTemplate": "{{channels}}에서 간편하게 주문 가능"}], "conclusion": "혁신을 경험하세요. 지금 바로 {{productName}}을(를) 만나보세요!"}, "seoSettings": {"keywordDensity": 3.0, "metaDescription": "{{productName}} 신제품 출시, 특별 출시 이벤트 진행중", "tags": ["신제품", "출시", "런칭", "이벤트"]}, "styleGuide": {"tone": "energetic", "length": "medium", "language": "ko"}}',
    '{"style": "launch celebration", "dimensions": "1080x1080", "colorScheme": ["#ef4444", "#dc2626", "#fef2f2"], "composition": {"layout": "centered", "textPlacement": "top", "textStyle": "bold celebration"}, "promptTemplate": "Product launch celebration, {{productName}} hero shot, exciting announcement style, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "bottom-center", "brandColors": true}}',
    '{"duration": 45, "format": "16:9", "style": "celebration", "scriptStructure": {"hook": "혁신의 순간이 왔습니다!", "introduction": "{{productName}} 출시 발표", "mainContent": "제품 소개 및 특별 혜택", "callToAction": "지금 주문하기!"}, "visualElements": {"transitions": ["burst", "reveal"], "effects": ["confetti", "shine"], "musicStyle": "celebratory upbeat"}, "promptTemplate": "Product launch announcement video, {{productName}} reveal, celebration and excitement style"}',
    '{"duration": 180, "scriptStructure": {"intro": "특별한 출시 소식을 전해드리는 시간입니다.", "segments": [{"title": "제품 공개", "contentTemplate": "{{productName}}의 혁신적인 특징 소개", "duration": 90}, {"title": "개발 스토리", "contentTemplate": "제품 개발 과정과 비하인드 스토리", "duration": 60}, {"title": "출시 이벤트", "contentTemplate": "특별 할인 및 런칭 이벤트 안내", "duration": 30}], "outro": "새로운 경험, 지금 시작하세요!"}, "voiceSettings": {"style": "energetic", "pace": "normal", "language": "ko"}, "promptTemplate": "Product launch announcement podcast, {{productName}} introduction, exciting reveal style"}',
    '["신제품출시", "런칭", "제품소개", "이벤트", "혁신"]', 0, 0.0, 0
);

-- 이벤트/프로모션용 템플릿
INSERT OR REPLACE INTO content_templates (
    id, name, description, category_id, is_system, is_public, creator_id,
    blog_template, image_template, video_template, podcast_template,
    tags, usage_count, rating, rating_count
) VALUES 
(
    'tpl_event_sale', '할인 이벤트', '세일 및 할인 프로모션용 템플릿', 'cat_event', TRUE, TRUE, NULL,
    '{"titleFormat": "{{eventName}} 특가 이벤트! {{discount}}% 할인 혜택", "contentStructure": {"introduction": "{{period}} 동안 진행되는 특별한 {{eventName}} 이벤트를 놓치지 마세요!", "sections": [{"heading": "이벤트 혜택", "contentTemplate": "{{discount}}% 할인 + {{bonus}} 추가 혜택"}, {"heading": "대상 상품", "contentTemplate": "{{products}} 전 품목 할인 적용"}, {"heading": "참여 방법", "contentTemplate": "{{howto}} 간단한 방법으로 할인 혜택 받기"}], "conclusion": "{{endDate}}까지 한정! 지금 바로 특가 혜택을 누리세요!"}, "seoSettings": {"keywordDensity": 3.5, "metaDescription": "{{eventName}} {{discount}}% 할인 이벤트, {{endDate}}까지 한정", "tags": ["할인", "세일", "이벤트", "특가"]}, "styleGuide": {"tone": "energetic", "length": "short", "language": "ko"}}',
    '{"style": "sale promotion", "dimensions": "1080x1080", "colorScheme": ["#fbbf24", "#f59e0b", "#dc2626"], "composition": {"layout": "overlay", "textPlacement": "center", "textStyle": "bold promotional"}, "promptTemplate": "{{eventName}} sale promotion banner, {{discount}}% off highlight, urgent promotional style, {{mood}}", "brandElements": {"includeLogo": true, "logoPosition": "top-right", "brandColors": true}}',
    '{"duration": 30, "format": "9:16", "style": "urgent", "scriptStructure": {"hook": "놓치면 후회하는 기회!", "introduction": "{{eventName}} 이벤트 소개", "mainContent": "할인 혜택 및 대상 상품", "callToAction": "지금 바로 구매!"}, "visualElements": {"transitions": ["flash", "zoom"], "effects": ["countdown", "pulse"], "musicStyle": "urgent exciting"}, "promptTemplate": "Sale promotion video, {{discount}}% discount announcement, urgent call-to-action style"}',
    '{"duration": 90, "scriptStructure": {"intro": "특별한 할인 소식을 전해드리는 쇼핑 가이드입니다.", "segments": [{"title": "이벤트 소개", "contentTemplate": "{{eventName}}의 특별한 혜택들", "duration": 30}, {"title": "추천 상품", "contentTemplate": "놓치면 안 될 {{products}} 베스트 아이템", "duration": 45}, {"title": "쇼핑 팁", "contentTemplate": "할인 혜택 최대한 활용하는 방법", "duration": 15}], "outro": "{{endDate}}까지! 서둘러 주문하세요!"}, "voiceSettings": {"style": "energetic", "pace": "fast", "language": "ko"}, "promptTemplate": "Sale event announcement podcast, {{eventName}} shopping guide, energetic promotional style"}',
    '["할인이벤트", "세일", "프로모션", "특가", "쇼핑"]', 0, 0.0, 0
);