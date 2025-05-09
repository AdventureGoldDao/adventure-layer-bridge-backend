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
// ABI of the EtherReceiver contract
const abi = abis.deposit;

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
	
	logger.info('L2 name ' + chainConfig.l2_name);
    logger.info('L2 contract Address ' + chainConfig.l2_contract_address);
    logger.info(`L2 Owner Address: ${chainConfig.l2_owner_address}`);
    logger.info(`L2 Owner Private Key: ${maskPrivateKey(chainConfig.l2_owner_private_key)}`);

    for (let i = 1; i <= 10; i++) {
        const shardName = chainConfig[`shard${i}_name`];
        if (shardName == undefined) {
			break;
        }
		logger.info('Shard${i} name ' + shardName);
		logger.info('Shard${i} contract Address ' + chainConfig[`shard${i}_contract_address`]);
        logger.info(`Shard${i} Owner Address: ${chainConfig[`shard${i}_owner_address`]}`);
        logger.info(`Shard${i} Owner Private Key: ${maskPrivateKey(chainConfig[`shard${i}_owner_private_key`])}`);
    }
}

printChainConfig();

//connect to the blockchain
const l1 = new BlockchainConfig(chainConfig.l1_name,chainConfig.l1_rpc_url,chainConfig.l1_wss_url);
const l2 = new BlockchainConfig(chainConfig.l2_name,chainConfig.l2_rpc_url,chainConfig.l2_wss_url);

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

    if (shardName && shardRpcUrl && shardWssUrl) {
        const shard = new BlockchainConfig(shardName, shardRpcUrl, shardWssUrl);
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
    abi
);
const l2_contract = new ContractConfig(
    chainConfig.l2_contract_address,
    l2,
    chainConfig.l2_owner_address,
    chainConfig.l2_owner_private_key,
    abi
);

const routes = new Map();
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


async function do_transaction(to, recipient, amount) {

	if(chainConfig.mock_transactions){
		logger.info('mock_transactions is true');
		return true;
	}

	// Sender's account address and private key
	const senderAddress = to.owner_address;
	const senderPrivateKey = to.owner_private_key;
	logger.info(to.chainConfig.name, 'call do_transaction', senderAddress, recipient, amount);
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
			logger.info("Nonce type:", typeof transactionObject.nonce);  
                        logger.info("Gas type:", typeof transactionObject.gas);     


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


		logger.info(net_name, 'begin Transaction:', JSON.stringify(transactionObject));
		const signedTx = await rpc_web3.eth.accounts.signTransaction(transactionObject, senderPrivateKey)
		await rpc_web3.eth.sendSignedTransaction(signedTx.rawTransaction)
			.on('transactionHash', txHash => {
				logger.info(net_name, 'Transaction Hash:', txHash);
			})
			.on('receipt', receipt => {
				logger.info(net_name, 'Transaction Receipt:', receipt);
			})
			.on('error', err => {
				logger.error(net_name, 'Transaction Error:', err);
			}).catch(err => {
				logger.error(net_name, 'Transaction catch:', err);
			})

		return true;
	} catch (err) {
		logger.error(net_name, 'Signing Error:', err);
	}
	return false;
}


function listen_deposit_events() {
	logger.info('listen_deposit_events start');
	let lock = false;
	setInterval(() => {
		if(lock){
			return;
		}
		lock = true;
		try {
			if(chainConfig.l1_graph_query_use == 'true'){
				//use graph sql to query the latest deposit events
				fetch_deposit_event_by_graph_sql('L1->L2', l2_contract );
			}else{
				//use rpc to query the latest deposit events
				fetch_deposit_event_by_rpc('L1->L2', new Route(l1_contract, l2_contract) );
			}
			for (const [name, route] of routes) {
				fetch_deposit_event_by_rpc(name, route );
			}
		} catch (error) {
			logger.error('Error in listen_deposit_events interval:', error);
		} finally {
			lock = false;
		}
	}, 5000);
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
        var last_id = 0;
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
                    const existingTransaction = await DBUtils.query(
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
						}else{
							logger.info(`Transaction already exists for ${name}, ${queue_data.address}, block ${blockNumber}, hash ${transaction_hash}. Skipping.`);
							continue;
						}
                    }
					if(!retry_transaction){
						//insert transaction record with INIT status
						const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
						const block_timestamp = new Date(elem.blockTimestamp * 1000).toISOString().slice(0, 19).replace('T', ' ');
						await DBUtils.query(
							`INSERT INTO transactions (name, address, amount, block_number, transaction_hash, timestamp, block_timestamp, status) 
							VALUES (?, ?, ?, ?, ?, ?, ?, 'INIT')`,
							[name, queue_data.address, queue_data.amount, blockNumber, transaction_hash, timestamp, block_timestamp]
						);
						logger.info('Transaction record inserted with INIT status:', queue_data.address, queue_data.amount, blockNumber);
					}

                    //do transaction
                    const result = await do_transaction(
                        queue_data.contract,
                        queue_data.address,
                        queue_data.amount,
                    );

                    //update transaction status
                    if(result) {
                        await DBUtils.query(
                            `UPDATE transactions SET status = 'SUCCESS' WHERE name = ? AND address = ? AND block_number = ?`,
                            [name, queue_data.address, blockNumber]
                        );
                        logger.info('Transaction status updated to SUCCESS:', queue_data.address, queue_data.amount, blockNumber);
                    } else {
                        await DBUtils.query(
                            `UPDATE transactions SET status = 'FAIL' WHERE name = ? AND address = ? AND block_number = ?`,
                            [name, queue_data.address, blockNumber]
                        );
                        logger.error('Transaction status updated to FAIL:', queue_data.address, queue_data.amount, blockNumber);
                        return;
                    }

                    last_id = blockNumber;

                    await DBUtils.query(`UPDATE last_ids SET last_id = ${last_id} WHERE name = '${name}'`);
                    logger.info('update last_id:', last_id);
                }
                else {
                    logger.info('fetch_deposit_event_by_graph_sql skip data:', JSON.stringify(elem), elem.id);
                }
            }
            
        }


    }
    catch(err){
        logger.error('fetch_deposit_event_by_graph_sql Error:', err);
    } finally {
        // release lock
        await releaseLock(lockName);
    }
}

async function fetch_deposit_event_by_rpc(name, route) {
    const lockName = `${name}`;
	route.times++;
	// try to acquire lock
	const hasLock = await acquireLock(lockName);
	logger.info(`fetch_deposit_event_by_rpc ${name} ${route.times} ${hasLock}`);

	if (!hasLock) {
		logger.info(`Another instance is processing ${name}  ${route.times} events`);
		return;
	}
    try {

		logger.info(`start ${name} ${route.times} ${hasLock}`);
        // original processing logic
        const rows = await DBUtils.query(`SELECT last_id FROM last_ids WHERE name = '${name}'`);
        var last_id = 0;
        if (rows.length > 0) {
            last_id = rows[0].last_id;
            logger.info(`Last ID for ${name}: ${last_id}`);
        } else {
            logger.error(`No last ID found for ${name}`);
            return;
        }

        let latestBlock = await route.from.chainConfig.rpcWb3.eth.getBlockNumber();
        const fromBlock = last_id + 1; // start from last block number
        logger.info('fetch_deposit_event_by_rpc query data:', name, fromBlock, latestBlock);

		if(fromBlock > latestBlock){
			latestBlock = fromBlock+1;
			return;
		}

        // query all deposit events from fromBlock to latestBlock
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
                logger.info(queue_data);
                logger.info('fetch_deposit_event_by_rpc add to queue:', queue_data.contract, queue_data.address, queue_data.amount, blockNumber);
				//check if the transaction already exists
				const existingTransaction = await DBUtils.query(
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
					if (existingStatus === 'INIT') {
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
					const block_timestamp = timestamp;
					await DBUtils.query(
						`INSERT INTO transactions (name, address, amount, block_number, transaction_hash, timestamp, block_timestamp, status) 
						VALUES (?, ?, ?, ?, ?, ?, ?, 'INIT')`,
						[name, queue_data.address, queue_data.amount, blockNumber, transaction_hash, timestamp, block_timestamp]
					);
					logger.info('Transaction record inserted with INIT status:', queue_data.address, queue_data.amount, blockNumber);
				}

                //do transaction
                const result = await do_transaction(
                    queue_data.contract,
                    queue_data.address,
                    queue_data.amount,
                );

                //update transaction status
                if(result) {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'SUCCESS' WHERE name = ? AND address = ? AND block_number = ?`,
                        [name, queue_data.address, blockNumber]
                    );
                    logger.info('Transaction status updated to SUCCESS:', queue_data.address, queue_data.amount, blockNumber);
                } else {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'FAIL' WHERE name = ? AND address = ? AND block_number = ?`,
                        [name, queue_data.address, blockNumber]
                    );
                    logger.error('Transaction status updated to FAIL:', queue_data.address, queue_data.amount, blockNumber);
                    return;
                }

                //update last_id
                last_id = blockNumber;
                await DBUtils.query(`UPDATE last_ids SET last_id = ${last_id} WHERE name = '${name}'`);
                logger.info('update last_id:', last_id);
            }
        };
		
    } catch (err) {
        logger.error('fetch_deposit_event_by_rpc Error:', err);
    } finally {
        // release lock
		logger.info(`releaseLock ${lockName} ${route.times}`);
        await releaseLock(lockName);
    }
}








module.exports = {
	listen_deposit_events
};
