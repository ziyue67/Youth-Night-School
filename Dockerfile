# --- 阶段 1: 构建阶段 ---
# 使用一个包含 Node.js 和 npm/yarn 的完整镜像来构建项目
FROM node:16 AS build-stage

WORKDIR /app

# 复制 package.json 和 lock 文件，安装所有依赖（包括 devDependencies）
COPY package*.json ./
RUN npm install

# 复制所有源代码
COPY . .

# 执行构建命令（请根据你的 package.json 中的 scripts 配置修改）
# 通常是 "build"
RUN npm run build

# --- 阶段 2: 运行阶段 ---
# 使用轻量的 alpine 镜像来运行最终的应用
FROM node:16-alpine AS production-stage

# 同样，先解决证书问题
RUN apk add --no-cache ca-certificates

WORKDIR /app

# 从构建阶段复制 package.json 和 lock 文件
# 只安装生产环境依赖（--production）
COPY package*.json ./
RUN npm install --production

# 从构建阶段复制编译好的静态文件到当前镜像的 /app/dist 目录
COPY --from=build-stage /app/dist ./dist

EXPOSE 3000

# 启动命令：使用一个简单的 Node.js 服务器来托管 dist 目录下的文件
# 这里我们使用 `serve` 这个包，你需要先在 package.json 的 dependencies 中添加它
# npm install serve --save
# CMD ["npx", "serve", "dist", "-l", "3000"]

# 或者，如果你在 package.json 中配置了 start 脚本，例如 "start": "serve dist -l 3000"
CMD ["npm", "start"]