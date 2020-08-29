pm2 start mitmdump --interpreter none
wait-port 8080
cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
update-ca-certificates --fresh

curl https://www.google.com

# curl https://webhook.site/8c99302a-a063-4c8b-9c0b-0ef000485d76 ; pm2 logs mitmdump