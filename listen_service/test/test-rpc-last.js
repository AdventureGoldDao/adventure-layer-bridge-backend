const { Web3 } = require('web3');
const abis = require('../contracts/abis');
const mysql = require('mysql');
const util = require('util');

let rpcWb3 = new Web3("http://localhost:8545");
let l1_contract_address = "0xE8b68A74D8527e650E144BfeCD999302b676DF2f";
let l1_contract = new rpcWb3.eth.Contract(abis.deposit, l1_contract_address);

var last_id = 0;
var name = 'l1';

async function fetch_deposit_event_by_rpc() {
    let db;
    try {
        db = mysql.createConnection({
            host: '127.0.0.1',
            port: 3307,
            user: 'root',
            password: '123456',
            database: 'agld'
        });

        const connect = util.promisify(db.connect).bind(db);
        const query = util.promisify(db.query).bind(db);

        await connect();
        console.log('Connected to MySQL');

        const rows = await query(`SELECT last_id FROM last_ids WHERE name = '${name}'`);
        if (rows.length > 0) {
            last_id = rows[0].last_id;
            console.log(`Last ID for ${name}: ${last_id}`);
        } else {
            console.log(`No last ID found for ${name}`);
        }

        const latestBlock = await rpcWb3.eth.getBlockNumber();
        const fromBlock = last_id + 1; // 从上次记录的区块号开始查询
        console.log(fromBlock, latestBlock);

        // 查询从 fromBlock 到 latestBlock 的所有 Deposit 事件
        const events = await l1_contract.getPastEvents('Deposit', {
            fromBlock: fromBlock,
            toBlock: latestBlock
        });

        for (const event of events) {
            const { sender, amount } = event.returnValues;
            const blockNumber = event.blockNumber;

            if (blockNumber > last_id) {
                const queue_data = {
                    contract: l1_contract_address,
                    address: sender,
                    amount: amount.toString(),
                };
                console.log(queue_data);
                console.log('fetch_deposit_event_by_rpc add to queue:', queue_data.contract, queue_data.address, queue_data.amount, blockNumber);
                last_id = blockNumber;

                const existingTransaction = await query(`SELECT * FROM transactions WHERE name = '${name}' AND address = '${queue_data.address}' AND block_number = ${blockNumber}`);
                if (existingTransaction.length > 0) {
                    console.log(`Transaction already exists for ${name}, ${queue_data.address}, block ${blockNumber}. Skipping.`);
                    continue;
                }
                
                //insert transaction record
                const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                await query(`INSERT INTO transactions (name, address, amount, block_number, timestamp, transaction_hash) VALUES ('${name}', '${queue_data.address}', '${queue_data.amount}', ${blockNumber}, '${timestamp}', '${event.transactionHash}')`);
                console.log('Transaction record inserted:', queue_data.address, queue_data.amount, blockNumber, timestamp, event.transactionHash);
                
                await query(`UPDATE last_ids SET last_id = ${last_id} WHERE name = '${name}'`);
                console.log('update last_id:', last_id);
            }
        };

        
    } catch (err) {
        console.error('fetch_deposit_event_by_rpc Error:', err);
    } finally {
        db.end();
    }
}

fetch_deposit_event_by_rpc()