# ServerGuard - 小程序图床增强版

一个用于托管小程序图片资源的服务，支持在线上传、重命名、删除文件。

## 功能特性

- ✅ **在线上传图片** - 直接在网页上传图片文件
- ✅ **显示文件大小** - 每个文件显示详细的大小信息
- ✅ **重命名文件** - 支持对已上传的文件进行重命名
- ✅ **删除文件** - 可以删除不需要的文件
- ✅ **复制 URL** - 一键复制图片的完整访问地址
- ✅ **自动保活** - 防止 Zeabur 容器休眠
- ✅ **持久化存储** - 使用 Zeabur 磁盘挂载保存上传的文件

## 部署到 Zeabur

### 1. 部署服务

1. 将代码推送到 GitHub
2. 在 Zeabur 中创建新服务，选择从 GitHub 部署
3. 等待构建完成

### 2. 配置持久化存储（重要！）

为了让上传的文件在重新部署后依然保留，需要配置磁盘挂载：

1. 在 Zeabur 控制台中，进入你的项目
2. 点击服务卡片，进入服务详情
3. 点击 **"Storage"（存储）** 标签
4. 点击 **"Add Persistent Storage"（添加持久化存储）**
5. 设置挂载路径为：`/app/uploads`
6. 设置容量（比如 1GB）
7. 点击保存

### 3. 配置环境变量

在 Zeabur 的 Variables 面板中添加：

```
UPLOAD_DIR=/app/uploads
NODE_ENV=production
```

### 4. 设置构建命令

- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## 本地开发

```bash
# 安装依赖
npm install

# 启动后端服务器（端口 3001）
npm run dev:server

# 在新终端启动前端开发服务器（端口 3000）
npm run dev
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/files` | 获取所有文件列表 |
| POST | `/api/files/upload` | 上传新文件 |
| PUT | `/api/files/:id/rename` | 重命名文件 |
| DELETE | `/api/files/:id` | 删除文件 |
| GET | `/api/health` | 健康检查 |

## 文件访问

- 上传的文件：`https://你的域名/uploads/文件名.png`
- 静态部署的文件：`https://你的域名/文件名.png`

## 在小程序中使用

```javascript
// 图片 URL 示例
const coverImage = 'https://zbbj.zeabur.app/uploads/cover-card.png';
const donateQR = 'https://zbbj.zeabur.app/uploads/donate-qrcode1.png';
```

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Express + Multer
- **部署**: Zeabur + 持久化存储
