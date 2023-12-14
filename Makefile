.PHONY: build help

help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: package.json ## install dependencies
	@if [ "$(CI)" != "true" ]; then \
		echo "Full install..."; \
		yarn; \
	fi
	@if [ "$(CI)" = "true" ]; then \
		echo "Frozen install..."; \
		yarn --frozen-lockfile; \
	fi

build-ra-keycloak:
	@echo "Transpiling ra-keycloak files...";
	@cd ./packages/ra-keycloak && yarn -s build

build-demo:
	@echo "Transpiling demo files...";
	@cd ./packages/demo && yarn -s build

build: build-ra-keycloak build-demo ## compile ES6 files to JS

lint: ## lint the code and check coding conventions
	@echo "Running linter..."
	@yarn -s lint

prettier: ## prettify the source code using prettier
	@echo "Running prettier..."
	@yarn -s prettier

test: build test-unit lint ## launch all tests

test-unit: ## launch unit tests
	echo "Running unit tests...";
	yarn -s test-unit;

run-demo:
	@cd ./packages/demo && yarn start

run: keycloak-start run-demo

DOCKER_COMPOSE = docker-compose -p ra-keycloak -f ./packages/demo/docker-compose.yml

keycloak-start: ## Start the project with docker.
	$(DOCKER_COMPOSE) up --force-recreate -d

keycloak-logs: ## Display logs
	$(DOCKER_COMPOSE) logs -f

keycloak-stop: ## Stop the project with docker.
	$(DOCKER_COMPOSE) down

DOCKER_COMPOSE_LEGACY = docker-compose -p ra-keycloak-legacy -f ./packages/demo/docker-compose-legacy.yml

keycloak-start-legacy: ## Start the legacy project with docker.
	$(DOCKER_COMPOSE_LEGACY) up --force-recreate -d

keycloak-logs-legacy: ## Display logs for the legacy project
	$(DOCKER_COMPOSE_LEGACY) logs -f

keycloak-stop-legacy: ## Stop the legacy project with docker.
	$(DOCKER_COMPOSE_LEGACY) down