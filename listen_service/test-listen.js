const w3 = require('web3');
require('dotenv').config();
const {Web3} = require('web3');
const BN = require('bn.js'); // 导入 BN 库

const sepoliaConfig = {
    //url: 'wss://ethereum-sepolia-rpc.publicnode.com',
	url: 'wss://sepolia.drpc.org',
    //address :'0x48C5d059f77518E7d73da15C7c7d168f766497A1',
	//address :'0x343B4eAb4BE7C2D2CAD093bE664e9423759f18b4',
	address:'0x5121E26E9f08F176b9e9aF0BF95b3FCd8a9a4B24',
}
const l2Config = {
    url: 'ws://3.84.203.161:8548',
    //address :'0xEb2b4bdE5988F4DeBC81F4866cD04287BDF0077A',
	address :'0xC214Ce0a2C22AaD2e6Fa48E89e5eF096ce6D7d92',
}
const chainConfig = {
	l2_wss_url: 'ws://3.84.203.161:8548',
	l1_wss_url: 'wss://sepolia.drpc.org',
	l2_rpc_url: 'http://3.84.203.161:8547',
	l1_rpc_url: 'https://rpc.sepolia.org',
	owner_address: process.env.L2_OWNER_ADDRESS,
	owner_private_key: process.env.L2_OWNER_PRIVATE_KEY,
	l1_name: 'Sepolia Testnet',
	l2_name: 'Adventure Layer devnet',
}
console.log('chainConfig.owner:',chainConfig.owner_address);
// Connect to an Ethereum node
const sepoliaWsWeb3 = new Web3(chainConfig.l1_wss_url); // Update with your Ethereum node URL
const l2WsWeb3 = new Web3(chainConfig.l2_wss_url); // Update with your Ethereum node URL
const sepoliaRpcWeb3 = new Web3(chainConfig.l1_rpc_url); // Update with your Ethereum node URL
const l2RpcWeb3 = new Web3(chainConfig.l2_rpc_url); // Update with your Ethereum node URL

// ABI of the EtherReceiver contract
const abi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Deposit",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Withdrawal",
		"type": "event"
	},
	{
		"inputs": [
			
		],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "getBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

async function sendToAddress(net_name,rpc_web3, sender, privateKey, recipient, amount) {

	console.log(net_name, 'call sendToAddress', sender,recipient,amount);
	// Sender's account address and private key
	const senderAddress = sender
	const senderPrivateKey = privateKey  
	// Recipient's account address
	const recipientAddress = recipient  
	// Amount to transfer (in Ether)
	const amountToSend = '0.1'; // Replace with the amount to transfer
  
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
			//const txCnt = await rpc_web3.eth.getTransactionCount(chainConfig.owner_address);
			//const accountNonce = '0x' + (txCnt).toString(16);
			//console.log('txCnt:', txCnt, 'accountNonce:', accountNonce);
			// Construct the transaction object
			transactionObject = {
				//nonce: accountNonce,
				from: senderAddress,
				to: recipientAddress,
				value: w3.utils.toWei(amountToSend, 'ether'),
				//gasPrice: w3.utils.toWei(gasPriceGwei, 'gwei'), // Convert gas price to Wei
				gas: gasLimit,
				maxFeePerGas: maxFeePerGas.toString(),
				maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
			}
		}
	  else {

		transactionObject = {
			from: senderAddress,
			to: recipientAddress,
			value: w3.utils.toWei(amountToSend, 'ether'),
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

  
// Create contract instance
const sepoliaReceiverContract = new sepoliaWsWeb3.eth.Contract(abi, sepoliaWsWeb3.address);
const l2ReceiverContract = new l2WsWeb3.eth.Contract(abi, l2WsWeb3.address);
// Subscribe to the FundsReceived event
sepoliaReceiverContract.events.Deposit()
    .on('data', function (event) {
		const senderAddress = event.returnValues.sender;
		const sendAmount = event.returnValues.amount;
        console.log('sepoliaReceiverContract Event received - Sender:', senderAddress, 'Amount:', sendAmount);

		if(senderAddress != '0x20E37EbE5709F7B6C7E2f300fa0fb8b2f8DcC733'){
			return; //skip
		}
		sendToAddress( chainConfig.l2_name, l2RpcWeb3, chainConfig.owner_address, 
			chainConfig.owner_private_key, senderAddress, sendAmount);
    })

l2ReceiverContract.events.Deposit()
    .on('data', function (event) {
		const senderAddress = event.returnValues.sender;
		const sendAmount = event.returnValues.amount;
        console.log('l2ReceiverContract Event received - Sender:', event.returnValues.sender, 'Amount:', event.returnValues.amount);
		if(senderAddress != '0x20E37EbE5709F7B6C7E2f300fa0fb8b2f8DcC733'){
			return; //skip
		}
		sendToAddress(chainConfig.l1_name, sepoliaRpcWeb3, chainConfig.owner_address, chainConfig.owner_private_key, senderAddress, sendAmount);
    })

process.stdin.resume();
    