import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>통합 콘텐츠 생성기 - AI 기반 마케팅 자동화</title>
        <meta name="description" content="하나의 제품 설명으로 블로그, 이미지, 비디오, 팟캐스트를 동시에 생성하는 AI 기반 통합 워크플로우" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome Icons */}
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom CSS */}
        <link href="/static/styles.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50 min-h-screen">
        <nav class="bg-blue-600 text-white p-4 shadow-lg">
          <div class="max-w-6xl mx-auto flex items-center justify-between">
            <h1 class="text-2xl font-bold">
              <i class="fas fa-magic mr-2"></i>
              통합 콘텐츠 생성기
            </h1>
            <div class="text-sm">
              AI 기반 마케팅 자동화 플랫폼
            </div>
          </div>
        </nav>
        
        <main class="max-w-6xl mx-auto p-6">
          {children}
        </main>
        
        <footer class="bg-gray-800 text-white p-6 mt-12">
          <div class="max-w-6xl mx-auto text-center">
            <p class="text-gray-300">
              <strong>한국인프라연구원(주)</strong> | 
              <a href="mailto:infrastructure@kakao.com" class="text-blue-300 hover:underline ml-2">infrastructure@kakao.com</a> | 
              <span class="ml-2">010-9143-0800</span>
            </p>
          </div>
        </footer>
        
        {/* JavaScript Libraries */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        {/* 🛡️ Input Validation System */}
        <script src="/static/input-validation.js"></script>
        
        <script src="/static/auth.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/history.js"></script>
        <script src="/static/templates.js"></script>
        <script src="/static/tab-manager.js"></script>
      </body>
    </html>
  )
})
