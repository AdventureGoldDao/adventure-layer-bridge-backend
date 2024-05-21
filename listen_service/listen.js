const w3 = require('web3');
require('dotenv').config();
const { Web3 } = require('web3');
const BN = require('bn.js'); // 导入 BN 库
const abis = require('./contracts/abis');

const chainConfig = {
	l2_wss_url: 'ws://3.84.203.161:8548',
	l1_wss_url: 'wss://sepolia.drpc.org',
	l2_rpc_url: 'http://3.84.203.161:8547',
	l1_rpc_url: 'https://rpc.sepolia.org',
	owner_address: process.env.L2_OWNER_ADDRESS,
	owner_private_key: process.env.L2_OWNER_PRIVATE_KEY,
	l1_name: 'Sepolia Testnet',
	l2_name: 'Adventure Layer devnet',
	l1_contract_address:'0x5121E26E9f08F176b9e9aF0BF95b3FCd8a9a4B24',
	l2_contract_address:'0xC214Ce0a2C22AaD2e6Fa48E89e5eF096ce6D7d92',
}

console.log('chainConfig.owner:', chainConfig.owner_address);
// Connect to an Ethereum node
const sepoliaWsWeb3 = new Web3(chainConfig.l1_wss_url); // Update with your Ethereum node URL
const l2WsWeb3 = new Web3(chainConfig.l2_wss_url); // Update with your Ethereum node URL
const sepoliaRpcWeb3 = new Web3(chainConfig.l1_rpc_url); // Update with your Ethereum node URL
const l2RpcWeb3 = new Web3(chainConfig.l2_rpc_url); // Update with your Ethereum node URL

// ABI of the EtherReceiver contract
const abi = abis.deposit;

async function do_transaction(net_name, recipient, amount) {

	// Sender's account address and private key
	const senderAddress = chainConfig.owner_address;
	const senderPrivateKey = chainConfig.owner_private_key;
	console.log(net_name, 'call do_transaction', senderAddress, recipient, amount);
	let rpc_web3 = l2RpcWeb3;
	if (net_name == chainConfig.l1_name) {
		rpc_web3 = sepoliaRpcWeb3;
	}

	// Recipient's account address
	const recipientAddress = recipient;
	// Amount to transfer (unit is wei)
	const amountToSend = amount; // Replace with the amount to transfer

	let gasPriceGwei = '5'; // Replace with the desired gas price in Gwei
	let gasLimit = 21000; // Replace with the desired gas limit  
	// Sign the transaction with sender's private key and send it

	let transactionObject = {};
	try {

		if (net_name == chainConfig.l1_name) {
			// 获取当前区块
			const block = await rpc_web3.eth.getBlock('latest');
			const baseFeePerGas = new BN(block.baseFeePerGas); // 将 baseFeePerGas 转换为 BN 对象
			// 设置费用参数
			const maxPriorityFeePerGas = new BN(w3.utils.toWei('1', 'gwei')); // 优先费用
			// 计算最大费用：最大费用 = 基础费用 * 2 + 优先费用
			const maxFeePerGas = baseFeePerGas.mul(new BN(1.1)).add(maxPriorityFeePerGas);
			// Construct the transaction object
			transactionObject = {
				//nonce: accountNonce,
				from: senderAddress,
				to: recipientAddress,
				value: amountToSend,//w3.utils.toWei(amountToSend, 'ether'),
				gas: gasLimit,
				maxFeePerGas: maxFeePerGas.toString(),
				maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
			}
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
		rpc_web3.eth.sendSignedTransaction(signedTx.rawTransaction)
			.on('transactionHash', txHash => {
				console.log(net_name, 'Transaction Hash:', txHash);
			})
			.on('receipt', receipt => {
				console.log(net_name, 'Transaction Receipt:', receipt);
			})
			.on('error', err => {
				console.error(net_name, 'Transaction Error:', err);
			})

			
	} catch (err) {
		console.error(net_name, 'Signing Error:', err);
	}
}


function listen_deposit_events(msg_queue) {
	// Create contract instance
	const sepoliaReceiverContract = new sepoliaWsWeb3.eth.Contract(abi, chainConfig.l1_contract_address);
	const l2ReceiverContract = new l2WsWeb3.eth.Contract(abi, chainConfig.l2_contract_address);
	listen_deposit_event_from_contract(chainConfig.l1_name, sepoliaReceiverContract, msg_queue);
	listen_deposit_event_from_contract(chainConfig.l2_name, l2ReceiverContract, msg_queue);

}

function listen_deposit_event_from_contract(net_name, target_contract, msg_queue) {

	// Subscribe to the deposit event
	target_contract.events.Deposit()
		.on('data', function (event) {
			const senderAddress = event.returnValues.sender;
			const sendAmount = event.returnValues.amount;
			console.log(net_name,'Contract Event received - Sender:', senderAddress, 'Amount:', sendAmount);
			//choose the opposite net
			let result_net_name = ((net_name == chainConfig.l1_name) ? chainConfig.l2_name : chainConfig.l1_name);
			msg_queue.push({
				net_name:result_net_name,
				address:senderAddress,
				amount:sendAmount.toString(),
			}); // Add data to the queue

		})
}


module.exports = {
	do_transaction,
	listen_deposit_events
  };