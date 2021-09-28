set -e

# Infrastructure
cd infrastructure
terraform init -backend-config=prod.config -input=false
terraform fmt -recursive -check -diff
terraform validate
terraform apply -var-file=prod.tfvars
cd ..
# Worker
cd backend
npm i
npm run deploy-worker-prod
# Backend
npx sls deploy --stage=prod
cd ..
# Frontend
docker-compose -f docker-compose.red.yml build --parallel
