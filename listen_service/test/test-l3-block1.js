const { Web3 } = require('web3');
const { ethers } = require('ethers');

const web3 = new Web3('https://rpc-devnet.adventurelayer.dev/node1/shard');


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


// Configuration item maintains information of multiple accounts and peer accounts
const accounts = [
    {
        senderAddress: '0xa659f022cb8d0Df682C327d2f16B6f2f41AD2aeA',
        senderPrivateKey: '0x7fd651a63dcca634d0b527bde1b96f1d2ee246af361f03f951723db27e24e54c',
        recipientAddress: '0xbc8C79C69e40F404DAA9f5CC17Cb35868C262CfD',
    },
    {
        senderAddress: '0x4C59A2AA9F39554b9f8D474d70AA3A7cB2467771',
        senderPrivateKey: '0x7196e384031bb4f6e3647ee2166c574c758e44c4c79907d23ac5a602a96f3340',
        recipientAddress: '0xbc8C79C69e40F404DAA9f5CC17Cb35868C262CfD',
    },
    {
        senderAddress: '0x53D6051da3057B7831a94224aE0174585B609e59',
        senderPrivateKey: '228365f13616c96906479b0e1dabbe3e124a3f08ba83ee16fe565d5376d2bfbd',
        recipientAddress: '0xbc8C79C69e40F404DAA9f5CC17Cb35868C262CfD',
    }
    // more accounts can be added
];

let count = 0;
const maxLoops = 1; // Set the number of times to cycle

const interval = setInterval(() => {
    const accountIndex = count % accounts.length; // 循环使用账户
    doTrans(accounts[accountIndex], count);
    count++;
    if (count >= accounts.length * maxLoops) {
        clearInterval(interval);
    }
}, 250);

function doTrans(account, count) {
    // Amount to transfer (in Ether)
    const amountToSend = '0.1'; // Replace with the amount to transfer

    const gasPriceGwei = '15'; // Replace with the desired gas price in Gwei
    const gasLimit = 21000; // Replace with the desired gas limit

    // Construct the transaction object
    const transactionObject = {
        from: account.senderAddress,
        to: account.recipientAddress,
        value: web3.utils.toWei(amountToSend, 'ether'),
        gasPrice: web3.utils.toWei(gasPriceGwei, 'gwei'), // Convert gas price to Wei
        gas: gasLimit,
    };

    // Record the time when the transaction is sent
    const startTime = Date.now();

    // Sign the transaction with sender's private key and send it
    web3.eth.accounts.signTransaction(transactionObject, account.senderPrivateKey)
        .then(signedTx => {
            web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', txHash => {
                    // console.log('Transaction Hash:', txHash);
                    // Record the time when the transaction hash is received
                    const hashReceivedTime = Date.now();
                    console.log('Transaction ', count, ' Time to get transaction hash:', hashReceivedTime - startTime, 'ms');
                })
                .on('receipt', receipt => {
                    //console.log('Transaction Receipt:', receipt);
                    // Record the time when the transaction receipt is received
                    const receiptReceivedTime = Date.now();
                    console.log('Transaction ', count, ' Time to confirm transaction:', receiptReceivedTime - startTime, 'ms');
                    
                })
                .on('error', err => {
                    console.error('Transaction Error:', err);
                });
        })
        .catch(err => {
            console.error('Signing Error:', err);
        });
}