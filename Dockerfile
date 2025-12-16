# 使用更小的 Alpine 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 只复制必要的文件
COPY package.json ./

# 安装依赖（只安装生产依赖 + 构建依赖）
RUN npm install --production=false

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 清理不必要的文件减少镜像大小
RUN rm -rf node_modules && \
    npm install --production && \
    npm cache clean --force

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 使用 Node.js 内存限制启动
CMD ["node", "--max-old-space-size=32", "--expose-gc", "server.mjs"]
