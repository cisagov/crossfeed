The **red** deployment setup is meant for environments in which public access is not available (such as the [COOL](https://github.com/cisagov/cool-system)). In this case, we do not use
API Gateway or Cloudfront to handle the backend / frontend. Rather, each user needs to spin up a lightweight instance of
the frontend / backend on their AWS machine. Note that all the scanning and accessing the database is still done via AWS lambda / AWS ECS. The user runs the following on their machine:

- Frontend: Static React code
- Backend: Express server that handles all routes by invoking the `crossfeed-prod-api` lambda function.

### Setup

At the moment, you can set up by logging into an AWS instance that has access to invoke the Crossfeed lambda functions. Then run the following:

```
git clone https://github.com/cisagov/crossfeed.git
cd crossfeed
git checkout red
npm run red
```

You can then open up `http://localhost` in your browser to see Crossfeed running.

### Architecture

(Architecture diagram coming soon.)
