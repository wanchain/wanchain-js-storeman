#!/bin/bash

function use() {
        echo "========================"
        echo "./init.sh chainSymbol storemanWanAddr storemanOriAddr [--testnet]"
        echo "To start storeman agent at the first time, you need to input chainSymbol, storemanWanAddr storemanOriAddr as paras"
        echo "When there is no init action, the agent will started with existed config."
        echo "========================"
}

if [[ $# == 4 ]] || [[ $# == 5 ]]
	then
		NODE_PATH=. node debug initConfig.js $1 $2 $3 $4 $5
else
    use
    exit
fi
