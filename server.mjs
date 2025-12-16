/**
 * ServerGuard - 轻量级文件托管服务器
 * 优化内存占用
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 文件存储目录
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'dist');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 精简中间件
app.use(express.json({ limit: '1mb' }));

// 配置文件上传 - 使用磁盘存储避免内存占用
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只支持图片文件'));
        }
    }
});

// ==================== API 路由 ====================

// 获取文件列表
app.get('/api/files', (req, res) => {
    try {
        const files = [];

        // 上传目录
        if (fs.existsSync(UPLOAD_DIR)) {
            for (const filename of fs.readdirSync(UPLOAD_DIR)) {
                const filePath = path.join(UPLOAD_DIR, filename);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    files.push({
                        id: Buffer.from(filename).toString('base64'),
                        name: filename,
                        url: `/uploads/${encodeURIComponent(filename)}`,
                        size: stats.size,
                        modifiedAt: stats.mtime,
                        isUploaded: true
                    });
                }
            }
        }

        // 静态目录图片
        if (fs.existsSync(PUBLIC_DIR)) {
            for (const filename of fs.readdirSync(PUBLIC_DIR)) {
                if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filename)) {
                    const filePath = path.join(PUBLIC_DIR, filename);
                    const stats = fs.statSync(filePath);
                    if (stats.isFile()) {
                        files.push({
                            id: Buffer.from('public_' + filename).toString('base64'),
                            name: filename,
                            url: `/${encodeURIComponent(filename)}`,
                            size: stats.size,
                            modifiedAt: stats.mtime,
                            isUploaded: false
                        });
                    }
                }
            }
        }

        files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
        res.json({ success: true, files });
    } catch (error) {
        res.status(500).json({ success: false, error: '获取文件列表失败' });
    }
});

// 上传文件
app.post('/api/files/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: '请选择文件' });
    }
    const stats = fs.statSync(path.join(UPLOAD_DIR, req.file.filename));
    res.json({
        success: true,
        file: {
            id: Buffer.from(req.file.filename).toString('base64'),
            name: req.file.filename,
            url: `/uploads/${encodeURIComponent(req.file.filename)}`,
            size: stats.size,
            modifiedAt: stats.mtime,
            isUploaded: true
        }
    });
});

// 重命名文件
app.put('/api/files/:id/rename', (req, res) => {
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ success: false, error: '请提供新文件名' });

    const oldName = Buffer.from(req.params.id, 'base64').toString('utf8');
    if (oldName.startsWith('public_')) {
        return res.status(400).json({ success: false, error: '静态文件无法重命名' });
    }

    const oldPath = path.join(UPLOAD_DIR, oldName);
    const newPath = path.join(UPLOAD_DIR, newName);

    if (!fs.existsSync(oldPath)) return res.status(404).json({ success: false, error: '文件不存在' });
    if (fs.existsSync(newPath)) return res.status(400).json({ success: false, error: '文件名已存在' });

    fs.renameSync(oldPath, newPath);
    const stats = fs.statSync(newPath);

    res.json({
        success: true,
        file: {
            id: Buffer.from(newName).toString('base64'),
            name: newName,
            url: `/uploads/${encodeURIComponent(newName)}`,
            size: stats.size,
            modifiedAt: stats.mtime,
            isUploaded: true
        }
    });
});

// 删除文件
app.delete('/api/files/:id', (req, res) => {
    const filename = Buffer.from(req.params.id, 'base64').toString('utf8');
    if (filename.startsWith('public_')) {
        return res.status(400).json({ success: false, error: '静态文件无法删除' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: '文件不存在' });

    fs.unlinkSync(filePath);
    res.json({ success: true });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静态文件服务
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use(express.static(PUBLIC_DIR, { maxAge: '7d' }));

// SPA 回退
app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`ServerGuard 运行在端口 ${PORT}`);
});

// 强制垃圾回收（如果可用）
if (global.gc) {
    setInterval(() => global.gc(), 60000);
}
