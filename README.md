# wanchain-js-storeman

### Utility for supporting cross-chain transactions on the Wanchain network
The agent monitors the cross-chain transaction of wallet, and accomplishes the buddy transactions.

## Install
Use NPM or Yarn to install the library:

```bash
npm install
```

You also need to install mongodb first.
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

## Configure
If you have already registered the storemanGroup on Wanchain cross-chain HTLC, you can initialize the storeman agent with the storemanWanAddr and storemanEthAddr.
```javascript

// config the testnet or mainnet in moduleConfig.js
const testnet = true; 

// configure with valid node urls in config.json, take mainnet as an example
{
  "main": {
    "ethWeb3Url": "http://localhost:18545",
    "wanWeb3Url": "http://localhost:8545",
    "mpcUrl": "http://localhost:8545",
  }
};

```
Then you can use follow commands to initialize the storeman agent. Plz replace the exactly address to storemanWanAddr and storemanEthAddr.
```bash
./init.sh storemanWanAddr storemanEthAddr
```
And you can check the detail config info in the config.json file, which chains and what tokens are been supported for cross-chain transaction that the storemanGroup is in charge of.

## Basic Usage
You can directly start the agent via start.sh.
```bash
./start.sh
```
