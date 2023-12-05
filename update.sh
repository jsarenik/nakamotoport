#!/bin/sh
rm realtime_btc
wget https://nakamotoportfolio.com/realtime_btc
git commit -a -m "update realtime_btc"
