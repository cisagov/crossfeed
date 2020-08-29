# Transparent proxy

iptables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 80 -j REDIRECT --to-port 8080
iptables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 443 -j REDIRECT --to-port 8080
ip6tables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 80 -j REDIRECT --to-port 8080
ip6tables-legacy -t nat -A OUTPUT -p tcp -m owner ! --uid-owner mitmproxyuser --dport 443 -j REDIRECT --to-port 8080

pm2 start --interpreter none sudo -- -u mitmproxyuser -H bash -c 'mitmdump --mode transparent --showhost --set block_global=false --modify-headers /~q/User-Agent/example.org'

wait-port 8080
cp /home/mitmproxyuser/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
update-ca-certificates --fresh

curl https://webhook.site/8c99302a-a063-4c8b-9c0b-0ef000485d76

pm2 stop all


# Explicit proxy
# pm2 start --interpreter none mitmdump -- --modify-headers /~q/User-Agent/example.org
# wait-port 8080
# cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
# update-ca-certificates --fresh

# curl --proxy localhost:8000 https://webhook.site/8c99302a-a063-4c8b-9c0b-0ef000485d76
# pm2 stop all