The **red** deployment setup is meant for environments in which public access is not available (such as the [COOL](https://github.com/cisagov/cool-system)). In this case, we do not use
API Gateway or Cloudfront to handle the backend / frontend. Rather, each user needs to spin up a lightweight instance of
the frontend / backend on their AWS machine. Note that all the scanning and accessing the database is still done via AWS lambda / AWS ECS.

The user builds and runs the following Docker containers on their AWS machine:

- Frontend: Static React code
- Backend: Express server that handles all routes by invoking the `crossfeed-prod-api` lambda function.

### Setup / install Docker

```bash
sudo apt-get install -y git chromium-browser
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo groupadd docker
sudo usermod -aG docker $USER

sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```


### Initial setup

At the moment, you can set up by logging into an AWS instance that has access to access the Crossfeed AWS environment (such as the terraformer instance in the COOL). Then run the following:

```
git clone https://github.com/cisagov/crossfeed.git
cd crossfeed
git checkout red
npm run build-red
npm run red
```

You can then open up `http://localhost` in your browser to see Crossfeed running.

### Updating to latest code

The steps for updating Crossfeed Red are the following:

1. Merge the latest changes from `master` into the `red` branch; you can make a PR on GitHub from master -> red then merge with a merge commit to do so.
1. In the terraformer instance, run:
  ```
  git pull origin red
  npm run deploy-red
  npm run red
  ```

### Architecture

(Architecture diagram coming soon.)
