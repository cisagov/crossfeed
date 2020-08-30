# Sets up a transparent proxy using mitmproxy. We run the proxy as the user mitmproxyuser,
# so that all requests from mitmproxyuser are sent to the Internet and requests from all
# other users are sent through the proxy.
# See https://docs.mitmproxy.org/stable/howto-transparent/ for more information on this approach.
# 
# In order to modify iptables, the Docker container must be run with the NET_ADMIN
# capability (docker run --cap-add=NET_ADMIN -t crossfeed-worker).

set -e

useradd --create-home mitmproxyuser

PROXY_PORT=8080

iptables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 80 -j REDIRECT --to-port $PROXY_PORT
iptables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 443 -j REDIRECT --to-port $PROXY_PORT
ip6tables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 80 -j REDIRECT --to-port $PROXY_PORT
ip6tables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 443 -j REDIRECT --to-port $PROXY_PORT

# Reduce some long and unnecessary tabular output from pm2 with grep
pm2 start --interpreter none --error ~/pm2-error.log sudo -- -Eu mitmproxyuser -H bash -c "mitmdump --mode transparent --showhost --set block_global=false -s worker/mitmproxy-sign-requests.py --listen-port $PROXY_PORT" | grep "^\[PM2\]"

wait-port $PROXY_PORT -t 5000 || cat ~/pm2-error.log

# Install the mitmproxy SSL certificate so that HTTPS connections can be proxied.
cp /home/mitmproxyuser/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
update-ca-certificates --fresh

# Required for node.js to trust our mitmproxy self-signed cert
export NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/mitmproxy-ca-cert.crt

# Main code
echo "Running main code..."

node --unhandled-rejections=strict worker.bundle.js || cat ~/pm2-error.log

pm2 stop all | grep "^\[PM2\]"

echo "Printing pm2 error logs (if available):"

cat ~/pm2-error.log

echo "Done"