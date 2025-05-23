const w3 = require('web3');
require('dotenv').config();
const { Web3 } = require('web3');
const BN = require('bn.js'); 
const abis = require('./contracts/abis');
const fetch = require('node-fetch')
const { chainConfig } = require('./env');
const { BlockchainConfig, ContractConfig, Route } = require('./config_class');
const DBUtils = require('./db_utils'); 
const logger = require('./log_utils');
const { processTransactions } = require('./transaction_processor');
// ABI of the EtherReceiver contract
const abi = abis.deposit;
const l1_abi = abis.l1;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function maskPrivateKey(privateKey) {
    if (privateKey.length <= 8) {
        return privateKey;
    }
    const start = privateKey.slice(0, 4);
    const end = privateKey.slice(-4);
    const masked = '*'.repeat(privateKey.length - 8);
    return `${start}${masked}${end}`;
}

function printChainConfig() {
	logger.info('L1 name ' + chainConfig.l1_name);
	logger.info('L1 contract Address ' + chainConfig.l1_contract_address);
    logger.info(`L1 Owner Address: ${chainConfig.l1_owner_address}`);
    logger.info(`L1 Owner Private Key: ${maskPrivateKey(chainConfig.l1_owner_private_key)}`);
    logger.info(`L1 Block Delay : ${chainConfig.l1_block_delay}`);
	
	logger.info('L2 name ' + chainConfig.l2_name);
    logger.info('L2 contract Address ' + chainConfig.l2_contract_address);
    logger.info(`L2 Owner Address: ${chainConfig.l2_owner_address}`);
    logger.info(`L2 Owner Private Key: ${maskPrivateKey(chainConfig.l2_owner_private_key)}`);
    logger.info(`L2 Block Delay: ${chainConfig.l2_block_delay}`);

    for (let i = 1; i <= 10; i++) {
        const shardName = chainConfig[`shard${i}_name`];
        if (shardName == undefined) {
			break;
        }
		logger.info('Shard${i} name ' + shardName);
		logger.info('Shard${i} contract Address ' + chainConfig[`shard${i}_contract_address`]);
        logger.info(`Shard${i} Owner Address: ${chainConfig[`shard${i}_owner_address`]}`);
        logger.info(`Shard${i} Owner Private Key: ${maskPrivateKey(chainConfig[`shard${i}_owner_private_key`])}`);
        logger.info(`Shard Block Delay: ${chainConfig.shard_block_delay}`);
    }
}

printChainConfig();

//connect to the blockchain
const l1 = new BlockchainConfig(chainConfig.l1_name,chainConfig.l1_rpc_url,chainConfig.l1_wss_url,
    chainConfig.l1_block_delay, chainConfig.l1_max_priority_fee_gwei, chainConfig.l1_base_fee_multiplier, chainConfig.l1_max_total_fee);
const l2 = new BlockchainConfig(chainConfig.l2_name,chainConfig.l2_rpc_url,chainConfig.l2_wss_url,
    chainConfig.l2_block_delay, chainConfig.l2_max_priority_fee_gwei, chainConfig.l2_base_fee_multiplier, chainConfig.l2_max_total_fee);

// Initialize shard arrays
const shards = [];
const shardContracts = [];
const l2ToShardContracts = [];

// Dynamically initialize all configured shards
for (let i = 1; i <= 10; i++) { // for more  change it 
    const shardName = chainConfig[`shard${i}_name`];
	if(shardName == undefined) {
		logger.info(`Shard${i} is not configured`);
		break;
	  }
    const shardRpcUrl = chainConfig[`shard${i}_rpc_url`];
    const shardWssUrl = chainConfig[`shard${i}_wss_url`];
    const shardContractAddress = chainConfig[`shard${i}_contract_address`];
    const l2ToShardContractAddress = chainConfig[`l2_to_shard${i}_contract_address`];
    const shardOwnerAddress = chainConfig[`shard${i}_owner_address`];
    const shardOwnerPrivateKey = chainConfig[`shard${i}_owner_private_key`];
    const blockDelay = chainConfig[`shard${i}_block_delay`];

    if (shardName && shardRpcUrl && shardWssUrl) {
        const shard = new BlockchainConfig(
            shardName, 
            shardRpcUrl, 
            shardWssUrl, 
            blockDelay,
            chainConfig[`shard${i}_max_priority_fee_gwei`],
            chainConfig[`shard${i}_base_fee_multiplier`],
            chainConfig[`shard${i}_max_total_fee`]
        );
        shards.push({ index: i, config: shard });

        if (shardContractAddress && l2ToShardContractAddress) {
            const shardContract = new ContractConfig(
                shardContractAddress,
                shard,
                shardOwnerAddress,
                shardOwnerPrivateKey,
                abi
            );
            const l2ToShardContract = new ContractConfig(
                l2ToShardContractAddress,
                l2,
                chainConfig.l2_owner_address,
                chainConfig.l2_owner_private_key,
                abi
            );
            shardContracts.push({ index: i, contract: shardContract });
            l2ToShardContracts.push({ index: i, contract: l2ToShardContract });
            logger.info(`Shard${i} and its contracts are configured`);
        } else {
            logger.info(`Shard${i} contracts are not configured`);
        }
    } else {
        logger.info(`Shard${i} is not configured`);
    }
}




//connect to the contract
const l1_contract = new ContractConfig(
    chainConfig.l1_contract_address,
    l1,
    chainConfig.l1_owner_address,
    chainConfig.l1_owner_private_key,
    l1_abi
);
const l2_contract = new ContractConfig(
    chainConfig.l2_contract_address,
    l2,
    chainConfig.l2_owner_address,
    chainConfig.l2_owner_private_key,
    abi
);

const routes = new Map();
routes.set('L1->L2', new Route(l1_contract, l2_contract));
routes.set('L2->L1', new Route(l2_contract, l1_contract));

// for shard add route
shardContracts.forEach(({ index, contract: shardContract }) => {
    const l2ToShardContract = l2ToShardContracts.find(c => c.index === index)?.contract;
    if (l2ToShardContract) {
        routes.set(`shard${index}->L2`, new Route(shardContract, l2ToShardContract));
        routes.set(`L2->shard${index}`, new Route(l2ToShardContract, shardContract));
    }
});

logger.info('chainConfig.owner(L1) ' + l1_contract.owner_address);
logger.info(`chainConfig.owner(L2&shard): ${l2_contract.owner_address}`);
logger.info(`chainConfig.mock_transactions: ${chainConfig.mock_transactions}`);
logger.info(`chainConfig.l1_graph_query_use: ${chainConfig.l1_graph_query_use}`);


async function do_transaction(name, to, recipient, amount, transactionId) {
    if (!to || !recipient || !amount || !transactionId) {
        throw new Error(`Missing required parameters ${to}, ${recipient}, ${amount}, ${transactionId}`);
    }
	if(chainConfig.mock_transactions == 'true'){
		logger.info('mock_transactions is true');
		return 'SUCCESS';
	}

	// Sender's account address and private key
	const senderAddress = to.owner_address;
	const senderPrivateKey = to.owner_private_key;
	logger.info(`${to.chainConfig.name} call do_transaction ${senderAddress} ${recipient} ${amount}`);
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
	let transactionHash = '';
	let errorMessage = '';
	let status = 'INIT';

	try {
        // current block
        const nonce = await rpc_web3.eth.getTransactionCount(senderAddress);
        const currentBlock = await rpc_web3.eth.getBlock('latest');
        const baseFeePerGas = new BN(currentBlock.baseFeePerGas);

		if (to.chainConfig.name == chainConfig.l1_name) {
			//  EIP-1559 
			const maxPriorityFeePerGas = new BN(w3.utils.toWei(to.chainConfig.max_priority_fee_gwei, 'gwei')); 
            // baseFeePerGas * base_fee_multiplier + priority_fee
			const maxFeePerGas = baseFeePerGas.mul(new BN(Number(to.chainConfig.base_fee_multiplier))).add(maxPriorityFeePerGas);

            // check if the maximum total fee exceeds the limit
            const maxTotalFee = maxFeePerGas.mul(new BN(gasLimit));
            const maxAllowedFee = new BN(to.chainConfig.max_total_fee);
            if (maxTotalFee.gt(maxAllowedFee)) {
                logger.error(`Transaction fee too high: ${maxTotalFee.toString()} > ${maxAllowedFee.toString()}`);
                throw new Error(`Transaction fee exceeds maximum allowed fee: ${maxTotalFee.toString()} > ${maxAllowedFee.toString()}`);
            }

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

			try {
				const data = tokenContract.methods.transfer(recipientAddress, amountToSend).encodeABI();

				transactionObject = {
					from: senderAddress,
					to: chainConfig.erc20_token_address,
					data: data,
					nonce: Number(nonce),
					gas: gasLimit,
					maxFeePerGas: maxFeePerGas.toString(),
					maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
				};
			} catch (err) {
				logger.error(`Error encoding token transfer data: ${err.message}`);
				throw new Error(`Failed to encode token transfer data: ${err.message}`);
			}

		}
		else {
            
            // not EIP-1559 use 
			const maxPriorityFeePerGas = new BN(w3.utils.toWei(to.chainConfig.max_priority_fee_gwei, 'gwei')); 
            // gasPrice = baseFeePerGas * base_fee_multiplier + priority_fee
            const dynamicGasPrice = baseFeePerGas.mul(new BN(to.chainConfig.base_fee_multiplier)).add(maxPriorityFeePerGas);

            // check if the maximum total fee exceeds the limit
            const estimatedGasLimit = await rpc_web3.eth.estimateGas({
				from: senderAddress,
				to: recipientAddress,
				value: amountToSend.toString(),
			}); // dynamic estimate gasLimit

            const maxTotalFee = dynamicGasPrice.mul(new BN(estimatedGasLimit));
            const maxAllowedFee = new BN(to.chainConfig.max_total_fee);
            if (maxTotalFee.gt(maxAllowedFee)) {
                logger.error(`Transaction fee too high: ${maxTotalFee.toString()} > ${maxAllowedFee.toString()}`);
                throw new Error(`Transaction fee exceeds maximum allowed fee: ${maxTotalFee.toString()} > ${maxAllowedFee.toString()}`);
            }

			// ensure all values are converted to strings
			transactionObject = {
				from: senderAddress,
				to: recipientAddress,
				value: amountToSend.toString(),
				nonce: Number(nonce),
				gasPrice: dynamicGasPrice.toString(),
				gas: estimatedGasLimit.toString()
			}
		}

        logger.info(`Transaction object: ${JSON.stringify(transactionObject, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )}`);


		// record transaction flow
		const flowData = {
			transaction_id: transactionId,
			name: name,
			from_address: senderAddress,
			to_address: recipientAddress,
			amount: amountToSend,
			gas_price: transactionObject.gasPrice || `${transactionObject.maxFeePerGas}/${transactionObject.maxPriorityFeePerGas}`,
			gas_limit: gasLimit,
			nonce: transactionObject.nonce,
			status: 'INIT'
		};

		// query transaction_flow table to check if the transaction already exists
		const existingFlowList = await DBUtils.query(
			`SELECT * FROM transaction_flow 
			WHERE transaction_id = ? 
			ORDER BY id DESC LIMIT 1`,
			[flowData.transaction_id]
		);


		if (existingFlowList.length > 0) {
            const existingFlow = existingFlowList[0];
            // if the transaction already exists
			logger.info(`Transaction flow already exists: ${existingFlow.transaction_id} ${existingFlow.status}`);
			

            if(existingFlow.status == 'SUCCESS'){
                logger.info(`Transaction flow already exists: ${existingFlow.transaction_id} ${existingFlow.status} return true`);
                return 'SUCCESS';
            }

            // if the transaction hash is not null, and the status is FAIL, return false
            if(existingFlow.status == 'FAIL' && existingFlow.transaction_hash != null){
                console.log(`transaction_flow ${existingFlow.transaction_id} already exists and status is ${existingFlow.status}`);
                return 'FAIL'; 
            }
            
            // need query the transaction hash
            if((existingFlow.status == 'INIT' || existingFlow.status == 'PENDING')  && existingFlow.transaction_hash != null){
                logger.info(`Transaction flow already exists: ${existingFlow.transaction_id} ${existingFlow.status} start query `);
                // if the transaction is in INIT status, update the status to SUCCESS
                try{
                    const receipt = await rpc_web3.eth.getTransactionReceipt(existingFlow.transaction_hash);
                    // logger.info(`Transaction receipt: ${JSON.stringify(receipt, (key, value) =>
                    //     typeof value === 'bigint' ? value.toString() : value
                    // )}`);
                    
                    // check if the transaction is still pending
                    if (!receipt) {
                        logger.info(`Transaction ${existingFlow.transaction_hash} is still pending.`);
                        return "PENDING"; // return false to let the caller know the transaction is still pending
                    }

                    if (receipt.status) {
                        logger.info(`Transaction ${existingFlow.transaction_hash} confirmed as SUCCESS on chain.`);
                        const blockNumber = receipt.blockNumber;
                        logger.info(`Transaction ${existingFlow.transaction_hash} is included in block number: ${blockNumber}`);

                        // 如果是 L1 交易,需要检查区块确认数
                        if (to.chainConfig.name === chainConfig.l1_name) {
                            const currentBlock = await rpc_web3.eth.getBlockNumber();
                            const blockDelay = to.chainConfig.block_delay;
                            const confirmations = currentBlock - blockNumber;
                            
                            logger.info(`L1 transaction ${existingFlow.transaction_hash} confirmations: ${confirmations}, required: ${blockDelay}`);
                            
                            if (confirmations < blockDelay) {
                                logger.info(`L1 transaction ${existingFlow.transaction_hash} needs more confirmations. Current: ${confirmations}, Required: ${blockDelay}`);
                                return "PENDING";
                            }
                        }

                        const updateResult = await DBUtils.query(
                            `UPDATE transaction_flow SET status = 'SUCCESS', block_number = ? WHERE id = ?`,
                            [blockNumber, existingFlow.id]
                        );
                        
                        if (updateResult.affectedRows === 0) {
                            logger.error(`Failed to update transaction_flow status for id: ${existingFlow.id}`);
                            return 'FAIL';
                        }
                    
                        return 'SUCCESS';
                    } else {
                        logger.error(`Transaction ${existingFlow.transaction_hash} confirmed as FAIL on chain.`);
                        const updateResult = await DBUtils.query(
                            `UPDATE transaction_flow SET status = 'FAIL' WHERE id = ?`,
                            [existingFlow.id]
                        );
                        if (updateResult.affectedRows === 0) {
                            logger.error(`Failed to update transaction_flow status for id: ${existingFlow.id}`);
                            return 'FAIL';
                        }
                        return 'FAIL';
                    }
                } catch(err){
                    logger.error(`Transaction ${existingFlow.transaction_hash} query error: ${err.message}`);
                }
                return "PENDING";
            }

            // retry transaction
            console.log(`transaction_flow need retry ${existingFlow.transaction_id} already exists and status[${existingFlow.status}],transaction_hash[${existingFlow.transaction_hash}]`);
            // update the nonce
            if(existingFlow.nonce != transactionObject.nonce){
                logger.warn(`transaction_flow need retry ${existingFlow.transaction_id} nonce existingFlow[${existingFlow.nonce}], transactionObject[${transactionObject.nonce}] is not the same`);
                flowData.nonce = existingFlow.nonce;
                transactionObject.nonce = existingFlow.nonce;
            }

		}


		// insert transaction flow record
		const flowResult = await DBUtils.query(
			`INSERT INTO transaction_flow 
			(transaction_id, name, from_address, to_address, amount, gas_price, gas_limit, nonce, status) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[flowData.transaction_id, flowData.name, flowData.from_address, flowData.to_address, 
			flowData.amount, flowData.gas_price, flowData.gas_limit, flowData.nonce, flowData.status]
		);
        logger.info(`${net_name} begin Transaction transaction_id[${flowData.transaction_id}],id[${flowResult.insertId}]`);
        const signedTx = await rpc_web3.eth.accounts.signTransaction(transactionObject, senderPrivateKey)
        
        // 使用 Promise 包装事件监听器
        return new Promise((resolve, reject) => {
            rpc_web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', txHash => {
                    transactionHash = txHash;
                    logger.info(`${net_name} Transaction Hash: ${txHash}`);
                    // update transaction hash
                    DBUtils.query(
                        `UPDATE transaction_flow SET transaction_hash = ? WHERE id = ?`,
                        [txHash, flowResult.insertId]
                    );
                })
                .on('receipt', receipt => {
                    // Check transaction status in receipt
                    if (receipt.status) {
                        status = 'SUCCESS';
                        const blockNumber = receipt.blockNumber;
                        logger.info(`${net_name} Transaction ${flowData.transaction_id}  Receipt: SUCCESS, block number: ${blockNumber}`);

                        // 如果是 L1 交易,需要检查区块确认数
                        if (to.chainConfig.name === chainConfig.l1_name) {
                            rpc_web3.eth.getBlockNumber().then(currentBlock => {
                                const blockDelay = to.chainConfig.block_delay;
                                const confirmations = currentBlock - blockNumber;
                                
                                logger.info(`L1 transaction ${transactionHash} confirmations: ${confirmations}, required: ${blockDelay}`);
                                
                                if (confirmations < blockDelay) {
                                    logger.info(`L1 transaction ${transactionHash} needs more confirmations. Current: ${confirmations}, Required: ${blockDelay}`);
                                    // update transaction status to pending
                                    DBUtils.query(
                                        `UPDATE transaction_flow SET status = 'PENDING', block_number = ? WHERE id = ?`,
                                        [blockNumber, flowResult.insertId]
                                    );
                                    resolve("PENDING");
                                    return;
                                }

                                // update transaction status to success and block number
                                DBUtils.query(
                                    `UPDATE transaction_flow SET status = ?, block_number = ? WHERE id = ?`,
                                    [status, blockNumber, flowResult.insertId]
                                );
                                resolve('SUCCESS');
                            }).catch(err => {
                                logger.error(`Error getting current block number: ${err}`);
                                reject(err);
                            });
                        } else {
                            // 非 L1 交易直接更新状态
                            DBUtils.query(
                                `UPDATE transaction_flow SET status = ?, block_number = ? WHERE id = ?`,
                                [status, blockNumber, flowResult.insertId]
                            );
                            resolve('SUCCESS');
                        }
                    } else {
                        status = 'PENDING';
                        errorMessage = 'Transaction reverted by EVM';
                        logger.error(`${net_name} ${flowData.transaction_id} Transaction Receipt: FAILED - ${errorMessage}`);
                        // update transaction status to fail and record error message
                        DBUtils.query(
                            `UPDATE transaction_flow SET status = ?, error_message = ? WHERE id = ?`,
                            [status, errorMessage, flowResult.insertId]
                        );
                        resolve('PENDING');
                    }
                })
                .on('error', err => {
                    status = 'FAIL';
                    errorMessage = err.message;
                    logger.error(`${net_name} Transaction Error: ${err}`);
                    // update transaction status to fail and record error message
                    DBUtils.query(
                        `UPDATE transaction_flow SET status = ?, error_message = ? WHERE id = ?`,
                        [status, errorMessage, flowResult.insertId]
                    );
                    reject(err);
                });
        });
    } catch (err) {
        status = 'FAIL';
        errorMessage = err.message;
        logger.error(`${net_name}  Error: ${err}`);
        // if error occurs, update transaction status to fail and record error message
        if (flowResult && flowResult.insertId) {
            await DBUtils.query(
                `UPDATE transaction_flow SET status = ?, error_message = ? WHERE id = ?`,
                [status, errorMessage, flowResult.insertId]
            );
        }
        throw err;
    }
}


async function listen_deposit_events() {
    logger.info('listen_deposit_events start');
    let lock = false;
    setInterval(async () => {
        if(lock){
            return;
        }
        lock = true;
        try {
            for (const [name, route] of routes) {
                if('L1->L2' == name && chainConfig.l1_graph_query_use == 'true'){
                    logger.info(`use graph sql to query the latest deposit events`)
                    await fetch_deposit_event_by_graph_sql(name, route.to_contract );
                }else{
                    await fetch_deposit_event_by_rpc(name, route );
                }
            }
            const lockName = `transaction_flow`;
            const hasLock = await acquireLock(lockName);
            if (!hasLock) {
                logger.info(`Another instance is processing ${name} graph events`);
                return;
            }
            try{
                await processTransactions(do_transaction, (name) => {
                    const route = routes.get(name);
                    return route ? route.to : null;
                });
            } finally {
                try {
                    await releaseLock(lockName);
                } catch (err) {
                    logger.error(`Error releasing lock ${lockName}:`, err);
                }
            }
        } catch (error) {
            logger.error('Error in listen_deposit_events interval:', error);
        } finally {
            lock = false;
        }
    }, 60*1000);
}



// add distributed lock related functions
async function acquireLock(lockName, timeout = 600) {
    try {
        // logger.info(`acquireLock ${lockName}`);
        // update lock record 
        const result = await DBUtils.query(
            `INSERT INTO distributed_locks (lock_name, expires_at) 
             VALUES (?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
            [lockName, timeout, timeout]
        );
        
		return true;

    } catch (error) {

        // check if the lock is valid
        const lock = await DBUtils.query(
            'SELECT * FROM distributed_locks WHERE lock_name = ? AND expires_at < NOW()',
            [lockName]
        );
        
		if(lock.length > 0){
			logger.info(`acquiring lock: with timeout true`);

			await DBUtils.query(
			    `UPDATE distributed_locks 
			     SET expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND) 
			     WHERE lock_name = ?`,
			    [timeout, lockName]
			);

			return true;
		}

        // logger.info(' acquiring lock: false');
        return false;
    }
}

async function releaseLock(lockName) {
    try {
        // logger.info(`releaseLock ${lockName}`);
        await DBUtils.query(
            'DELETE FROM distributed_locks WHERE lock_name = ?',
            [lockName]
        );
    } catch (error) {
        logger.error('Error releasing lock:', error);
    }
}

async function fetch_deposit_event_by_graph_sql(name, to_contract) {
    const lockName = `${name}`;
    // try to acquire lock
    const hasLock = await acquireLock(lockName);
    if (!hasLock) {
        logger.info(`Another instance is processing ${name} graph events`);
        return;
    }
    try {
        // get last_id
        logger.info('Connected to MySQL');
        let last_id = 0;
        const rows = await DBUtils.query(`SELECT last_id FROM last_ids WHERE name = '${name}'`);
        if (rows.length > 0) {
            last_id = rows[0].last_id;
            logger.info(`Last ID for ${name}: ${last_id}`);
        } else {
            logger.error(`No last ID found for ${name}`);
            return;
        }

        const grquery = `
        {
          deposits(
            orderBy: blockNumber,   
            orderDirection: asc, 
            first: 200, 
            where: { blockNumber_gte: ${last_id} }
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
        
        logger.info('fetch_deposit_event_by_graph_sql query data:', JSON.stringify({ grquery }));
        const response = await fetch(chainConfig.l1_graph_query_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query :grquery })
        });
    
        const data = await response.json()
        logger.info('fetch_deposit_event_by_graph_sql result data:', JSON.stringify(data));
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
                    let existingTransaction = await DBUtils.query(
                        `SELECT * FROM transactions 
                         WHERE name = ? 
                         AND address = ? 
                         AND block_number = ? 
                         AND transaction_hash = ?`,
                        [name, queue_data.address, blockNumber, transaction_hash]
                    );
                    let retry_transaction = false;
                    if (existingTransaction.length > 0) {
                        const existingStatus = existingTransaction[0].status;
                        if(existingStatus === 'INIT'){
                            logger.info(`Transaction in INIT status for ${name}, ${queue_data.address}, block ${blockNumber}, hash ${transaction_hash}. Retrying.`);
                            // record retry transaction
                            await DBUtils.query(
                                `INSERT INTO retry_transactions (name, address, block_number, transaction_hash, retry_timestamp) 
                                 VALUES (?, ?, ?, ?, ?)`,
                                [name, queue_data.address, blockNumber, transaction_hash, new Date().toISOString().slice(0, 19).replace('T', ' ')]
                            );
                            retry_transaction = true;
                        } else {
                            logger.info(`Transaction already exists for ${name}, ${queue_data.address}, block ${blockNumber}, hash ${transaction_hash}. Skipping.`);
                            continue;
                        }
                    }
                    if(!retry_transaction){
                        //insert transaction record with INIT status
                        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                        const block_timestamp = new Date(elem.blockTimestamp * 1000).toISOString().slice(0, 19).replace('T', ' ');
                        existingTransaction = await DBUtils.query(
                            `INSERT INTO transactions (name, address, amount, block_number, transaction_hash, timestamp, block_timestamp, status) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'INIT')`,
                            [name, queue_data.address, queue_data.amount, blockNumber, transaction_hash, timestamp, block_timestamp]
                        );
                        logger.info('Transaction record inserted with INIT status:', queue_data.address, queue_data.amount, blockNumber);
                    }

                    last_id = blockNumber;
                    await DBUtils.query(`UPDATE last_ids SET last_id = ${last_id} WHERE name = '${name}'`);
                    logger.info(`update last_id: ${last_id}`);
                } else {
                    logger.info(`fetch_deposit_event_by_graph_sql skip data: ${JSON.stringify(elem)}, ${elem.id}`);
                }
            }
        }
    } catch(err) {
        logger.error('fetch_deposit_event_by_graph_sql Error:', err);
    } finally {
        try {
            await releaseLock(lockName);
        } catch (err) {
            logger.error('Error releasing lock:', err);
        }
    }
}

async function fetch_deposit_event_by_rpc(name, route) {
    const lockName = `${name}`;
	route.times++;
	// try to acquire lock
	const hasLock = await acquireLock(lockName);
	// logger.info(`fetch_deposit_event_by_rpc ${name} ${route.times} ${hasLock}`);

	if (!hasLock) {
		logger.info(`Another instance is processing ${name} route.times ${route.times} events`);
		return;
	}
    try {

		// logger.info(`start ${name} ${route.times} ${hasLock}`);
        // original processing logic
        let last_id = 0;
        const rows = await DBUtils.query(`SELECT last_id FROM last_ids WHERE name = '${name}'`);
        if (rows.length > 0) {
            last_id = rows[0].last_id;
            //logger.info(`Last ID for ${name}: ${last_id}`);
        } else {
            logger.error(`No last ID found for ${name}`);
            return;
        }

        let latestBlock = await route.from.chainConfig.rpcWb3.eth.getBlockNumber();

        const fromBlock = BigInt(last_id); // start from last block number
        logger.info(`fetch_deposit_event_by_rpc query data: ${name},fromBlock[${fromBlock}], latestBlock[${latestBlock}] - blockDelay[${route.from.chainConfig.block_delay}] `);
        latestBlock = BigInt(latestBlock) - BigInt(route.from.chainConfig.block_delay);

		if(fromBlock > latestBlock){
            logger.info(`fetch_deposit_event_by_rpc skip data: ${name}, fromBlock[${fromBlock}], latestBlock[${latestBlock}]`);
			return;
		}

        if(latestBlock - fromBlock > BigInt(chainConfig.rpc_max_block_range)){
            logger.info(`fetch_deposit_event_by_rpc block range is too large, ${name}, ${fromBlock}, ${latestBlock}`);
            latestBlock = fromBlock + BigInt(chainConfig.rpc_max_block_range);
        }
        // query all deposit events from fromBlock to latestBlock
        const events = await route.from.contract.getPastEvents('Deposit', {
            fromBlock: Number(fromBlock),
            toBlock: Number(latestBlock)
        });

        if(events.length == 0){
            await DBUtils.query(`UPDATE last_ids SET last_id = ? WHERE name = ?`, [latestBlock, name]);
            logger.info(`fetch_deposit_event_by_rpc ${name} event.length is 0, only update ${name} last_id: ${latestBlock}`);
            return;
        }

        logger.info(`fetch_deposit_event_by_rpc events data: ${name}, ${events.length}`);

        // Prepare batch insert data
        const insertQueries = [];
        let maxBlockNumber = last_id;

        for (const event of events) {
            const { sender, user ,amount } = event.returnValues;
            const blockNumber = event.blockNumber;
            let transaction_hash = event.transactionHash;
            
            if (blockNumber >= last_id) {
				let to  =  route.to;
                const queue_data = {
                    contract: to,
                    address: sender || user,
                    amount: amount.toString(),
                };
                logger.info(`fetch_deposit_event_by_rpc add to queue:' ${queue_data.address} ${queue_data.amount} ${blockNumber}`);

                // Check if transaction already exists
                const existingTransaction = await DBUtils.query(
                    `SELECT * FROM transactions 
                     WHERE name = ? 
                     AND address = ? 
                     AND block_number = ? 
                     AND transaction_hash = ?`,
                    [name, queue_data.address, blockNumber, transaction_hash]
                );

                if (existingTransaction.length > 0) {
                    const existingStatus = existingTransaction[0].status;
                    if (existingStatus === 'INIT') {
                        logger.info(`Transaction in INIT status for ${name}, ${queue_data.address}, block ${blockNumber}, hash ${transaction_hash}. Retrying.`);
                        // Record retry transaction
                        insertQueries.push({
                            sql: `INSERT INTO retry_transactions (name, address, block_number, transaction_hash, retry_timestamp) 
                                 VALUES (?, ?, ?, ?, ?)`,
                            params: [name, queue_data.address, blockNumber, transaction_hash, new Date().toISOString().slice(0, 19).replace('T', ' ')]
                        });
                    } else {
                        logger.info(`Transaction already exists for ${name}, ${queue_data.address}, block ${blockNumber}, hash ${transaction_hash}. Skipping.`);
                        continue;
                    }
                } else {
                    // Prepare to insert new transaction record
                    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    const block_timestamp = timestamp;
                    insertQueries.push({
                        sql: `INSERT INTO transactions (name, address, amount, block_number, transaction_hash, timestamp, block_timestamp, status) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, 'INIT')`,
                        params: [name, queue_data.address, queue_data.amount, blockNumber, transaction_hash, timestamp, block_timestamp]
                    });
                }

                if (blockNumber > maxBlockNumber) {
                    maxBlockNumber = blockNumber;
                }
            }
        }

        // If there are records to insert, execute the transaction
        if (insertQueries.length > 0) {
            // Add query to update last_id
            insertQueries.push({
                sql: `UPDATE last_ids SET last_id = ? WHERE name = ?`,
                params: [maxBlockNumber, name]
            });

            try {
                await DBUtils.transaction(insertQueries);
                logger.info(`Successfully processed ${insertQueries.length - 1} transactions and updated last_id to ${maxBlockNumber}`);
            } catch (error) {
                logger.error('Error in transaction batch:', error);
                throw error;
            }
        } else {
            // If there are no new transactions, only update last_id
            await DBUtils.query(`UPDATE last_ids SET last_id = ? WHERE name = ?`, [latestBlock, name]);
            logger.info(`No new transactions, updated last_id to ${latestBlock}`);
        }
    } catch (err) {
        logger.error('fetch_deposit_event_by_rpc Error:', err);
    } finally {
        try {
            await releaseLock(lockName);
        } catch (err) {
            logger.error('Error releasing lock:', err);
        }
    }
}


module.exports = {
	listen_deposit_events
};
