'use client';

import { useEffect, useState } from 'react';
import { healthCheck } from '@/lib/api';

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    (async () => {
      const isConnected = await healthCheck();
      setApiStatus(isConnected ? 'connected' : 'error');
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NCU × Aalto EMBA
          </h1>
          <p className="text-xl text-gray-600">
            國立中央大學 × 阿爾托大學 在職學位學程
          </p>
        </div>

        {/* API Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">系統狀態</h2>

          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                apiStatus === 'connected'
                  ? 'bg-green-500'
                  : apiStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            />
            <span className="text-lg font-medium text-gray-700">
              {apiStatus === 'checking'
                ? '檢查中...'
                : apiStatus === 'connected'
                  ? '✓ 後端連線正常'
                  : '✗ 無法連接後端'}
            </span>
          </div>

          {apiStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <p className="font-medium">無法連接到後端 API</p>
              <p className="text-sm mt-1">
                請確保後端服務已啟動：
              </p>
              <code className="block bg-red-100 p-2 rounded mt-2 text-sm">
                cd ../admin/backend && uvicorn main:app --reload
              </code>
            </div>
          )}
        </div>

        {/* Project Structure */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">專案結構</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">前台網站</h3>
              <p className="text-gray-600 mb-3">
                <code className="bg-gray-100 px-2 py-1 rounded">web/</code> - Next.js
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ TypeScript</li>
                <li>✓ Tailwind CSS</li>
                <li>✓ API 集成</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">後台管理</h3>
              <p className="text-gray-600 mb-3">
                <code className="bg-gray-100 px-2 py-1 rounded">admin/</code>
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ FastAPI 後端</li>
                <li>✓ HTML/CSS/JS 介面</li>
                <li>✓ SQLite / PostgreSQL</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">後續步驟</h3>
          <ol className="text-sm text-gray-700 space-y-2">
            <li>1. 啟動後端服務：<code className="bg-white px-2 py-1 rounded">cd ../admin/backend && uvicorn main:app --reload</code></li>
            <li>2. 建立頁面組件（pages/, components/）</li>
            <li>3. 連接後台 API 資料</li>
            <li>4. 設計和樣式調整</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
