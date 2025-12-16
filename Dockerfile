# 使用 Node.js 作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 yarn.lock
COPY package.json yarn.lock* ./

# 安装依赖
RUN npm install

# 复制所有源代码
COPY . .

# 构建前端
RUN npm run build

# 创建上传目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动服务器
CMD ["node", "server.mjs"]
