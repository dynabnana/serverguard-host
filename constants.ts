import { HostedAsset } from './types';

// 这些常量将作为初始值，实际文件列表会从 API 获取
export const INITIAL_ASSETS: HostedAsset[] = [];

export const PING_INTERVAL_MS = 30000; // 30 seconds (More aggressive for Zeabur)

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 日期格式化
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}