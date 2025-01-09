const w3 = require('web3');
require('dotenv').config();
const { Web3 } = require('web3');
const BN = require('bn.js'); 
const abis = require('./contracts/abis');
const fetch = require('node-fetch')
const fs = require('fs');
const mysql = require('mysql');
const util = require('util');



const chainConfig = {
    l1_name: process.env.L1_NAME,
    l1_wss_url: process.env.L1_WSS_URL,
    l1_rpc_url: process.env.L1_RPC_URL,
    l1_contract_address: process.env.L1_CONTRACT_ADDRESS,
    l1_graph_query_url: process.env.L1_GRAPH_QUERY_URL,

    l2_name: process.env.L2_NAME,
    l2_rpc_url: process.env.L2_RPC_URL,
    l2_wss_url: process.env.L2_WSS_URL,
    l2_contract_address: process.env.L2_CONTRACT_ADDRESS,

    shard1_name: process.env.SHARD1_NAME,
    shard1_contract_address: process.env.SHARD1_CONTRACT_ADDRESS,
    l2_to_shard1_contract_address: process.env.L2_TO_SHARD1_CONTRACT_ADDRESS,
    shard1_rpc_url: process.env.SHARD1_RPC_URL,
    shard1_wss_url: process.env.SHARD1_WSS_URL,

    shard2_name: process.env.SHARD2_NAME,
    shard2_contract_address: process.env.SHARD2_CONTRACT_ADDRESS,
    l2_to_shard2_contract_address: process.env.L2_TO_SHARD2_CONTRACT_ADDRESS,
    shard2_rpc_url: process.env.SHARD2_RPC_URL,
    shard2_wss_url: process.env.SHARD2_WSS_URL,

    erc20_token_address: process.env.ERC20_TOKEN_ADDRESS,
};

// ABI of the EtherReceiver contract
const abi = abis.deposit;

class BlockchainConfig {
	constructor(name, rpc_url,wss_url) {
	  this.name = name;
	  this.rpc_url = rpc_url;
	  this.wss_url = wss_url;
	  this.rpcWb3 = new Web3(this.rpc_url);
	  this.wsWeb3 = new Web3(wss_url);
	}
}

class ContractConfig{
	constructor(address, chainConfig,owner_address,owner_private_key){
		this.address = address;
		this.chainConfig = chainConfig;
		this.contract = new chainConfig.rpcWb3.eth.Contract(abi, address);
		this.owner_address = owner_address;
		this.owner_private_key = owner_private_key;
	}

}

class Route{
	constructor(from , to){
		this.from = from;
		this.to = to;
	}
}

const l1 = new BlockchainConfig(chainConfig.l1_name,chainConfig.l1_rpc_url,chainConfig.l1_wss_url);
const l2 = new BlockchainConfig(chainConfig.l2_name,chainConfig.l2_rpc_url,chainConfig.l2_wss_url);
const shard1 = new BlockchainConfig(chainConfig.shard1_name,chainConfig.shard1_rpc_url,chainConfig.shard1_wss_url);
const shard2 = new BlockchainConfig(chainConfig.shard2_name,chainConfig.shard2_rpc_url,chainConfig.shard2_wss_url);

const l1_contract = new ContractConfig(chainConfig.l1_contract_address,l1,process.env.owner_address,process.env.owner_private_key);
const l2_contract = new ContractConfig(chainConfig.l2_contract_address,l2,process.env.owner_address,process.env.owner_private_key);
const l2_to_shard1_contract = new ContractConfig(chainConfig.l2_to_shard1_contract_address,l2,process.env.owner_address,process.env.owner_private_key);
const l2_to_shard2_contract = new ContractConfig(chainConfig.l2_to_shard2_contract_address,l2,process.env.owner_address,process.env.owner_private_key);
const shard1_contract = new ContractConfig(chainConfig.shard1_contract_address,shard1,process.env.owner_address,process.env.owner_private_key);
const shard2_contract = new ContractConfig(chainConfig.shard2_contract_address,shard2,process.env.owner_address,process.env.owner_private_key);
const routes = new Map();
routes.set('L2->L1', new Route(l2_contract,l1_contract));
routes.set('shard1->L2', new Route(shard1_contract,l2_to_shard1_contract));
routes.set('L2->shard1', new Route(l2_to_shard1_contract,shard1_contract));
//routes.set('shard2->L2', new Route(shard2_contract,l2_to_shard2_contract));
//routes.set('L2->shard2', new Route(l2_to_shard2_contract,shard2_contract));


//let last_id = require('./last_id.json').value;

console.log('chainConfig.owner(L1):', l1_contract.owner_address);
console.log('chainConfig.owner(L2&shard):', l2_contract.owner_address);
// Connect to an Ethereum node
//const sepoliaRpcWeb3 = new Web3(chainConfig.l1_rpc_url); // Update with your Ethereum node URL
//const sepoliaWsWeb3 = new Web3(chainConfig.l1_wss_url); // Update with your Ethereum node URL

//const l2RpcWeb3 = new Web3(chainConfig.l2_rpc_url); // Update with your Ethereum node URL
//const l2WsWeb3 = new Web3(chainConfig.l2_wss_url); // Update with your Ethereum node URL



async function do_transaction(to, recipient, amount) {

	// Sender's account address and private key
	const senderAddress = to.owner_address;
	const senderPrivateKey = to.owner_private_key;
	console.log(to.chainConfig.name, 'call do_transaction', senderAddress, recipient, amount);
	let rpc_web3 = to.chainConfig.rpcWb3;
	let net_name = to.chainConfig.name;

	// Recipient's account address
	const recipientAddress = recipient;
	// Amount to transfer (unit is wei)
	const amountToSend = amount; // Replace with the amount to transfer

	let gasPriceGwei = '5'; // Replace with the desired gas price in Gwei
	let gasLimit = 210000; // Replace with the desired gas limit  
	// Sign the transaction with sender's private key and send it

	let transactionObject = {};
	try {

		if (to.chainConfig.name == chainConfig.l1_name) {
			// current block
			const block = await rpc_web3.eth.getBlock('latest');
			const baseFeePerGas = new BN(block.baseFeePerGas); 
			const maxPriorityFeePerGas = new BN(w3.utils.toWei('1', 'gwei')); 
			const maxFeePerGas = baseFeePerGas.mul(new BN(1.5)).add(maxPriorityFeePerGas);
			// // Construct the transaction object
			// transactionObject = {
			// 	from: senderAddress,
			// 	to: recipientAddress,
			// 	value: amountToSend,//w3.utils.toWei(amountToSend, 'ether'),
			// 	gas: gasLimit,
			// 	maxFeePerGas: maxFeePerGas.toString(),
			// 	maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
			// }

			//modify: transfer erc20 token for L1

			const tokenABI = [
				{
					constant: false,
					inputs: [
						{ name: '_to', type: 'address' },
						{ name: '_value', type: 'uint256' }
					],
					name: 'transfer',
					outputs: [{ name: '', type: 'bool' }],
					type: 'function'
				}
			];
			const tokenContract = new rpc_web3.eth.Contract(tokenABI, chainConfig.erc20_token_address);


			//const tokenAmount = w3.utils.toBN(w3.utils.toWei(amountToSend, 'ether')); // amountToSend个代币，调整为你想要的数量

			const data = tokenContract.methods.transfer(recipientAddress, amountToSend).encodeABI();

			const nonce = await rpc_web3.eth.getTransactionCount(senderAddress);

			transactionObject = {
				from: senderAddress,
				to: chainConfig.erc20_token_address,
				gas: gasLimit,
				data: data,
				nonce:Number(nonce),
				maxFeePerGas: maxFeePerGas.toString(),
				maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
			};
			console.log("Nonce type:", typeof transactionObject.nonce);  
                        console.log("Gas type:", typeof transactionObject.gas);     


		}
		else {

			transactionObject = {
				from: senderAddress,
				to: recipientAddress,
				value: amountToSend,//w3.utils.toWei(amountToSend, 'ether'),
				gasPrice: w3.utils.toWei(gasPriceGwei, 'gwei'), // Convert gas price to Wei
				gas: gasLimit,
			}

		}


		console.log(net_name, 'begin Transaction:', JSON.stringify(transactionObject));
		const signedTx = await rpc_web3.eth.accounts.signTransaction(transactionObject, senderPrivateKey)
		await rpc_web3.eth.sendSignedTransaction(signedTx.rawTransaction)
			.on('transactionHash', txHash => {
				console.log(net_name, 'Transaction Hash:', txHash);
			})
			.on('receipt', receipt => {
				console.log(net_name, 'Transaction Receipt:', receipt);
			})
			.on('error', err => {
				console.error(net_name, 'Transaction Error:', err);
			}).catch(err => {
				console.error(net_name, 'Transaction catch:', err);
			})

		return true;
	} catch (err) {
		console.error(net_name, 'Signing Error:', err);
	}
	return false;
}


function listen_deposit_events(msg_queue) {

	//use graph sql to query the latest deposit events
	setInterval(() => {
		fetch_deposit_event_by_graph_sql('L1->L2', l2_contract , msg_queue);
	}, 5000);

	for (const [name, route] of routes) {
		setInterval(() => {
			fetch_deposit_event_by_rpc(name, route,	msg_queue);
		}, 5000);
	}

}



async function fetch_deposit_event_by_graph_sql(  name , to_contract , msg_queue) {
//   const grquery = `
//   {
//     deposits(orderBy: blockTimestamp, orderDirection: desc, first: 1) {
//       id
//       sender
//       amount
//       blockNumber
//       blockTimestamp
// 	  transactionHash
//     }
//   }
//   `;
  let db;
    try{

		db = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE	
        });

        const connect = util.promisify(db.connect).bind(db);
        const query = util.promisify(db.query).bind(db);

        await connect();
        console.log('Connected to MySQL');
		var last_id = 0;
        const rows = await query(`SELECT last_id FROM last_ids WHERE name = '${name}'`);
        if (rows.length > 0) {
            last_id = rows[0].last_id;
            console.log(`Last ID for ${name}: ${last_id}`);
        } else {
            console.error(`No last ID found for ${name}`);
			return;
        }


		const grquery = `
		{
		  deposits(
			orderBy: blockNumber,   
			orderDirection: asc, 
			first: 1, 
			where: { blockNumber_gt: ${last_id} }
		  ) {
			id
			sender
			amount
			blockNumber
			blockTimestamp
			transactionHash
		  }
		}
		`;
	  // 其他代码...


		console.log('fetch_deposit_event_by_graph_sql query data:', JSON.stringify({ grquery }));
		const response = await fetch(chainConfig.l1_graph_query_url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query :grquery })
		});
	
		const data = await response.json()
		console.log('fetch_deposit_event_by_graph_sql result data:', JSON.stringify(data));
		if(data.data && data.data.deposits && data.data.deposits[0]){
			for (const elem of data.data.deposits) {
				let blockNumber = elem.blockNumber;
				if(blockNumber > last_id){
					let transaction_hash = elem.transactionHash;
					const queue_data = {
						contract: to_contract,
						address: elem.sender,
						amount: elem.amount,
					}
					//check if the transaction already exists
					const existingTransaction = await query(`SELECT * FROM transactions WHERE name = '${name}' AND address = '${queue_data.address}' AND block_number = ${elem.blockNumber}`);
					if (existingTransaction.length > 0) {
						console.error(`Transaction already exists for ${name}, ${queue_data.address}, block ${elem.blockNumber}. Skipping.`);
						return ;
					}

					//msg_queue.push(queue_data); // Add data to the queue

					//do transaction
					const result = await do_transaction(
						queue_data.contract,
						queue_data.address,
						queue_data.amount,
					);
					if(!result){
						console.error(`Transaction failed for ${name}, ${queue_data.address}, block ${blockNumber}. Skipping.`);
						return;
					}

					//insert transaction record
					const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
					const block_timestamp = new Date(elem.blockTimestamp * 1000).toISOString().slice(0, 19).replace('T', ' ');

					await query(`INSERT INTO transactions (name, address, amount, block_number, transaction_hash , timestamp , block_timestamp) VALUES ('${name}', '${queue_data.address}', '${queue_data.amount}', ${blockNumber}, '${transaction_hash}' , '${timestamp}' , '${block_timestamp}')`);
					console.log('Transaction record inserted:', queue_data.address, queue_data.amount, blockNumber, timestamp);

					last_id = blockNumber;

					await query(`UPDATE last_ids SET last_id = ${last_id} WHERE name = '${name}'`);
					console.log('update last_id:', last_id);
				}
				else {
					console.log('fetch_deposit_event_by_graph_sql skip data:', JSON.stringify(elem), elem.id);
				}
			}
			
		}


	}
	catch(err){
		console.error('fetch_deposit_event_by_graph_sql Error:', err);
	}finally{
		db.end();
	}
	
}


//query the latest deposit events by rpc
async function fetch_deposit_event_by_rpc(name, route,	msg_queue) {
	let db;
    try {
        db = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE	
        });

        const connect = util.promisify(db.connect).bind(db);
        const query = util.promisify(db.query).bind(db);

        await connect();
        console.log('Connected to MySQL');

        const rows = await query(`SELECT last_id FROM last_ids WHERE name = '${name}'`);
		var last_id = 0;
        if (rows.length > 0) {
            last_id = rows[0].last_id;
            console.log(`Last ID for ${name}: ${last_id}`);
        } else {
            console.error(`No last ID found for ${name}`);
			return;
        }

        let latestBlock = await route.from.chainConfig.rpcWb3.eth.getBlockNumber();
        const fromBlock = last_id + 1; // 从上次记录的区块号开始查询
        console.log('fetch_deposit_event_by_rpc query data:', name, fromBlock, latestBlock);

		if(fromBlock > latestBlock){
			latestBlock = fromBlock+1;
			return;
		}

        // 查询从 fromBlock 到 latestBlock 的所有 Deposit 事件
        const events = await route.from.contract.getPastEvents('Deposit', {
            fromBlock: fromBlock,
            toBlock: latestBlock
        });

        for (const event of events) {
            const { sender, amount } = event.returnValues;
            const blockNumber = event.blockNumber;
			let transaction_hash = event.transactionHash;

            if (blockNumber > last_id) {
				let to  =  route.to;
                const queue_data = {
                    contract: to,
                    address: sender,
                    amount: amount.toString(),
                };
                console.log(queue_data);
                console.log('fetch_deposit_event_by_rpc add to queue:', queue_data.contract, queue_data.address, queue_data.amount, blockNumber);
				//check if the transaction already exists
				const existingTransaction = await query(`SELECT * FROM transactions WHERE name = '${name}' AND address = '${queue_data.address}' AND block_number = ${blockNumber}`);
                if (existingTransaction.length > 0) {
                    console.log(`Transaction already exists for ${name}, ${queue_data.address}, block ${blockNumber}. Skipping.`);
                    continue;
                }
				//do transaction
				const result = await do_transaction(
					queue_data.contract,
					queue_data.address,
					queue_data.amount,
				);
				if(!result){
					console.error(`Transaction failed for ${name}, ${queue_data.address}, block ${blockNumber}. Skipping.`);
					return;
				}
				//insert transaction record
				const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
				const block_timestamp = timestamp; 
				await query(`INSERT INTO transactions (name, address, amount, block_number, transaction_hash, timestamp, block_timestamp) VALUES ('${name}', '${queue_data.address}', '${queue_data.amount}', ${blockNumber}, '${transaction_hash}' , '${timestamp}' , '${block_timestamp}')`);
				console.log('Transaction record inserted:', queue_data.address, queue_data.amount, blockNumber, timestamp);
				//update last_id
				last_id = blockNumber;
				await query(`UPDATE last_ids SET last_id = ${last_id} WHERE name = '${name}'`);
                console.log('update last_id:', last_id);
            }
        };
		
    } catch (err) {
        console.error('fetch_deposit_event_by_rpc Error:', err);
    } finally {
        db.end();
    }
}




module.exports = {
	do_transaction,
	listen_deposit_events
};
