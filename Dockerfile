FROM golang:alpine AS base

WORKDIR /app
RUN apk add --no-cache git \
  && go install github.com/air-verse/air@latest
COPY go.mod go.sum ./
RUN go mod download
COPY . .
EXPOSE 8080
# Default command runs air (dev mode)
CMD ["air"]
