const { Web3 } = require('web3');
const { ethers } = require('ethers');

const web3 = new Web3('http://3.84.203.161:8547');



/*
const web3Ws = new Web3('wss://rpc-devnet.adventurelayer.dev/node1/shard');
    // Track block generation times
let lastBlockTime = 0;

web3Ws.eth.subscribe('newBlockHeaders', (error, result) => {
    console.error('newBlockHeaders:', error ,result);
    if (!error) {
        const currentBlockTime = Date.now();
        if (lastBlockTime !== 0) {
            const timeDiff = currentBlockTime - lastBlockTime;
            console.log('Time between blocks:', timeDiff, 'ms');
        }
        lastBlockTime = currentBlockTime;
    } else {
        console.error('Error subscribing to newBlockHeaders:', error);
    }
});

// Check WebSocket connection status
web3Ws.currentProvider.on('connect', () => {
   // console.log('WebSocket connected');
});

web3Ws.currentProvider.on('error', (err) => {
    console.error('WebSocket error:', err);
});

web3Ws.currentProvider.on('end', (e) => {
    console.log('WebSocket disconnected:', e);
});

*/



function testBlockTime() {
    try {
        const wsProvider = new ethers.providers.WebSocketProvider("wss://rpc-devnet.adventurelayer.dev/node1/shard");
        
        let lastBlockTime = 0;
        
        wsProvider.on('block', (blockNumber) => {
            const currentBlockTime = Date.now();
            if (lastBlockTime !== 0) {
                const timeDiff = currentBlockTime - lastBlockTime;
                console.log('Time between blocks:', timeDiff, 'ms');
            }
            lastBlockTime = currentBlockTime;
            
             console.log('New block received. Block #', blockNumber);
            wsProvider.getBlock(blockNumber).then((block) => {
                //console.log(block);
            }).catch((error) => {
                console.error('Error fetching block details:', error);
            });
        });

        wsProvider.on('error', (error) => {
            console.error('Provider error:', error);
        });
    } catch (error) {
        console.error('Error fetching:', error);
    }
}

testBlockTime();

// let lastBlockNumber = 0;
// let lastBlockTime2 = 0;

// setInterval(async () => {
//     try {
//         const latestBlock = await web3.eth.getBlock('latest');
//         if (latestBlock.number !== lastBlockNumber) {
//             const currentBlockTime = Date.now();
//             if (lastBlockNumber !== 0) {
//                 const timeDiff = currentBlockTime - lastBlockTime2;
//                 console.error('Time between blocks:', timeDiff, 'ms');
//             }
//             lastBlockNumber = latestBlock.number;
//             lastBlockTime2 = currentBlockTime;
//         }
//     } catch (error) {
//         console.error('Error fetching latest block:', error);
//     }
// }, 100); // Adjust the interval as needed


// doTrans 
doTrans(()=>doTrans());



function doTrans(callback) {
    // Sender's account address and private key
    const senderAddress = '0xa659f022cb8d0Df682C327d2f16B6f2f41AD2aeA'; // Replace with the sender's account address
    const senderPrivateKey = '0x7fd651a63dcca634d0b527bde1b96f1d2ee246af361f03f951723db27e24e54c'; // Replace with the sender's private key


    // Recipient's account address
    const recipientAddress = '0x4C59A2AA9F39554b9f8D474d70AA3A7cB2467771'; // Replace with the recipient's account address


    // Amount to transfer (in Ether)
    const amountToSend = '0.1'; // Replace with the amount to transfer

    const gasPriceGwei = '15'; // Replace with the desired gas price in Gwei
    const gasLimit = 21000; // Replace with the desired gas limit


    // Construct the transaction object
    const transactionObject = {
        from: senderAddress,
        to: recipientAddress,
        value: web3.utils.toWei(amountToSend, 'ether'),
        gasPrice: web3.utils.toWei(gasPriceGwei, 'gwei'), // Convert gas price to Wei
        gas: gasLimit,
    };

    // Record the time when the transaction is sent
    const startTime = Date.now();

    // Sign the transaction with sender's private key and send it
    web3.eth.accounts.signTransaction(transactionObject, senderPrivateKey)
        .then(signedTx => {
            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', txHash => {
                    // console.log('Transaction Hash:', txHash);
                    // Record the time when the transaction hash is received
                    const hashReceivedTime = Date.now();
                    console.log('Time to get transaction hash:', hashReceivedTime - startTime, 'ms');
                })
                .on('receipt', receipt => {
                    //console.log('Transaction Receipt:', receipt);
                    // Record the time when the transaction receipt is received
                    const receiptReceivedTime = Date.now();
                    console.log('Time to confirm transaction:', receiptReceivedTime - startTime, 'ms');
                    
                    if(callback!=null)
                        callback();

                })
                .on('error', err => {
                    console.error('Transaction Error:', err);
                });
        })
        .catch(err => {
            console.error('Signing Error:', err);
        });
}

