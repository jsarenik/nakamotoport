#!/bin/sh
rm realtime_btc
wget https://nakamotoportfolio.com/realtime_btc
orig=$(jq .btc_usd < realtime_btc)
double=$(echo "$orig * 2" | bc)
dec=$(echo "${double#*.}/3" | bc)
echo $orig $double

cat > realtime_btc <<EOF
{"cross": "\$", "fx_rate": 1, "btc_usd": $double, "btc_24h_percentage_change": 80.$dec, "btc_fx": $double}
EOF

git commit -a -m "update realtime_btc with fake values"
