
ROOT = $(shell pwd)

TERRA = $(AWS_VAULT_PREFIX) terraform
TERRAFLAGS = $(TF_FLAGS)
TERRAFORMDIR = $(ROOT)/defensedigitalservice-dev/crossfeed-${ENVIRONMENT}

ifeq ($(USE_AWS_VAULT),true)
  AWS_VAULT_PREFIX:=aws-vault exec ${AWS_PROFILE} --region us-east-1 --
endif

.PHONY: help
help: ## Print the help documentation
	@grep -E '^[\/a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: init plan apply

.PHONY: init
init: ## terraform init
	cd $(TERRAFORMDIR); $(TERRA) init $(TERRAFLAGS)

.PHONY: plan
plan: ## terraform plan
	cd $(TERRAFORMDIR); $(TERRA) plan $(TERRAFLAGS)

.PHONY: apply
apply: ## terraform apply
	cd $(TERRAFORMDIR); $(TERRA) apply $(TERRAFLAGS)

.PHONY: validate
validate: ## terraform validate
	cd $(TERRAFORMDIR); ${TERRA} validate

.PHONY: format
format: ## terraform format
	cd $(TERRAFORMDIR); ${TERRA} fmt -recursive