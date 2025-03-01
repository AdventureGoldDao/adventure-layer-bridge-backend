# Deployment Documentation

## Prerequisites

Before you begin, ensure your system has the following software installed:

- Node.js (recommended: latest LTS version)
- npm (Node.js package manager, typically installed with Node.js)

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
node .\listen_service\server.js
```

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
