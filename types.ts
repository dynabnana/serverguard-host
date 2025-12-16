export interface SystemLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface HostedAsset {
  id: string;
  name: string;
  url: string;
  size?: number;           // 文件大小（字节）
  createdAt?: Date;        // 创建时间
  modifiedAt?: Date;       // 修改时间
  isUploaded?: boolean;    // 是否为上传的文件（可编辑）
  description?: string;    // 描述（已废弃，保留兼容性）
  placeholderColor?: string; // 占位符颜色
}

export enum AppStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  file?: T;
  files?: T[];
}
