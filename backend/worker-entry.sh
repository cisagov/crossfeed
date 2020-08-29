# Sets up a transparent proxy using mitmproxy. We run the proxy as the user mitmproxyuser,
# so that all requests from mitmproxyuser are sent to the Internet and requests from all
# other users are sent through the proxy.
# See https://docs.mitmproxy.org/stable/howto-transparent/ for more information on this approach.
# 
# In order to modify iptables, the Docker container must be run with the NET_ADMIN
# capability (docker run --cap-add=NET_ADMIN -t crossfeed-worker).

useradd --create-home mitmproxyuser

iptables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 80 -j REDIRECT --to-port 8080
iptables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 443 -j REDIRECT --to-port 8080
ip6tables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 80 -j REDIRECT --to-port 8080
ip6tables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 443 -j REDIRECT --to-port 8080

pm2 start --interpreter none sudo -- -u mitmproxyuser -H bash -c 'mitmdump --mode transparent --showhost --set block_global=false --modify-headers /~q/User-Agent/example.org'

wait-port 8080

# Install the mitmproxy SSL certificate so that HTTPS connections can be proxied.
cp /home/mitmproxyuser/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
update-ca-certificates --fresh

curl https://webhook.site/8c99302a-a063-4c8b-9c0b-0ef000485d76

pm2 stop all

# Code for an explicit proxy, if needed.

# pm2 start --interpreter none mitmdump -- --modify-headers /~q/User-Agent/example.org
# wait-port 8080
# cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
# update-ca-certificates --fresh

# curl --proxy localhost:8000 https://webhook.site/8c99302a-a063-4c8b-9c0b-0ef000485d76
# pm2 stop all