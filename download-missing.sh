#!/bin/sh

. ./conf
URL=https://${D:-huntingsats.com}

trap exit INT QUIT

myget() {
  OUT=$1
  echo $OUT | grep -q '/$' && {
    OUT=${OUT}index.html
    mkdir -p ${OUT%/*}
  }
  echo $OUT | grep -q '/' && {
    #OUT=${OUT}index.html
    mkdir -p ${OUT%/*}
  }
  wget -c -O $OUT $URL/$1
}

while true
do
  echo Running again at $MYURL
timeout 6 ./run-site.sh 2>&1 | grep -B1 "response:404" | grep url: \
  | cut -d/ -f2- \
  | while read a; do myget $a; done
  echo sleep 1
  sleep 1
done
