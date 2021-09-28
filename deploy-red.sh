set -e

# Infrastructure
cd infrastructure && terraform init -backend-config=prod.config -input=false && terraform fmt -recursive -check -diff && terraform validate && terraform apply -var-file=prod.tfvars

# Worker
cd backend && npm run deploy-worker-prod

# Backend
cd backend && npm i && npx sls deploy --stage=prod

# Frontend
docker-compose -f docker-compose.red.yml build --parallel
