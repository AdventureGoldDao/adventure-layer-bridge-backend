const axios = require('axios');

async function testRPCAddress(rpcUrl) {
    try {
        const response = await axios.get(rpcUrl);
        if (response.status === 200) {
            console.log('RPC address is valid.');
        } else {
            console.error('RPC address is not responding with status 200.');
        }
    } catch (error) {
        console.error('Error connecting to RPC address:', error.message);
    }
}

// Example usage
//const rpcUrl = 'http://3.84.203.161:8547';
const rpcUrl = 'https://rpc.adventurelayer.dev/'; // Replace with your RPC address
testRPCAddress(rpcUrl);
