# adventure-layer-bridge-backend deployment documentation

## Prerequisites

Before you begin, ensure your system has the following software installed:

- Node.js (recommended: latest LTS version)
- PM2

## Clone the Project

First, clone the project to your local machine:

```bash
git clone https://github.com/AdventureGoldDao/adventure-layer-bridge-backend.git
cd adventure-layer-bridge-backend
```

## Install Dependencies

In the project directory, run the following command to install all necessary dependencies:

```bash
npm install
```

## Configure Environment Variables

The project uses `dotenv` to manage environment variables. Create a `.env` file in the root directory of the project and configure the following variables as needed:

### Token and Chain Information Configuration

###  Layer 1 (L1) Configuration

```
# Example
L1_NAME=Sepolia Testnet  # Name of the L1 network
L1_WSS_URL=wss://sepolia.drpc.org  # WebSocket URL for L1
L1_RPC_URL=https://rpc.sepolia.org  # RPC URL for L1
# Enable or disable GraphQL query usage
L1_GRAPH_QUERY_USE=true  # Set to true to enable GraphQL queries
L1_GRAPH_QUERY_URL=https://api.studio.thegraph.com/query/76173/adventure-layer-dev/v1  # GraphQL query URL for L1
L1_CONTRACT_ADDRESS=  # Contract address on L1 
ERC20_TOKEN_ADDRESS=  # ERC20 token contract address 
L1_OWNER_ADDRESS=  # Owner's address 
L1_OWNER_PRIVATE_KEY=  # Owner's private key 
```

### How to deploy the contracts

To deploy the L1 contracts, please refer to the scripts available in the following repository: https://github.com/AdventureGoldDao/adventure-layer-scripts/tree/fourth-delivery/agld

#### how to use GraphQL 

```
npm install -g @graphprotocol/graph-cli@latest

yarn global add @graphprotocol/graph-cli

# --from-contract  Bridge contract address 0xfdf38b612aadb51042575a5f7aecf2e376ee4647

graph init --studio adventure --network sepolia --from-contract 0xfdf38b612aadb51042575a5f7aecf2e376ee4647 --abi=./L1Bridge.json

 ›   Warning: In next major version, this flag will be removed. By default we will deploy to the Graph Studio. Learn more about Sunrise of Decentralized Data
 ›   https://thegraph.com/blog/unveiling-updated-sunrise-decentralized-data/
 ›   Warning: In next major version, this flag will be removed. By default we will deploy to the Graph Studio. Learn more about Sunrise of Decentralized Data
 ›   https://thegraph.com/blog/unveiling-updated-sunrise-decentralized-data/
 ›   Warning: In next major version, this flag will be removed. By default we will stop initializing a Git repository.
✔ Protocol · ethereum
✔ Subgraph slug · monitor-new-deposit-contract
✔ Directory to create the subgraph in · monitor-new-deposit-contract
✔ Contract address · 0xfdf38b612aadb51042575a5f7aecf2e376ee4647
✔ Start Block · 0
✔ Contract Name · L1Bridge
✔ Index contract events as entities (Y/n) · true
  Generate subgraph
  Write subgraph to directory
✔ Create subgraph scaffold
✔ Initialize networks config
✔ Initialize subgraph repository
✔ Install dependencies with yarn
✔ Generate ABI and schema types with yarn codegen
Add another contract? (y/n):

Next steps:

  1. Run `graph auth` to authenticate with your deploy key.

  2. Type `cd adventure` to enter the subgraph.

  3. Run `yarn deploy` to deploy the subgraph.

Make sure to visit the documentation on https://thegraph.com/docs/ for further information.

-- Find it here https://thegraph.com/studio/subgraph/adventure/
graph auth --studio 84e15f4e43e585374f3f3562f0f327ca

 ›   Warning: In next major version, this flag will be removed. By default we will deploy to the Graph Studio. Learn more about Sunrise of Decentralized Data
 ›   https://thegraph.com/blog/unveiling-updated-sunrise-decentralized-data/
Deploy key set for https://api.studio.thegraph.com/deploy/
ubuntu@ip-172-31-29-224:~/graph-node$ cd adventure/
ubuntu@ip-172-31-29-224:~/graph-node/adventure$ yarn deploy
yarn run v1.22.22
$ graph deploy --node https://api.studio.thegraph.com/deploy/ adventure
Which version label to use? (e.g. "v0.0.1"): v0.0.1
  Skip migration: Bump mapping apiVersion from 0.0.1 to 0.0.2
  Skip migration: Bump mapping apiVersion from 0.0.2 to 0.0.3
  Skip migration: Bump mapping apiVersion from 0.0.3 to 0.0.4
  Skip migration: Bump mapping apiVersion from 0.0.4 to 0.0.5
  Skip migration: Bump mapping apiVersion from 0.0.5 to 0.0.6
  Skip migration: Bump manifest specVersion from 0.0.1 to 0.0.2
  Skip migration: Bump manifest specVersion from 0.0.2 to 0.0.4
✔ Apply migrations
✔ Load subgraph from subgraph.yaml
  Compile data source: L1Bridge => build/L1Bridge/L1Bridge.wasm
✔ Compile subgraph
  Copy schema file build/schema.graphql
  Write subgraph file build/L1Bridge/L1Bridge.json
  Write subgraph manifest build/subgraph.yaml
✔ Write compiled subgraph to build/
  Add file to IPFS build/schema.graphql
                .. QmRzcQt8Wxu9hjB2hCsjrNAWSgwHMprG4WSeeBgVAqcKxA
  Add file to IPFS build/L1Bridge/L1Bridge.json
                .. QmP9x7GHSWFMpinNcauAsrCav8otFPEH8Qy7JU2tXpExSK
  Add file to IPFS build/L1Bridge/L1Bridge.wasm
                .. QmYy4A6kuDMa6NrPPrh7oviT48r8pTfZon8gEN4fF8gRkG
✔ Upload subgraph to IPFS

Build completed: QmSNePAUzQ85MGBaD2BEHiHDLagmcUPvP99ML7Qb57EJ7P

Deployed to https://thegraph.com/studio/subgraph/adventure

Subgraph endpoints:
Queries (HTTP):     https://api.studio.thegraph.com/query/89398/adventure/v0.0.1

Done in 18.56s.

```

###  Layer 2 (L2) Configuration

```
L2_NAME=Adventure Layer devnet  # Name of the L2 network
L2_RPC_URL=https://rpc-devnet.adventurelayer.xyz  # RPC URL for L2
L2_WSS_URL=wss://rpc-devnet.adventurelayer.xyz  # WebSocket URL for L2
L2_CONTRACT_ADDRESS=  # Contract address on L2 to L1
L2_TO_SHARD1_CONTRACT_ADDRESS=  # L2 to shard 1 contract address
L2_OWNER_ADDRESS=  # Owner's address
L2_OWNER_PRIVATE_KEY=  # Owner's private key
```

### Shard 1 Configuration

```
SHARD1_NAME=shard1  # Name of the first shard
SHARD1_RPC_URL=https://rpc-devnet.adventurelayer.xyz/node1/shard  # RPC URL for shard 1
SHARD1_WSS_URL=wss://rpc-devnet.adventurelayer.xyz/node1/shard  # WebSocket URL for shard 1
# shard1 contract 
SHARD1_CONTRACT_ADDRESS=  # Contract address on shard 1
SHARD1_OWNER_ADDRESS=  # Owner's address
SHARD1_OWNER_PRIVATE_KEY=  # Owner's private key

```

### Database Configuration

```
# Example
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase
```

Make sure to update these variables according to your database configuration.

## Run the Project

After configuring the environment variables, you can run the project using the following command:

```bash
pm2 start .\listen_service\server.js --name bridge-backend
```

## Check Service Start Successfully
1) check the listening port
2) check the error or warning log

## Run Tests

The project uses `mocha` as the testing framework. Ensure you add `mocha` and `chai` as development dependencies in your `package.json`:

```bash
npm install mocha chai --save-dev
```

Then, you can run the tests using:

```bash
npx mocha test/db_utils.test.js
```

## Log Management

The project uses `winston-daily-rotate-file` for log management. Ensure you correctly set the log path and level in the configuration file.

## Additional Notes

- Ensure the database service is up and running.
- Adjust other configuration files in the project as needed.
