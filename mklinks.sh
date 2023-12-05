#!/bin/sh

a="/$0"; a=${a%/*}; a=${a:-.}; a=${a#/}/; HERE=$(cd $a; pwd)
cd $HERE
find -name "*.html" | cut -b3- | while read f;
do ln $f ${f%%.html}; done
