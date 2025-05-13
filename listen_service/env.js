require('dotenv').config();

// Configuration management
const chainConfig = {

  mock_transactions: process.env.MOCK_TRANSACTIONS,
  rpc_max_block_range: process.env.RPC_MAX_BLOCK_RANGE || 8000 ,



  // L1 configuration
  l1_name: process.env.L1_NAME,
  l1_wss_url: process.env.L1_WSS_URL,
  l1_rpc_url: process.env.L1_RPC_URL,
  l1_graph_query_use: process.env.L1_GRAPH_QUERY_USE,
  l1_graph_query_url: process.env.L1_GRAPH_QUERY_URL,
  l1_block_delay: process.env.L1_BLOCK_DELAY || 12, // The reasonable default value for Ethereum is 12 blocks
  // Fee configuration for L1
  l1_max_priority_fee_gwei: process.env.L1_MAX_PRIORITY_FEE_GWEI || '1',
  l1_base_fee_multiplier: process.env.L1_BASE_FEE_MULTIPLIER || '1.5',
  l1_max_total_fee: process.env.L1_MAX_TOTAL_FEE || '1000000000000000000', // 1 ETH in wei
  
  
  erc20_token_address: process.env.ERC20_TOKEN_ADDRESS,
  l1_contract_address: process.env.L1_CONTRACT_ADDRESS,
  l1_owner_address: process.env.L1_OWNER_ADDRESS,
  l1_owner_private_key: process.env.L1_OWNER_PRIVATE_KEY,

  //

  // L2 configuration
  l2_name: process.env.L2_NAME,
  l2_rpc_url: process.env.L2_RPC_URL,
  l2_wss_url: process.env.L2_WSS_URL,
  l2_contract_address: process.env.L2_CONTRACT_ADDRESS,
  l2_owner_address: process.env.L2_OWNER_ADDRESS,
  l2_owner_private_key: process.env.L2_OWNER_PRIVATE_KEY,
  l2_block_delay: process.env.L2_BLOCK_DELAY || 0, // Set an appropriate value based on the characteristics of the L2 chain

  // Fee configuration for L2
  l2_max_priority_fee_gwei: process.env.L2_MAX_PRIORITY_FEE_GWEI || '2',
  l2_base_fee_multiplier: process.env.L2_BASE_FEE_MULTIPLIER || '2',
  l2_max_total_fee: process.env.L2_MAX_TOTAL_FEE || '1000000000000000000', // 1 ETH in wei
  
};

for (let i = 1; i <= 10; i++) {
  chainConfig[`shard${i}_name`] = process.env[`SHARD${i}_NAME`];
  if(chainConfig[`shard${i}_name`] == undefined) {
    break;
  }
  chainConfig[`shard${i}_rpc_url`] = process.env[`SHARD${i}_RPC_URL`];
  chainConfig[`shard${i}_wss_url`] = process.env[`SHARD${i}_WSS_URL`];
  chainConfig[`shard${i}_contract_address`] = process.env[`SHARD${i}_CONTRACT_ADDRESS`];
  chainConfig[`l2_to_shard${i}_contract_address`] = process.env[`L2_TO_SHARD${i}_CONTRACT_ADDRESS`];
  chainConfig[`shard${i}_owner_address`] = process.env[`SHARD${i}_OWNER_ADDRESS`];
  chainConfig[`shard${i}_owner_private_key`] = process.env[`SHARD${i}_OWNER_PRIVATE_KEY`];
  chainConfig[`shard${i}_block_delay`] = process.env[`SHARD${i}_BLOCK_DELAY`] || 0; // Set an appropriate value based on the characteristics of the Shard chain
  
  // Fee configuration for Shard
  chainConfig[`shard${i}_max_priority_fee_gwei`] = process.env[`SHARD${i}_MAX_PRIORITY_FEE_GWEI`] || chainConfig.l2_max_priority_fee_gwei;
  chainConfig[`shard${i}_base_fee_multiplier`] = process.env[`SHARD${i}_BASE_FEE_MULTIPLIER`] || chainConfig.l2_base_fee_multiplier;
  chainConfig[`shard${i}_max_total_fee`] = process.env[`SHARD${i}_MAX_TOTAL_FEE`] || chainConfig.l2_max_total_fee;
}

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