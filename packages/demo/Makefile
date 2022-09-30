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

run:
	yarn start


DOCKER_COMPOSE = docker-compose -p ra-keycloak -f docker-compose.yml

start: ## Start the project with docker.
	$(DOCKER_COMPOSE) up --force-recreate -d

logs: ## Display logs
	$(DOCKER_COMPOSE) logs -f

stop: ## Stop the project with docker.
	$(DOCKER_COMPOSE) down