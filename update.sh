#!/bin/sh
rm realtime_btc
rm api/time-to-halving
wget https://nakamotoportfolio.com/realtime_btc
cd api
wget https://nakamotoportfolio.com/api/time-to-halving
cd -
git commit -a -m "update realtime_btc"
git push
