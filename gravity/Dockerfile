# 使用支持 ARM64 架构的 Golang 1.21 官方镜像（基于 Debian）
FROM --platform=linux/arm64 golang:1.21-bullseye AS builder

WORKDIR /go/src/github.com/moiot/gravity

# 安装必要的依赖（不需要 gcc 和 libc-dev）
RUN apt-get update && apt-get install -y \
    git \
    make \
    bash \
    ca-certificates

# 拉取指定版本的 Gravity 源码（使用稳定版本）
RUN git clone https://github.com/moiot/gravity.git . && \
    git checkout master

# 设置 Go 环境变量，禁用 CGO
ENV GO111MODULE=on
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=arm64

# 下载依赖
RUN go mod tidy

# 构建 Gravity
RUN make build

# 使用轻量级的 Debian Slim 镜像作为运行环境
FROM --platform=linux/arm64 debian:bullseye-slim

WORKDIR /app

# 安装必要的运行时依赖
RUN apt-get update && apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 从构建阶段复制 Gravity 可执行文件
COPY --from=builder /go/src/github.com/moiot/gravity/bin/gravity .

# 复制配置文件
COPY config.toml .

# 设置默认的启动命令
CMD ["./gravity", "-config=/app/config.toml"]