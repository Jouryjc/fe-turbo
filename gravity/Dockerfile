# 使用支持 ARM64 架构的 Golang 1.21 Alpine 镜像作为构建环境
FROM --platform=linux/arm64 golang:1.21-alpine AS builder

WORKDIR /go/src/github.com/moiot/gravity

# 安装 build-base，包含所有必要的构建工具
RUN apk add --no-cache git make bash build-base

# 拉取指定版本的 Gravity 源码（使用稳定版本）
RUN git clone https://github.com/moiot/gravity.git . && \
    git checkout master

# 设置 Go 环境变量
ENV GO111MODULE=on
ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=arm64

# 下载依赖
RUN go mod tidy

# 构建 Gravity
RUN make

# 使用轻量级的 Alpine 镜像作为运行环境
FROM alpine:latest

WORKDIR /app

# 安装必要的运行时依赖
RUN apk add --no-cache ca-certificates

# 从构建阶段复制 Gravity 可执行文件
COPY --from=builder /go/src/github.com/moiot/gravity/bin/gravity .

# 复制配置文件
COPY config.yaml .

# 设置默认的启动命令
CMD ["./gravity", "-config=config.yaml"]