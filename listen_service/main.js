// import './style.css';
// import { Web3 } from 'web3';
const { Web3 } = require('web3');
const abis = require('./contracts/abis');
const addresses = require('./contracts/addresses');

const sepoliaContractName = 'ceaErc20'
const alContractName = 'ceaErc20'

const sepoliaAbiName = 'erc20'
const alAbiName = 'erc20'

const fundFuncName = ''

async function monitorSepolia(sourceUrl, targetWeb, targetConfig) {
  const web3 = new Web3(sourceUrl); // 'https://rpc.sepolia.org'

  const blockNumber = await web3.eth.getBlockNumber();
  const chainId = await web3.eth.getChainId();

  const abi = abis[sepoliaAbiName]
  const contractAddress = addresses[sepoliaContractName]
  console.log("Sepolia Test Network", blockNumber, chainId);
  const etherReceiverContract = new web3.eth.Contract(abi, contractAddress);
  // console.log(etherReceiverContract.events.allEvents())
}

async function monitorAdventureLayer(sourceUrl, targetWeb, targetConfig) {
  const web3 = new Web3(sourceUrl); // 'http://3.84.203.161:8547'

  const blockNumber = await web3.eth.getBlockNumber();
  const chainId = await web3.eth.getChainId();

  const abi = abis[alAbiName]
  const contractAddress = addresses[alContractName]
  console.log("Adventure Layer", blockNumber, chainId);
  const etherReceiverContract = new web3.eth.Contract(abi, contractAddress);
  console.log(etherReceiverContract.events.allEvents())
  console.log(etherReceiverContract.methods)

  etherReceiverContract.events[fundFuncName]().on('data', async (event) => {
    const senderAddress = event.returnValues.sender
    const sendAmount = event.returnValues.amount
    console.log('Event received - Sender:', event.returnValues.sender, 'Amount:', event.returnValues.amount);
    const targetReceiverContract = new targetWeb.eth.Contract(abis[targetConfig.abi], targetConfig.contract);
    const receipt = await targetReceiverContract.methods.withdraw(sender, BigInt(myNumber)).send({
      sender: senderAddress,
      amount: sendAmount,
    })
  })
}

async function main() {
  const webSepolia = new Web3('https://rpc.sepolia.org');
  const webAl = new Web3('http://3.84.203.161:8547');

  monitorAdventureLayer('http://3.84.203.161:8547', webSepolia, {
    contract: sepoliaContractName,
    abi: sepoliaAbiName,
  })
  monitorSepolia('https://rpc.sepolia.org', webAl, {
    contract: alContractName,
    abi: alAbiName,
  })
  // etherReceiverContract.events
  // let startAt = new Date();
  setInterval(function () {
    // console.log('test', new Date())
    console.log('heart beat', new Date())
  }, 5000)
  // process.stdin.resume();
}
// For more methods: https://docs.web3js.org/libdocs/Web3Eth

// document.querySelector(
//   '#app'
// ).innerHTML = `Block Number is ${blockNumber} <br> Chain Id: ${chainId}`;
main()

// console.log("Done!");
