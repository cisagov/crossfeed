.PHONY: init plan apply

init:
	dotenv -- terraform init -backend-config=stage.config -input=false
plan:
	dotenv -- terraform plan -var-file=stage.tfvars -out plan
apply:
	dotenv -- terraform apply plan 