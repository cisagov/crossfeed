docker-compose down --volumes --rmi all
cd backend && npm run build-worker && cd .. && npm start
cd backend && npm run syncdb && npm run syncdb -- -d populate