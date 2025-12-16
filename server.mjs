/**
 * ServerGuard - Enhanced File Hosting Server
 * 支持文件上传、重命名、删除、显示文件大小
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// 生产环境使用 PORT 环境变量，开发环境使用 3001（避免与 Vite 冲突）
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

// 文件存储目录 - 在 Zeabur 上可以挂载到这个路径
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'dist');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // 使用原始文件名，如果有重名则添加时间戳
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);

        let finalName = originalName;
        if (fs.existsSync(path.join(UPLOAD_DIR, originalName))) {
            finalName = `${baseName}_${Date.now()}${ext}`;
        }
        cb(null, finalName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片文件 (PNG, JPG, GIF, WebP, SVG)'));
        }
    }
});

// ==================== API 路由 ====================

/**
 * 获取所有文件列表
 */
app.get('/api/files', (req, res) => {
    try {
        const files = [];

        // 读取上传目录中的文件
        if (fs.existsSync(UPLOAD_DIR)) {
            const uploadedFiles = fs.readdirSync(UPLOAD_DIR);
            for (const filename of uploadedFiles) {
                const filePath = path.join(UPLOAD_DIR, filename);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    files.push({
                        id: Buffer.from(filename).toString('base64'),
                        name: filename,
                        url: `/uploads/${encodeURIComponent(filename)}`,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime,
                        isUploaded: true // 标记为用户上传的文件
                    });
                }
            }
        }

        // 也读取 dist 目录中的静态图片（如果存在）
        if (fs.existsSync(PUBLIC_DIR)) {
            const publicFiles = fs.readdirSync(PUBLIC_DIR);
            for (const filename of publicFiles) {
                if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filename)) {
                    const filePath = path.join(PUBLIC_DIR, filename);
                    const stats = fs.statSync(filePath);
                    if (stats.isFile()) {
                        files.push({
                            id: Buffer.from('public_' + filename).toString('base64'),
                            name: filename,
                            url: `/${encodeURIComponent(filename)}`,
                            size: stats.size,
                            createdAt: stats.birthtime,
                            modifiedAt: stats.mtime,
                            isUploaded: false // 标记为静态部署的文件
                        });
                    }
                }
            }
        }

        // 按修改时间倒序排列
        files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

        res.json({ success: true, files });
    } catch (error) {
        console.error('获取文件列表失败:', error);
        res.status(500).json({ success: false, error: '获取文件列表失败' });
    }
});

/**
 * 上传文件
 */
app.post('/api/files/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '请选择要上传的文件' });
        }

        const stats = fs.statSync(path.join(UPLOAD_DIR, req.file.filename));

        res.json({
            success: true,
            file: {
                id: Buffer.from(req.file.filename).toString('base64'),
                name: req.file.filename,
                url: `/uploads/${encodeURIComponent(req.file.filename)}`,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isUploaded: true
            }
        });
    } catch (error) {
        console.error('上传文件失败:', error);
        res.status(500).json({ success: false, error: '上传文件失败' });
    }
});

/**
 * 重命名文件
 */
app.put('/api/files/:id/rename', (req, res) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;

        if (!newName) {
            return res.status(400).json({ success: false, error: '请提供新文件名' });
        }

        const oldName = Buffer.from(id, 'base64').toString('utf8');

        // 检查是否是静态文件
        if (oldName.startsWith('public_')) {
            return res.status(400).json({ success: false, error: '静态部署的文件无法重命名' });
        }

        const oldPath = path.join(UPLOAD_DIR, oldName);
        const newPath = path.join(UPLOAD_DIR, newName);

        if (!fs.existsSync(oldPath)) {
            return res.status(404).json({ success: false, error: '文件不存在' });
        }

        if (fs.existsSync(newPath)) {
            return res.status(400).json({ success: false, error: '目标文件名已存在' });
        }

        fs.renameSync(oldPath, newPath);

        const stats = fs.statSync(newPath);

        res.json({
            success: true,
            file: {
                id: Buffer.from(newName).toString('base64'),
                name: newName,
                url: `/uploads/${encodeURIComponent(newName)}`,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                isUploaded: true
            }
        });
    } catch (error) {
        console.error('重命名文件失败:', error);
        res.status(500).json({ success: false, error: '重命名文件失败' });
    }
});

/**
 * 删除文件
 */
app.delete('/api/files/:id', (req, res) => {
    try {
        const { id } = req.params;
        const filename = Buffer.from(id, 'base64').toString('utf8');

        // 检查是否是静态文件
        if (filename.startsWith('public_')) {
            return res.status(400).json({ success: false, error: '静态部署的文件无法删除' });
        }

        const filePath = path.join(UPLOAD_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: '文件不存在' });
        }

        fs.unlinkSync(filePath);

        res.json({ success: true, message: '文件删除成功' });
    } catch (error) {
        console.error('删除文件失败:', error);
        res.status(500).json({ success: false, error: '删除文件失败' });
    }
});

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uploadDir: UPLOAD_DIR
    });
});

// ==================== 静态文件服务 ====================

// 提供上传文件的访问
app.use('/uploads', express.static(UPLOAD_DIR));

// 提供前端静态文件
app.use(express.static(PUBLIC_DIR));

// SPA 回退路由
app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// 错误处理
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: '文件大小超过限制 (最大 10MB)' });
        }
    }
    res.status(500).json({ success: false, error: error.message || '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 ServerGuard 服务器运行在端口 ${PORT}`);
    console.log(`📁 上传目录: ${UPLOAD_DIR}`);
    console.log(`🌐 静态文件目录: ${PUBLIC_DIR}`);
});
