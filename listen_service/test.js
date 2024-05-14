const {Web3} = require('web3');
const sepoliaConfig = {
    url: 'wss://ethereum-sepolia-rpc.publicnode.com',
    address :'0x48C5d059f77518E7d73da15C7c7d168f766497A1',
}
const l2Config = {
    url: 'ws://3.84.203.161:8548',
    address :'0xEb2b4bdE5988F4DeBC81F4866cD04287BDF0077A'
}

// Connect to an Ethereum node
const sepoliaWeb3 = new Web3(sepoliaConfig.url); // Update with your Ethereum node URL
const l2Web3 = new Web3(l2Config.url); // Update with your Ethereum node URL
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
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
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

// Create contract instance
const sepoliaReceiverContract = new sepoliaWeb3.eth.Contract(abi, sepoliaWeb3.address);
const l2ReceiverContract = new l2Web3.eth.Contract(abi, l2Web3.address);
// Subscribe to the FundsReceived event
sepoliaReceiverContract.events.Deposit()
    .on('data', function (event) {
        console.log('sepoliaReceiverContract Event received - Sender:', event.returnValues.sender, 'Amount:', event.returnValues.amount);
    })

l2ReceiverContract.events.Deposit()
    .on('data', function (event) {
        console.log('l2ReceiverContract Event received - Sender:', event.returnValues.sender, 'Amount:', event.returnValues.amount);
    })

process.stdin.resume();
    