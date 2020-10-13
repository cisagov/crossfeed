# Fixes the trusted_hosts issue to allow Matomo to run on a custom port locally, as
# a workaround for https://github.com/matomo-org/matomo/issues/9549.
# Run this after initially setting up Matomo through the UI.
docker-compose exec matomo sed -i 's/"localhost"/"localhost:3000"/g' /var/www/html/config/config.ini.php