const DBUtils = require('../listen_service/db_utils.js');

async function test_db_utils() {
    const sql = 'SELECT 1 + 1 AS  solution';
    const result = await DBUtils.query(sql);
    console.log(result); 
}

test_db_utils();