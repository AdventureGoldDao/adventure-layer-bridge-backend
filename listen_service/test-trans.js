const { Web3 } = require('web3');
const web3 = new Web3('http://3.84.203.161:8547');

// Sender's account address and private key
const senderAddress = '0x1b3695A4E3B1aD44f12F87E9190bAbDAC8CCa9d1'; // Replace with the sender's account address
const senderPrivateKey = '0x1dc13b71ccf063416c7937e08f9ae8b6975415bfef9594a8c18170daf28bd823'; // Replace with the sender's private key

// Recipient's account address
const recipientAddress = '0x20E37EbE5709F7B6C7E2f300fa0fb8b2f8DcC733'; // Replace with the recipient's account address

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
// Sign the transaction with sender's private key and send it
web3.eth.accounts.signTransaction(transactionObject, senderPrivateKey)
    .then(signedTx => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', txHash => {
                console.log('Transaction Hash:', txHash);
            })
            .on('receipt', receipt => {
                console.log('Transaction Receipt:', receipt);
            })
            .on('error', err => {
                console.error('Transaction Error:', err);
            });
    })
    .catch(err => {
        console.error('Signing Error:', err);
    });
