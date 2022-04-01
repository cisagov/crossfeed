.PHONY: init plan apply

init:
	terraform init -backend-config=stage.config -input=false
plan:
	terraform plan -var-file=stage.tfvars -out plan
apply:
	terraform apply plan 
format:
	terraform validate && terraform fmt -recursive