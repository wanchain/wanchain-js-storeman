#!/bin/bash

function use() {
        echo "========================"
        echo "./init.sh storemanWanAddr storemanEthAddr"
        echo "To start storeman agent at the first time, you need to input storemanWanAddr storemanEthAddr as paras"
        echo "When there is no init action, the agent will started with existed config."
        echo "========================"
}

if [[ $# == 2 ]]
	then
		NODE_PATH=. node initConfig.js $1 $2
else
    use
    exit
fi
