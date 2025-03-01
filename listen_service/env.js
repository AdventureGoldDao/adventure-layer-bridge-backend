require('dotenv').config();

// Configuration management
const chainConfig = {

  mock_transactions: process.env.MOCK_TRANSACTIONS,

  // L1 configuration
  l1_name: process.env.L1_NAME,
  l1_wss_url: process.env.L1_WSS_URL,
  l1_rpc_url: process.env.L1_RPC_URL,
  l1_graph_query_url: process.env.L1_GRAPH_QUERY_URL,

  erc20_token_address: process.env.ERC20_TOKEN_ADDRESS,
  l1_contract_address: process.env.L1_CONTRACT_ADDRESS,
  l1_owner_address: process.env.L1_OWNER_ADDRESS,
  l1_owner_private_key: process.env.L1_OWNER_PRIVATE_KEY,

  // L2 configuration
  l2_name: process.env.L2_NAME,
  l2_rpc_url: process.env.L2_RPC_URL,
  l2_wss_url: process.env.L2_WSS_URL,
  l2_contract_address: process.env.L2_CONTRACT_ADDRESS,
  l2_owner_address: process.env.L2_OWNER_ADDRESS,
  l2_owner_private_key: process.env.L2_OWNER_PRIVATE_KEY,

  // Shard1 configuration
  shard1_name: process.env.SHARD1_NAME,
  shard1_rpc_url: process.env.SHARD1_RPC_URL,
  shard1_wss_url: process.env.SHARD1_WSS_URL,
  shard1_contract_address: process.env.SHARD1_CONTRACT_ADDRESS,
  l2_to_shard1_contract_address: process.env.L2_TO_SHARD1_CONTRACT_ADDRESS,
  shard1_owner_address: process.env.SHARD1_OWNER_ADDRESS,
  shard1_owner_private_key: process.env.SHARD1_OWNER_PRIVATE_KEY,

  // Shard2 configuration
  shard2_name: process.env.SHARD2_NAME,
  shard2_contract_address: process.env.SHARD2_CONTRACT_ADDRESS,
  l2_to_shard2_contract_address: process.env.L2_TO_SHARD2_CONTRACT_ADDRESS,
  shard2_rpc_url: process.env.SHARD2_RPC_URL,
  shard2_wss_url: process.env.SHARD2_WSS_URL,
};

// MySQL configuration
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// Logging configuration
const logConfig = {
  errorFilename: process.env.LOG_ERROR_FILENAME,
  combinedFilename: process.env.LOG_COMBINED_FILENAME,
  maxFiles: process.env.LOG_MAX_FILES,
};

module.exports = {
  chainConfig,
  dbConfig,
  logConfig 
}; 