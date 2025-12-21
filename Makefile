.DEFAULT_GOAL := help

# Docker Compose command (space含みOK)
DC ?= docker compose

.PHONY: help
help: ## 使えるターゲット一覧を表示
	@awk 'BEGIN {FS = ":.*##"; print "Usage: make <target>\n"; print "Targets:"} /^[a-zA-Z0-9_\\-]+:.*##/ {printf "  %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: up
up: ## 開発環境を起動（フォアグラウンド）
	@$(DC) up --build

.PHONY: up-d
up-d: ## 開発環境を起動（バックグラウンド）
	@$(DC) up -d --build

.PHONY: down
down: ## 開発環境を停止（ボリュームは残す）
	@$(DC) down

.PHONY: ps
ps: ## サービス状態を表示
	@$(DC) ps

.PHONY: logs
logs: ## ログを追尾（web/prism）
	@$(DC) logs -f web prism

.PHONY: web-sh
web-sh: ## webコンテナに入る（sh）
	@$(DC) exec web sh

.PHONY: install
install: ## 依存解決（コンテナ内 / lockは固定）
	@$(DC) run --rm web pnpm install --frozen-lockfile

.PHONY: build
build: ## Next.js build（コンテナ内）
	@$(DC) run --rm -e NODE_ENV=production web pnpm build

.PHONY: lint
lint: ## ESLint（コンテナ内）
	@$(DC) run --rm web pnpm lint

.PHONY: type-check
type-check: ## TypeScript型チェック（コンテナ内）
	@$(DC) run --rm web pnpm type-check

.PHONY: prism
prism: ## Prismだけ起動
	@$(DC) up -d prism

.PHONY: reset
reset: ## 停止 + ボリューム削除（node_modules/next_cache等も消える）
	@$(DC) down -v


