# Sets up an explicit proxy using mitmproxy.

set -e

PROXY_PORT=8080

# Reduce some long and unnecessary tabular output from pm2 with grep
pm2 start --interpreter none --error ~/pm2-error.log mitmdump -- -s worker/mitmproxy_sign_requests.py --set stream_large_bodies=1 --listen-port $PROXY_PORT | grep "^\[PM2\]"

wait-port $PROXY_PORT -t 5000 || pm2 logs

sleep 1

# Install the mitmproxy SSL certificate so that HTTPS connections can be proxied.
cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
update-ca-certificates --fresh

# Required for node.js to trust our mitmproxy self-signed cert
export NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
export AWS_CA_BUNDLE=/usr/local/share/ca-certificates/mitmproxy-ca-cert.crt

# Main code
echo "Running main code..."

timeout 1d node --unhandled-rejections=strict worker.bundle.js

pm2 stop all | grep "^\[PM2\]"

echo "Printing pm2 error logs (if available):"

cat ~/pm2-error.log

echo "Done"