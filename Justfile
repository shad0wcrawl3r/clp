#!/usr/bin/env -S just --justfile
set shell := ["bash", "-cu"]
set dotenv-filename := ".env"
set dotenv-load := true


MIGRATIONS := "./sql/migrations"

DB_USER := env("CLP_POSTGRES_USER", "postgres")
DB_PASSWORD := env("CLP_POSTGRES_PASSWORD", "postgres")
DB_HOST := env("CLP_POSTGRES_HOST", "localhost")
DB_PORT := env("CLP_POSTGRES_PORT", "5432")
DB_NAME := env("CLP_POSTGRES_DB", "postgres")
DB_SSLMODE := env("CLP_POSTGRES_SSLMODE", "disable")

defaultMigrateAction := "up"

default:
  just --list

run:
    reflex -s -- go run .

[arg("args",pattern="up|down|version|force|\\d+")]
migrate *args:
  migrate -path {{MIGRATIONS}} -database "postgres://{{DB_USER}}:{{DB_PASSWORD}}@{{DB_HOST}}:{{DB_PORT}}/{{DB_NAME}}?sslmode={{DB_SSLMODE}}" {{args}}
[arg("args",pattern="up|down|ps|-d")]
compose *args:
  docker compose {{args}}
sqlc:
  sqlc generate
swag:
  swag init -g main.go --output docs --parseDependency

frontend-dev:
    cd frontend && yarn dev

frontend-build:
    cd frontend && yarn build
