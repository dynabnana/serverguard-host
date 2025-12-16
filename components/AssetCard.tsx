
import React, { useRef, useState } from 'react';
import { HostedAsset } from '../types';
import { formatFileSize, formatDate } from '../constants';

interface AssetCardProps {
  asset: HostedAsset;
  onRename: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUrl: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onRename, onDelete, currentUrl }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(asset.name);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = async () => {
    if (newName === asset.name || !newName.trim()) {
      setIsEditing(false);
      setNewName(asset.name);
      return;
    }

    setIsLoading(true);
    try {
      await onRename(asset.id, newName);
      setIsEditing(false);
    } catch (error) {
      setNewName(asset.name);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除 "${asset.name}" 吗？`)) return;

    setIsLoading(true);
    try {
      await onDelete(asset.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    const fullUrl = `${currentUrl}${asset.url}`;
    navigator.clipboard.writeText(fullUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  // 根据文件类型确定颜色
  const getFileColor = () => {
    const ext = asset.name.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      'png': 'bg-blue-500',
      'jpg': 'bg-amber-500',
      'jpeg': 'bg-amber-500',
      'gif': 'bg-purple-500',
      'webp': 'bg-green-500',
      'svg': 'bg-pink-500'
    };
    return colors[ext || ''] || 'bg-gray-500';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full transition-all hover:shadow-md ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Image Preview Area */}
      <div className="relative aspect-video w-full bg-gray-50 group overflow-hidden border-b border-gray-100 flex items-center justify-center">
        <img
          src={asset.url}
          alt={asset.name}
          className="w-full h-full object-contain p-4 z-10 relative"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Placeholder State */}
        <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">加载中...</span>
        </div>

        {/* Overlay with actions */}
        {asset.isUploaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-20">
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white p-2 rounded-lg shadow-lg hover:bg-red-600 active:scale-95 transition-transform"
              title="删除文件"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') {
                      setNewName(asset.name);
                      setIsEditing(false);
                    }
                  }}
                  className="flex-1 text-lg font-bold text-gray-900 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-lg truncate" title={asset.name}>
                  {asset.name}
                </h3>
                {asset.isUploaded && (
                  <button
                    onClick={startEditing}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="重命名"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className={`w-3 h-3 rounded-full shrink-0 ${getFileColor()}`}></div>
        </div>

        {/* File Info */}
        <div className="space-y-2 text-sm">
          {/* URL */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 shrink-0">URL:</span>
            <code className="flex-1 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded truncate border border-gray-200" title={`${currentUrl}${asset.url}`}>
              {asset.url}
            </code>
            <button
              onClick={handleCopyUrl}
              className="p-1.5 text-gray-400 hover:text-blue-500 bg-gray-100 hover:bg-blue-50 rounded transition-colors relative"
              title="复制完整 URL"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {showCopied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  已复制!
                </span>
              )}
            </button>
          </div>

          {/* Size */}
          {asset.size !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">大小:</span>
              <span className="text-gray-700 font-medium">{formatFileSize(asset.size)}</span>
            </div>
          )}

          {/* Modified Time */}
          {asset.modifiedAt && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">修改:</span>
              <span className="text-gray-600 text-xs">{formatDate(asset.modifiedAt)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mt-auto pt-3 flex gap-2">
          {asset.isUploaded ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              可编辑
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-gray-50 text-gray-500 rounded-full border border-gray-200">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              静态部署
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
