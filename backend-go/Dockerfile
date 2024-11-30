FROM golang:1.23-alpine

WORKDIR /app

# 复制 go.mod 和 go.sum 文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 编译
RUN go build -o main .

EXPOSE 3000 8081

CMD ["./main"]