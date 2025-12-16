
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetCard } from './components/AssetCard';
import { LogConsole } from './components/LogConsole';
import { StatusIndicator } from './components/StatusIndicator';
import { FileUpload } from './components/FileUpload';
import { PING_INTERVAL_MS } from './constants';
import { AppStatus, HostedAsset, SystemLog, ApiResponse } from './types';

function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.STOPPED);
  const [uptime, setUptime] = useState(0);
  const [assets, setAssets] = useState<HostedAsset[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // 获取文件列表
  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/files');
      const data: ApiResponse<HostedAsset> = await response.json();

      if (data.success && data.files) {
        setAssets(data.files);
        addLog(`已加载 ${data.files.length} 个文件`, 'success');
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
      addLog('获取文件列表失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  // 上传文件
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    addLog(`正在上传: ${file.name}`, 'info');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data: ApiResponse<HostedAsset> = await response.json();

      if (data.success && data.file) {
        setAssets(prev => [data.file!, ...prev]);
        addLog(`上传成功: ${data.file.name}`, 'success');
      } else {
        addLog(`上传失败: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('上传失败:', error);
      addLog('上传失败，请重试', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // 重命名文件
  const handleRename = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(id)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      });

      const data: ApiResponse<HostedAsset> = await response.json();

      if (data.success && data.file) {
        setAssets(prev => prev.map(a => a.id === id ? data.file! : a));
        addLog(`重命名成功: ${newName}`, 'success');
      } else {
        addLog(`重命名失败: ${data.error}`, 'error');
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('重命名失败:', error);
      throw error;
    }
  };

  // 删除文件
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      const data: ApiResponse<HostedAsset> = await response.json();

      if (data.success) {
        setAssets(prev => prev.filter(a => a.id !== id));
        addLog('文件已删除', 'success');
      } else {
        addLog(`删除失败: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('删除失败:', error);
      addLog('删除失败，请重试', 'error');
    }
  };

  const pingServer = useCallback(async () => {
    try {
      const timestamp = Date.now();
      await fetch(`/api/health?keepalive=${timestamp}`);
      addLog(`心跳成功：服务保活中`, 'success');
    } catch (e) {
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

  // Auto-start on mount
  useEffect(() => {
    startServer();
    setCurrentUrl(window.location.origin);
    fetchFiles();

    return () => {
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
      if (uptimeIntervalRef.current) clearInterval(uptimeIntervalRef.current);
    };
  }, [startServer, fetchFiles]);

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

        {/* Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StatusIndicator status={status} uptime={uptime} />
          </div>
          <div className="h-48 lg:h-auto">
            <LogConsole logs={logs} />
          </div>
        </div>

        {/* Upload Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            上传新资源
          </h2>
          <FileUpload onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Assets Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              资源状态概览
            </h2>
            <span className="text-sm text-gray-500">
              共 {assets.length} 个文件
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-500">加载中...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">暂无图片资源</p>
              <p className="text-sm text-gray-400 mt-1">点击上方区域上传第一张图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  currentUrl={currentUrl}
                />
              ))}
            </div>
          )}
        </div>

        {/* Usage Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3 items-start">
            <div className="text-blue-500 mt-1 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm">使用说明</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• <strong>上传文件：</strong>点击上方上传区域或拖拽图片文件</li>
                <li>• <strong>复制 URL：</strong>点击文件卡片上的复制按钮获取完整访问链接</li>
                <li>• <strong>重命名：</strong>点击文件名旁边的编辑图标</li>
                <li>• <strong>删除文件：</strong>鼠标悬停在图片上，点击删除按钮</li>
                <li>• <strong>静态文件：</strong>随代码部署的文件无法编辑，标记为"静态部署"</li>
              </ul>
            </div>
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
