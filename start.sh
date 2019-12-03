#!/bin/bash

# function use() {
#         echo "========================"
#         echo "./start.sh [--testnet]"
#         echo "========================"
# }

# if [[ $# == 0 ]] || [[ $# == 1 ]]
# 	then
# 		NODE_PATH=. node app.js $1
# else
#     use
#     exit
# fi

NODE_PATH=. node app.js $@