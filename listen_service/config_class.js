const { Web3 } = require('web3');

class BlockchainConfig {
	constructor(name, rpc_url, wss_url , block_delay ,
		 max_priority_fee_gwei, base_fee_multiplier ,max_total_fee  ){
		// Name of the blockchain
		this.name = name;
		// RPC URL for HTTP connection
		this.rpc_url = rpc_url;
		// WebSocket URL for real-time connection
		this.wss_url = wss_url;
		// Web3 instance for RPC connection
		this.rpcWb3 = new Web3(this.rpc_url);
		// Web3 instance for WebSocket connection
		this.wsWeb3 = new Web3(wss_url);
		// 
		this.block_delay = block_delay;
		// Priority fee (Gwei)
		this.max_priority_fee_gwei= max_priority_fee_gwei;
		// Base fee multiplier
		this.base_fee_multiplier= base_fee_multiplier;        
		this.max_total_fee= max_total_fee
	}
}

class ContractConfig {
	constructor(address, chainConfig, owner_address, owner_private_key, abi) {
		// Contract address on the blockchain
		this.address = address.startsWith('0x') ? address : '0x' + address;
		// Blockchain configuration object
		this.chainConfig = chainConfig;
		// Web3 contract instance
		this.contract = new chainConfig.rpcWb3.eth.Contract(abi, this.address);
		// Owner's address of the contract
		this.owner_address = owner_address.startsWith('0x') ? owner_address : '0x' + owner_address;
		// Owner's private key for signing transactions
		this.owner_private_key = owner_private_key.startsWith('0x') ? owner_private_key.slice(2) : owner_private_key;
	}
}

class Route {
	constructor(from, to) {
		// Starting point of the route
		this.from = from;
		// Destination point of the route
		this.to = to;

		this.times = 0;
	}
}

module.exports = {
	BlockchainConfig,
	ContractConfig,
	Route
}; 