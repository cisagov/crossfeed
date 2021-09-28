# P&E database setup instructions

To run the P&E database setup script locally, first run Crossfeed with `npm start`. Then run:

```
cd backend
npm run pesyncdb
```

On production, go to the terraformer instance and run:

```
aws lambda invoke --function-name crossfeed-staging-pesyncdb --region us-east-1 /dev/stdout
```
