
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetCard } from './components/AssetCard';
import { LogConsole } from './components/LogConsole';
import { StatusIndicator } from './components/StatusIndicator';
import { INITIAL_ASSETS, PING_INTERVAL_MS } from './constants';
import { AppStatus, HostedAsset, SystemLog } from './types';

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.STOPPED);
  const [uptime, setUptime] = useState(0);
  const [assets, setAssets] = useState<HostedAsset[]>(INITIAL_ASSETS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  
  // Refs for intervals
  const keepAliveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uptimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((message: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [...prev.slice(-49), newLog]); 
  }, []);

  const pingServer = useCallback(async () => {
    try {
      // Strategy: Fetch the actual assets. This forces the static file server to wake up
      // and serve the file, ensuring the specific path the Mini Program needs is active.
      // We add a timestamp to prevent browser caching.
      const timestamp = Date.now();
      // Updated to match your specific filename
      await fetch(`/cover-card.png?keepalive=${timestamp}`, { method: 'HEAD' });
      addLog(`心跳成功：已确保护航图片资源可访问`, 'success');
    } catch (e) {
      // Even if 404 (file not found yet), the request hit the server, keeping it alive.
      addLog(`心跳发送：服务器已响应请求`, 'info');
    }
  }, [addLog]);

  const startServer = useCallback(() => {
    if (status === AppStatus.RUNNING) return;
    
    setStatus(AppStatus.RUNNING);
    addLog('防休眠系统：已自动启动', 'info');
    
    // Immediate ping
    pingServer();

    // Schedule pings
    keepAliveIntervalRef.current = setInterval(pingServer, PING_INTERVAL_MS);
    
    // Start uptime counter
    uptimeIntervalRef.current = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
  }, [status, pingServer, addLog]);

  const stopServer = () => {
    setStatus(AppStatus.STOPPED);
    setUptime(0);
    addLog('防休眠系统：已手动停止', 'warning');
    
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    if (uptimeIntervalRef.current) clearInterval(uptimeIntervalRef.current);
  };

  // Auto-start on mount
  useEffect(() => {
    startServer();
    setCurrentUrl(window.location.origin);
    return () => {
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
      if (uptimeIntervalRef.current) clearInterval(uptimeIntervalRef.current);
    };
  }, [startServer]);

  // Handle local preview (client-side only)
  const handleAssetUpdate = (id: string, newUrl: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, url: newUrl } : a));
    addLog(`本地预览已更新 (请确保 public 目录包含同名文件)`, 'warning');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">小程序图床 <span className="text-gray-400 font-normal">ServerGuard</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               自动保活中
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
             <div className="text-blue-500 mt-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <div>
               <h4 className="font-bold text-blue-900 text-sm">部署说明</h4>
               <p className="mt-1 text-sm text-blue-800">
                 请将您的图片移动到项目的 <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-1 font-mono">public</code> 文件夹中。
                 文件名必须为 <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-1 font-mono">cover-card.png</code> 和 
                 <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 mx-1 font-mono">donate-qrcode1.png</code>。
               </p>
             </div>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StatusIndicator status={status} uptime={uptime} />
          </div>
          <div className="h-48 lg:h-auto">
             <LogConsole logs={logs} />
          </div>
        </div>

        {/* Assets Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            资源状态概览
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onUpdate={handleAssetUpdate}
              />
            ))}
          </div>
        </div>

      </main>

      {/* Footer with URL info */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>服务运行于: </span>
            <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700 select-all">
              {currentUrl || '获取中...'}
            </code>
          </div>
          <div className="text-xs text-gray-400">
             保持此页面开启以维持服务 24/7 在线
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
